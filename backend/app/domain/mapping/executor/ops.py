from __future__ import annotations
import re
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

Null = object()

class ExecIssue(dict):
    @property
    def row(self) -> int: return self.get("row", -1)
    @property
    def field(self) -> str: return self.get("field","")
    @property
    def code(self) -> str: return self.get("code","")
    @property
    def msg(self) -> str: return self.get("msg","")

def _is_null(v: Any, globals: Dict[str, Any]) -> bool:
    if v is None: return True
    nulls = set(globals.get("nulls", []))
    if isinstance(v, str):
        if globals.get("empty_as_null", True) and v.strip() == "": return True
        return v in nulls
    # Gérer les types non-hashables (list, dict, etc.)
    try:
        return v in nulls
    except TypeError:
        # Pour les types non-hashables, on ne peut pas les comparer directement
        return False

def _coalesce(values: List[Any], globals: Dict[str, Any]) -> Any:
    for v in values:
        if not _is_null(v, globals):
            return v
    return None

def _normalize_thousands_decimal(s: str, thousands_sep: str, decimal_sep: str) -> str:
    if thousands_sep:
        s = s.replace(thousands_sep, "")
    if decimal_sep and decimal_sep != ".":
        s = s.replace(decimal_sep, ".")
    return s

def _parse_number(v: Any, globals: Dict[str, Any]) -> Optional[Union[int,float]]:
    if v is None: return None
    if isinstance(v, (int, float)): return v
    s = str(v).strip()
    if s == "": return None
    s = _normalize_thousands_decimal(s, globals.get("thousands_sep"," "), globals.get("decimal_sep",","))
    try:
        if re.fullmatch(r"[-+]?\d+", s):
            return int(s)
        return float(s)
    except Exception:
        return None

def _cast_boolean(v: Any, globals: Dict[str, Any]) -> Optional[bool]:
    if v is None: return None
    if isinstance(v, bool): return v
    s = str(v).strip().lower()
    tset = set(x.lower() for x in globals.get("bool_true", []))
    fset = set(x.lower() for x in globals.get("bool_false", []))
    if s in tset: return True
    if s in fset: return False
    try:
        n = float(s); return bool(n)
    except Exception:
        return None

def _parse_epoch(v: Any, unit: str) -> Optional[datetime]:
    try: n = float(v)
    except Exception: return None
    sec = n/1000.0 if unit == "millis" else n
    return datetime.fromtimestamp(sec, tz=timezone.utc)

def _try_parse_date(v: Any, formats: List[str], default_tz: str) -> Optional[datetime]:
    if v is None: return None
    if isinstance(v, (int, float)):
        if abs(v) > 1e12: return _parse_epoch(v, "millis")
        return _parse_epoch(v, "seconds")
    s = str(v).strip()
    if s == "": return None
    fmts = formats or []
    for f in fmts:
        if f == "epoch_millis":
            dt = _parse_epoch(s, "millis"); 
            if dt: return dt
            continue
        if f in ("epoch_second","epoch_seconds"):
            dt = _parse_epoch(s, "seconds"); 
            if dt: return dt
            continue
        try:
            dt = datetime.strptime(s, f)
            if dt.tzinfo is None:
                try: dt = dt.replace(tzinfo=ZoneInfo(default_tz))
                except Exception: dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            continue
    try:
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ZoneInfo(default_tz))
        return dt
    except Exception:
        return None

def op_trim(value: Any, **_) -> Any:
    return value.strip() if isinstance(value, str) else value

def op_lower(value: Any, **_) -> Any:
    return value.lower() if isinstance(value, str) else value

def op_upper(value: Any, **_) -> Any:
    return value.upper() if isinstance(value, str) else value

def op_regex_replace(value, pattern, repl, flags=None, **_):
    if not isinstance(value, str): return value
    if pattern is None: return value
    
    if len(pattern) > 2000:
        raise RuntimeError("E_REGEX_GUARD: pattern too long")
    
    # bloque les look-behinds lourds
    if "(?<" in pattern:
        raise RuntimeError("E_REGEX_GUARD: look-behind not allowed")
    
    fl = 0
    if flags:
        if "i" in flags: fl |= re.IGNORECASE
        if "m" in flags: fl |= re.MULTILINE
        if "s" in flags: fl |= re.DOTALL
    
    try:
        return re.sub(pattern, repl, value, flags=fl)
    except Exception as e:
        raise RuntimeError(f"E_REGEX_ERROR: {e}")

def op_cast(value: Any, to: str, globals: Dict[str, Any], **_) -> Any:
    if to == "string": return "" if value is None else str(value)
    if to == "number": return _parse_number(value, globals)
    if to == "boolean": return _cast_boolean(value, globals)
    if to == "date": return _try_parse_date(value, globals.get("date_formats", []), globals.get("default_tz","UTC"))
    return value

