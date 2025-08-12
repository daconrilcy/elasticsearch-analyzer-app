from __future__ import annotations
import re
from typing import Any, Dict, List, Tuple, Optional
from datetime import datetime
from zoneinfo import ZoneInfo

IPV4 = re.compile(r"^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$")

def _is_null(v, nulls, empty_as_null=True):
    if v is None: return True
    if isinstance(v, str):
        if empty_as_null and v.strip() == "": return True
        return v in nulls
    return v in nulls

def _norm_num(s: str, thousands: str, decimal: str) -> str:
    if thousands: s = s.replace(thousands, "")
    if decimal and decimal != ".": s = s.replace(decimal, ".")
    return s

def _try_num(v, g) -> Tuple[Optional[float], bool]:
    if v is None: return (None, False)
    if isinstance(v, (int, float)): return (float(v), float(v).is_integer())
    s = str(v).strip()
    if s == "": return (None, False)
    s = _norm_num(s, g.get("thousands_sep", " "), g.get("decimal_sep", ","))
    try:
        f = float(s)
        return (f, f.is_integer())
    except: return (None, False)

def _try_bool(v, g) -> Optional[bool]:
    if isinstance(v, bool): return v
    s = str(v).strip().lower()
    if s in {x.lower() for x in g.get("bool_true", [])}: return True
    if s in {x.lower() for x in g.get("bool_false", [])}: return False
    return None

def _try_date(v, formats: List[str], tz: str) -> bool:
    if v is None: return False
    if isinstance(v, (int, float)):
        return True  # epoch (second/millis) accepté
    s = str(v).strip()
    if s == "": return False
    for f in formats:
        if f == "epoch_millis" or f == "epoch_second" or f == "epoch_seconds":
            try: 
                float(s)
                return True
            except: pass
        else:
            try:
                dt = datetime.strptime(s, f)
                _ = dt.replace(tzinfo=ZoneInfo(tz))
                return True
            except: pass
    # ISO 8601 tentative
    try:
        _ = datetime.fromisoformat(s)
        return True
    except: return False

def infer_types(rows: List[Dict[str, Any]], globals_cfg: Dict[str, Any]) -> Tuple[List[Dict], List[Dict]]:
    if not rows: return ([], [])
    cols = set()
    for r in rows: cols.update(r.keys())
    cols = list(cols)

    field_stats, suggestions = [], []
    for c in cols:
        values = [r.get(c) for r in rows]
        nulls = globals_cfg.get("nulls", [])
        non_null_vals = [v for v in values if not _is_null(v, nulls, globals_cfg.get("empty_as_null", True))]
        nn = len(non_null_vals)
        non_null = max(nn, 0)
        null_rate = 0.0 if len(values) == 0 else (1 - non_null / len(values))
        examples = [str(v)[:80] for v in non_null_vals[:5]]
        uniq = len(set(map(lambda x: str(x), non_null_vals)))
        unique_ratio = 0.0 if non_null == 0 else (uniq / non_null)
        avg_len = 0.0 if non_null == 0 else sum(len(str(v)) for v in non_null_vals) / non_null
        max_len = 0 if non_null == 0 else max(len(str(v)) for v in non_null_vals)

        # Heuristiques
        date_hits = sum(1 for v in non_null_vals if _try_date(v, globals_cfg.get("date_formats", []), globals_cfg.get("default_tz", "Europe/Paris")))
        bool_hits = sum(1 for v in non_null_vals if _try_bool(v, globals_cfg) is not None)
        num_hits, int_hits = 0, 0
        for v in non_null_vals:
            n, is_int = _try_num(v, globals_cfg)
            if n is not None: 
                num_hits += 1
                if is_int: int_hits += 1
        ip_hits = sum(1 for v in non_null_vals if isinstance(v, str) and IPV4.match(v.strip()))

        cand: Dict[str, float] = {}
        if non_null:
            cand["date"] = date_hits / non_null
            cand["boolean"] = bool_hits / non_null
            cand["double"] = num_hits / non_null
            # biais en faveur de integer si 95% ints
            cand["integer"] = (int_hits / non_null) * 0.9 if num_hits else 0.0
            cand["ip"] = ip_hits / non_null
            # text/keyword : selon longueur & diversité
            # règle simple : keyword si unique_ratio <= 0.9 et max_len <= 1024
            key_base = 0.7 if unique_ratio <= 0.9 and max_len <= 1024 else 0.2
            text_base = 0.7 if avg_len > 32 or unique_ratio > 0.9 else 0.3
            cand["keyword"] = key_base * (1 - cand.get("date", 0)) * (1 - cand.get("double", 0)) * (1 - cand.get("boolean", 0))
            cand["text"] = text_base * (1 - cand.get("date", 0)) * (1 - cand.get("ip", 0))

        # Choix final
        es_type, conf = "keyword", 0.0
        for t, s in cand.items():
            if s > conf:
                es_type, conf = t, s

        reasons = []
        if es_type in ("double", "integer"):
            reasons.append(f"{num_hits}/{non_null} numériques")
            if es_type == "integer": reasons.append(f"{int_hits}/{non_null} entiers")
        if es_type == "date": reasons.append(f"{date_hits}/{non_null} parsables en date")
        if es_type == "boolean": reasons.append(f"{bool_hits}/{non_null} booleans reconnus")
        if es_type == "ip": reasons.append(f"{ip_hits}/{non_null} IPv4 valides")
        if es_type in ("keyword", "text"):
            reasons.append(f"unique_ratio={unique_ratio:.2f}, avg_len={avg_len:.1f}, max_len={max_len}")

        field_stats.append({
            "source": c, "non_null": non_null, "null_rate": round(null_rate, 3),
            "unique": uniq, "unique_ratio": round(unique_ratio, 3),
            "avg_len": round(avg_len, 1), "max_len": max_len,
            "examples": examples, "candidates": {k: round(v, 3) for k, v in cand.items()}
        })
        extras = {}
        if es_type == "date": extras["format"] = "||".join(globals_cfg.get("date_formats", ["epoch_millis"]))
        suggestions.append({"source": c, "es_type": es_type, "confidence": round(conf, 3), "reasons": reasons, "extras": extras})
    return (field_stats, suggestions)
