from __future__ import annotations
from typing import Any, Dict, List, Tuple, Optional, Union
from prometheus_client import Counter, Histogram, Gauge
from .ops import (
    ExecIssue, OP_REGISTRY, eval_condition, _coalesce, _is_null
)

# Métriques Prometheus V2.1
JP_HIT = Counter("jsonpath_cache_hits_total", "hits")
JP_MISS = Counter("jsonpath_cache_misses_total", "misses")
JP_TIME = Histogram("jsonpath_resolve_ms", "resolve time (ms)")
JP_SIZE = Gauge("jsonpath_cache_size", "compiled expr count")

OP_TIME = Histogram("mapping_op_ms", "op latency (ms)", ["op"])
OP_BUDGET = Counter("mapping_op_budget_exceeded_total", "budget exceeded")
OP_BUDGET_LIMIT = 200

ZIP_PAD = Counter("mapping_zip_pad_events_total", "zip padding used")
OBJ_REC = Counter("mapping_objectify_records_total", "objects built")
OBJ_MISS = Counter("mapping_objectify_missing_fields_total", "missing per object")

# mapping alias -> canonique
OP_ALIAS = {
    "lowercase": "lower",
    "uppercase": "upper",
    "replace": "regex_replace"
}

def _get_jp_cache(mapping: dict) -> dict:
    """Récupère le cache JSONPath du mapping."""
    return mapping.setdefault("__jp_cache__", {})

def _resolve_input(inp: dict, row: dict, mapping: dict):
    """Résout un input avec cache JSONPath."""
    kind = inp.get("kind")
    if kind == "column":
        return row.get(inp.get("name"))
    if kind == "literal":
        return inp.get("value")
    if kind == "jsonpath":
        try:
            cache = _get_jp_cache(mapping)
            expr = inp.get("expr")
            with JP_TIME.time():
                cp = cache.get(expr)
                if cp is None:
                    JP_MISS.inc()
                    from jsonpath_ng import parse
                    cp = parse(expr)
                    cache[expr] = cp
                    JP_SIZE.set(len(cache))
                else:
                    JP_HIT.inc()
            matches = [m.value for m in cp.find(row)]
            return matches if len(matches) > 1 else (matches[0] if matches else None)
        except Exception:
            return None
    return None

def _compile_pipeline(pipeline):
    """Compile un pipeline en plan d'exécution optimisé."""
    plan = []
    for op in (pipeline or []):
        name = OP_ALIAS.get(op.get("op"), op.get("op"))
        plan.append((name, {k:v for k,v in op.items() if k not in ("op","then","else")}, op))
    return plan

def _compile_mapping(mapping: dict):
    """Compile un mapping en plan d'exécution optimisé."""
    if "__compiled__" in mapping:
        return mapping["__compiled__"]
    
    compiled = []
    for f in mapping.get("fields", []):
        compiled.append({
            "target": f["target"],
            "input": f.get("input", []),
            "plan": _compile_pipeline(f.get("pipeline", []))
        })
    
    mapping["__compiled__"] = compiled
    return compiled

def _build_container_index(mapping: dict) -> dict:
    """Construit un index des containers pour le placement des valeurs."""
    idx = {}
    for c in mapping.get("containers") or []:
        path = c["path"]
        clean = path.replace("[]", "")
        idx[clean] = {"array": "[]" in path or c["type"] == "nested", "type": c["type"]}
    return idx