def op_dict(value: Any, name: str, dictionaries: Dict[str, Any], on_unknown: str = "keep", default: Any = None, **_) -> Any:
    if value is None: return None
    d = dictionaries.get(name)
    if d is None: return value
    meta, data = None, None
    if isinstance(d, dict) and "data" in d and "meta" in d:
        meta = d.get("meta") or {}
        data = d.get("data") or {}
    else:
        data = d; meta = {"case_insensitive": True, "trim_keys": True}
    key = value
    if isinstance(key, str):
        if meta.get("trim_keys", True): key = key.strip()
        if meta.get("case_insensitive", True): key = key.lower()
        mapped = {}
        for k, v in data.items():
            kk = k
            if isinstance(kk, str):
                if meta.get("trim_keys", True): kk = kk.strip()
                if meta.get("case_insensitive", True): kk = kk.lower()
            mapped[kk] = v
        if key in mapped: return mapped[key]
        if on_unknown == "keep": return value
        if on_unknown == "default": return default
        if on_unknown == "error": raise ValueError(f"DICT_UNKNOWN_KEY: '{value}' not in dictionary '{name}'")
        return value
    else:
        return data.get(key, default if on_unknown=="default" else value)

def op_concat(values: List[Any], sep: str = " ", **_) -> Any:
    parts = [str(v) for v in values if v is not None and str(v) != ""]
    return sep.join(parts)

def op_split(value: Any, sep: str, take: Optional[Union[str,int]] = None, keep_rest: Optional[bool] = None, **_) -> Any:
    if not isinstance(value, str): return value
    parts = value.split(sep)
    if take == "first": return parts[0] if parts else ""
    if take == "last": return parts[-1] if parts else ""
    if isinstance(take, int): return parts[take] if 0 <= take < len(parts) else ""
    return parts

def op_coalesce(values: List[Any], globals: Dict[str, Any], **_) -> Any:
    return _coalesce(values, globals)

def op_date_parse(value, formats, assume_tz, globals, **_):
    fmts = formats if formats is not None else globals.get("date_formats", [])
    tz = assume_tz or globals.get("default_tz", "UTC")
    dt = _try_parse_date(value, fmts, tz)
    if (isinstance(value, str) and value.strip() != "") and dt is None:
        raise RuntimeError("E_DATE_PARSE_FAIL")
    return dt

def _dm_simple_token(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z]", "", s)
    s = s.replace("ph","f").replace("c","k").replace("q","k").replace("x","ks").replace("y","i").replace("z","s")
    s = re.sub(r"(.)\1+", r"\1", s)
    return s[:8]

def op_phonetic(value: Any, method: str = "double_metaphone", lang: Optional[str] = None, **_) -> Any:
    if value is None: return None
    try:
        from metaphone import doublemetaphone  # optional dependency
        p = doublemetaphone(str(value))
        return p[0] or p[1] or ""
    except Exception:
        return _dm_simple_token(str(value))

def op_geo_parse(value, format: str, **_):
    if value is None: return None
    if format == "latlon":
        if isinstance(value, str):
            parts = re.split(r"[;, ]+", value.strip())
            if len(parts) >= 2:
                try:
                    lat = float(parts[0]); lon = float(parts[1])
                    # Validation des ranges géographiques
                    if not (-90.0 <= lat <= 90.0):
                        raise RuntimeError("E_GEO_LAT_RANGE")
                    if not (-180.0 <= lon <= 180.0):
                        raise RuntimeError("E_GEO_LON_RANGE")
                    return {"lat": lat, "lon": lon}
                except RuntimeError:
                    raise  # Re-raise les erreurs de range
                except Exception:
                    return None
        if isinstance(value, (list, tuple)) and len(value) >= 2:
            try: 
                lat = float(value[0]); lon = float(value[1])
                # Validation des ranges géographiques
                if not (-90.0 <= lat <= 90.0):
                    raise RuntimeError("E_GEO_LAT_RANGE")
                if not (-180.0 <= lon <= 180.0):
                    raise RuntimeError("E_GEO_LON_RANGE")
                return {"lat": lat, "lon": lon}
            except RuntimeError:
                raise  # Re-raise les erreurs de range
            except Exception:
                return None
        return None
    return value

def op_hash(value: Any, algo: str = "sha1", salt: Optional[str] = None, **_) -> Any:
    import hashlib
    h = getattr(hashlib, algo)
    s = (salt or "") + ("" if value is None else str(value))
    return h(s.encode("utf-8")).hexdigest()

def op_length(value, **_):
    if value is None: return 0
    if isinstance(value, (list, tuple, dict, set)): return len(value)
    return len(str(value))

def op_literal(_current, value: any, **_):
    return value