def _place_value(doc: dict, target: str, value: Any, container_idx: dict):
    """Place une valeur dans le document en respectant les containers."""
    parts = target.split(".")
    
    # Trouve le premier préfixe qui est un container
    prefix = []
    array_at = None
    for i, p in enumerate(parts):
        prefix.append(p)
        key = ".".join(prefix)
        if key in container_idx and container_idx[key]["array"]:
            array_at = i
            break
    
    if array_at is None:
        # V1: placement simple
        node = doc
        for p in parts[:-1]:
            node = node.setdefault(p, {})
        node[parts[-1]] = value
        return
    
    # On a un container array (nested)
    container_key = ".".join(parts[:array_at+1])
    leaf_path = parts[array_at+1:]
    leaf = leaf_path[-1] if leaf_path else None
    
    # Structure du tableau d'objets
    arr = doc.setdefault(container_key.split(".")[0], [])
    
    # Si value est une liste de scalaires -> [{leaf: v}, ...]
    if isinstance(value, list) and (leaf is not None):
        # Assure la taille
        while len(arr) < len(value):
            arr.append({})
        for i, v in enumerate(value):
            if i >= len(arr):
                arr.append({})
            arr[i][leaf] = v
        return
    
    # value scalaire -> un seul objet
    if leaf is not None:
        if not arr:
            arr.append({})
        arr[0][leaf] = value
        return
    
    # sinon, fallback
    if not arr:
        arr.append({})
    arr[0].update(value if isinstance(value, dict) else {"value": value})

def _get_input_values(row, inputs, mapping=None):
    vals: List[Any] = []
    for inp in inputs:
        if mapping:
            # Utiliser le nouveau résolveur avec cache JSONPath
            result = _resolve_input(inp, row, mapping)
            # Si le résultat est une liste et qu'on veut tous les éléments individuels
            # (comme pour $.tags qui retourne [['tag1', 'tag2']] mais on veut ['tag1', 'tag2'])
            if isinstance(result, list) and len(result) == 1 and isinstance(result[0], list):
                result = result[0]
            vals.append(result)
        else:
            # Fallback vers l'ancienne logique pour compatibilité
            kind = inp.get("kind")
            if kind == "column":
                vals.append(row.get(inp.get("name")))
            elif kind == "literal":
                vals.append(inp.get("value"))
            elif kind == "jsonpath":
                try:
                    from jsonpath_ng import parse
                    expr = parse(inp.get("expr"))
                    matches = [m.value for m in expr.find(row)]
                    # Pour JSONPath, on prend le premier match (qui peut être une liste)
                    result = matches[0] if matches else []
                    
                    # Si le résultat est une liste et qu'on veut tous les éléments individuels
                    # (comme pour $.tags qui retourne [['tag1', 'tag2']] mais on veut ['tag1', 'tag2'])
                    if isinstance(result, list) and len(result) == 1 and isinstance(result[0], list):
                        result = result[0]
                    
                    vals.append(result)
                except Exception:
                    vals.append([])
            else:
                vals.append(None)
    
    # Si on a un seul input, on retourne directement la valeur au lieu d'une liste
    if len(vals) == 1:
        return vals[0]
    return vals

def _run_branch(globals_cfg, dictionaries, cur, branch_ops, field, row_idx, issues, mapping=None):
    """Exécute une branche conditionnelle."""
    return _apply_compiled(globals_cfg, dictionaries, cur, _compile_pipeline(branch_ops), field, row_idx, issues, mapping)

def _apply_compiled(globals_cfg, dictionaries, current, plan, field, row_idx, issues, mapping=None):
    """Exécute un pipeline compilé avec support des ops array-aware."""
    cur = current
    budget = 0
    MAX_OPS_PER_ROW = 200
    
    for name, kwargs, raw in plan:
        budget += 1
        if budget > OP_BUDGET_LIMIT:
            OP_BUDGET.inc()
            issues.append(ExecIssue(row=row_idx, field=field, code="E_OP_BUDGET_EXCEEDED", msg=f"op budget per row exceeded ({budget} > {OP_BUDGET_LIMIT})"))
            return None
        
        # --- OPS ARRAY-AWARE ---
        if name == "map":
            then = raw.get("then", [])
            if isinstance(cur, list):
                out = []
                for i, x in enumerate(cur):
                    try:
                        result = _run_branch(globals_cfg, dictionaries, x, then, field, row_idx, issues, mapping)
                        out.append(result)
                    except Exception as e:
                        issues.append(ExecIssue(row=row_idx, field=field, code="E_OP_EXEC", msg=f"map failed: {e}"))
                        out.append(None)
                cur = out
            else:
                # scalar -> applique la sous-pipeline à l'élément
                cur = _run_branch(globals_cfg, dictionaries, cur, then, field, row_idx, issues, mapping)
            continue
        
        if name == "take":
            which = raw.get("which", "first")
            if isinstance(cur, list):
                if which == "first":
                    cur = cur[0] if cur else None
                elif which == "last":
                    cur = cur[-1] if cur else None
                elif isinstance(which, int):
                    cur = cur[which] if 0 <= which < len(cur) else None
            continue
        
        if name == "join":
            sep = raw.get("sep", ", ")
            if isinstance(cur, list):
                cur = sep.join("" if v is None else str(v) for v in cur)
            else:
                cur = "" if cur is None else str(cur)
            continue
        
        if name == "flatten":
            if isinstance(cur, list):
                flat = []
                for v in cur:
                    if isinstance(v, list):
                        flat.extend(v)
                    else:
                        flat.append(v)
                cur = flat
            continue
        
        # Nouvelles opérations V2.2
        if name == "filter":
            cond = raw.get("cond", {})
            if isinstance(cur, list):
                from .ops import eval_condition
                out = []
                for x in cur:
                    probe = x
                    if isinstance(x, dict) and "by" in cond:
                        probe = x.get(cond["by"])
                    if eval_condition(cond, probe, globals_cfg):
                        out.append(x)
                cur = out
            continue
        
        if name == "slice":
            start = raw.get("start", 0)
            end = raw.get("end")
            if isinstance(cur, list):
                cur = cur[start:end] if end is not None else cur[start:]
            continue
        
        if name == "unique":
            by = raw.get("by")
            if isinstance(cur, list):
                seen, out = set(), []
                for x in cur:
                    key = x if by is None else (x.get(by) if isinstance(x, dict) else None)
                    try:
                        h = key if isinstance(key, (int, float, str, bool, type(None))) else str(key)
                    except Exception:
                        h = str(key)
                    if h not in seen:
                        seen.add(h)
                        out.append(x)
                cur = out
            continue
        
        if name == "sort":
            by = raw.get("by")
            order = raw.get("order", "asc")
            numeric = raw.get("numeric", False)
            missing_last = raw.get("missing_last", True)
            
            if isinstance(cur, list):
                def keyfn(x):
                    v = x.get(by) if (by and isinstance(x, dict)) else x
                    if numeric:
                        try:
                            n = float(str(v).replace(",", ".")) if v is not None else None
                            return (1, None) if n is None and missing_last else (0, n if n is not None else float("-inf"))
                        except:
                            return (1, None) if missing_last else (0, float("-inf"))
                    return (1, None) if v is None and missing_last else (0, str(v))
                
                rev = (order == "desc")
                try:
                    cur = sorted(cur, key=keyfn, reverse=rev)
                except Exception:
                    pass  # Garde la liste originale en cas d'erreur
            continue
        
        if name == "when":
            probe = _coalesce(cur if isinstance(cur, list) else [cur], globals_cfg)
            branch = raw.get("then", []) if eval_condition(raw.get("cond", {}), probe, globals_cfg) else raw.get("else", [])
            cur = _run_branch(globals_cfg, dictionaries, cur, branch, field, row_idx, issues, mapping)
            continue
        
        # --- OPS SCALAIRES / DÉFAUT ---
        fn = OP_REGISTRY.get(name)
        if not fn:
            issues.append(ExecIssue(row=row_idx, field=field, code="W_OP_UNKNOWN", msg=f"unknown op '{name}'"))
            continue
        
        k = {**kwargs, "globals": globals_cfg, "dictionaries": dictionaries,
             "resolver": lambda spec: _resolve_input(spec, row, mapping) if mapping else None}
        
        if name in ("concat", "coalesce"):
            arg = cur if isinstance(cur, list) else [cur]
            try:
                cur = fn(arg, **k)  # type: ignore
            except Exception as e:
                issues.append(ExecIssue(row=row_idx, field=field, code="E_OP_EXEC", msg=f"{name} failed: {e}"))
                cur = None
            continue
        
        if isinstance(cur, list):
            cur = _coalesce(cur, globals_cfg)
        
        try:
            with OP_TIME.labels(name).time():
                cur = fn(cur, **k)  # type: ignore
        except Exception as e:
            issues.append(ExecIssue(row=row_idx, field=field, code="E_OP_EXEC", msg=f"{name} failed: {e}"))
            cur = None
    
    return cur