def op_regex_extract(value, pattern: str, group: int = 1, flags: str | None = None, **_):
    if not isinstance(value, str): return None
    if pattern is None: return None
    if len(pattern) > 2000: raise RuntimeError("E_REGEX_GUARD: pattern too long")
    if "(?<" in pattern: raise RuntimeError("E_REGEX_GUARD: look-behind not allowed")
    fl = 0
    if flags:
        if "i" in flags: fl |= re.IGNORECASE
        if "m" in flags: fl |= re.MULTILINE
        if "s" in flags: fl |= re.DOTALL
    m = re.search(pattern, value, fl)
    return m.group(group) if m else None

def _to_list(v):
    """Convertit une valeur en liste."""
    if v is None: 
        return []
    return v if isinstance(v, list) else [v]

def op_zip(current, with_: list, resolver=None, fill=None, **_):
    """Combine plusieurs listes en tuples indexés."""
    base = _to_list(current)
    arrays = [base]
    for spec in with_ or []:
        arrays.append(_to_list(resolver(spec) if resolver else None))
    n = max((len(a) for a in arrays), default=0)
    out = []
    for i in range(n):
        tpl = [(a[i] if i < len(a) else fill) for a in arrays]
        out.append(tpl)
    return out

def op_objectify(current, fields: dict, resolver=None, fill=None, strict: bool=False, **_):
    """Transforme des listes en objets structurés."""
    # fields: {"phone": <input>, "email": <input>, ...}
    cols = {k: _to_list(resolver(spec) if resolver else None) for k, spec in (fields or {}).items()}
    
    # si current est une liste de tuples (issue de zip), prioriser ça
    if isinstance(current, list) and current and isinstance(current[0], (list, tuple)):
        # on n'a pas les noms → si 'fields' est ordonné, les utiliser en clé
        keys = list(fields.keys()) if fields else [f"f{i}" for i in range(len(current[0]))]
        res = []
        for tup in current:
            obj = {}
            for i, k in enumerate(keys):
                obj[k] = tup[i] if i < len(tup) else fill
            res.append(obj)
        return res
    
    # sinon zippage par clés déclarées
    n = max((len(v) for v in cols.values()), default=len(_to_list(current)))
    res = []
    for i in range(n):
        obj = {}
        for k, arr in cols.items():
            if i < len(arr): 
                obj[k] = arr[i]
            else:
                if strict: 
                    return None  # ou raise pour E_OBJECTIFY_MISSING
                obj[k] = fill
        res.append(obj)
    return res

def eval_condition(cond: Dict[str, Any], probe: Any, globals: Dict[str, Any]) -> bool:
    t = cond.get("type") or next(iter(cond.keys()), None)  # tolère forme courte
    # formes courtes: {"gt": 5}, {"lt": 10}, {"contains":"abc"}, {"is_numeric": true}
    if "gt" in cond or t == "gt":
        try: return float(str(probe).replace(",", ".")) > float(cond.get("gt"))
        except: return False
    if "gte" in cond or t == "gte":
        try: return float(str(probe).replace(",", ".")) >= float(cond.get("gte"))
        except: return False
    if "lt" in cond or t == "lt":
        try: return float(str(probe).replace(",", ".")) < float(cond.get("lt"))
        except: return False
    if "lte" in cond or t == "lte":
        try: return float(str(probe).replace(",", ".")) <= float(cond.get("lte"))
        except: return False
    if "contains" in cond or t == "contains":
        sub = cond.get("contains", "")
        return (sub in (probe or "")) if isinstance(probe, str) else False
    if "is_numeric" in cond or t == "is_numeric":
        return _parse_number(probe, globals) is not None

    # existants inchangés:
    if t == "is_empty":
        return _is_null(probe, globals) or (isinstance(probe, str) and probe.strip() == "")
    if t == "is_number":
        return _parse_number(probe, globals) is not None
    if t == "is_date":
        return _try_parse_date(probe, globals.get("date_formats", []), globals.get("default_tz","UTC")) is not None
    if t == "matches":
        flags = 0
        if cond.get("flags"):
            f = cond["flags"]
            if "i" in f: flags |= re.IGNORECASE
            if "m" in f: flags |= re.MULTILINE
            if "s" in f: flags |= re.DOTALL
        return re.search(cond.get("regex",""), str(probe) if probe is not None else "", flags) is not None
    if t == "in_set":
        values = cond.get("values") or []
        return (str(probe) if probe is not None else "") in set(values)
    return False

OP_REGISTRY = {
    "trim": op_trim,
    "lower": op_lower,
    "upper": op_upper,
    "regex_replace": op_regex_replace,
    "cast": op_cast,
    "dict": op_dict,
    "concat": op_concat,
    "split": op_split,
    "coalesce": op_coalesce,
    "date_parse": op_date_parse,
    "phonetic": op_phonetic,
    "geo_parse": op_geo_parse,
    "hash": op_hash,
    "length": op_length,
    "literal": op_literal,
    "regex_extract": op_regex_extract,
    "zip": op_zip,
    "objectify": op_objectify,
}