def execute_document(mapping, row, row_idx):
    doc: Dict[str, Any] = {}
    issues: List[ExecIssue] = []
    globals_cfg = mapping.get("globals") or {}
    
    # Cache des dictionnaires normalisés pour performance
    if "__normalized_dicts__" not in mapping:
        nd = {}
        for name, d in (mapping.get("dictionaries") or {}).items():
            meta = (d.get("meta") or {}) if isinstance(d, dict) and "data" in d else {"case_insensitive": True, "trim_keys": True}
            data = (d.get("data") if isinstance(d, dict) and "data" in d else d) or {}
            comp = {}
            for k, v in data.items():
                kk = k
                if isinstance(kk, str):
                    if meta.get("trim_keys", True): 
                        kk = kk.strip()
                    if meta.get("case_insensitive", True): 
                        kk = kk.lower()
                comp[kk] = v
            nd[name] = {"meta": meta, "data": comp}
        mapping["__normalized_dicts__"] = nd
    
    dictionaries = mapping["__normalized_dicts__"]

    # Compilation et index des containers
    container_idx = _build_container_index(mapping)
    compiled = _compile_mapping(mapping)
    
    for f in compiled:
        tgt, inputs, plan = f["target"], f["input"], f["plan"]
        values = _get_input_values(row, inputs, mapping)
        cur = values
        result = _apply_compiled(globals_cfg, dictionaries, cur, plan, tgt, row_idx, issues, mapping)
        
        # Placement des valeurs avec support des containers
        _place_value(doc, tgt, result, container_idx)

    idp = mapping.get("id_policy")
    if idp:
        sep = idp.get("sep", ":")
        sources = idp.get("from", [])
        vals = [row.get(s) for s in sources]
        id_val = sep.join("" if v is None else str(v) for v in vals)
        if idp.get("hash"):
            import hashlib
            algo = idp["hash"]
            h = getattr(hashlib, algo)
            s = (idp.get("salt","")) + id_val
            id_val = h(s.encode("utf-8")).hexdigest()
        doc["_id"] = id_val

    return doc, issues

def run_dry_run(mapping, rows):
    docs, issues = [], []
    seen_ids, id_policy = set(), mapping.get("id_policy") or {}
    stats = {"issues_per_code": {}, "date_fail_per_field": {}}

    def _bump(code, field=None):
        stats["issues_per_code"][code] = 1 + stats["issues_per_code"].get(code, 0)
        if code == "E_DATE_PARSE_FAIL" and field:
            d = stats["date_fail_per_field"]; d[field] = 1 + d.get(field, 0)

    for i, row in enumerate(rows):
        d, isss = execute_document(mapping, row, i)
        # on_conflict
        _id = d.pop("_id", None)
        if _id is not None:
            if _id in seen_ids:
                policy = id_policy.get("on_conflict", "error")
                issues.append({"row": i, "field": "_id", "code": "E_ID_CONFLICT",
                               "msg": f"duplicate _id '{_id}' (policy={policy})"})
                _bump("E_ID_CONFLICT")
                if policy == "skip": continue
                # overwrite: on garde le doc courant; error: on signale seulement
            seen_ids.add(_id)

        docs.append({"_id": _id, "_source": d})
        for it in isss:
            issues.append(it)
            _bump(it.get("code","W_OP"))
    return {"docs_preview": docs, "issues": issues, "stats": stats}

# Backward-compatible alias for potential class-based extension
class PipelineExecutor:
    @staticmethod
    def run(mapping: Dict[str, Any], rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        return run_dry_run(mapping, rows)
