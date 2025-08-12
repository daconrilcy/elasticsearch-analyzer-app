from __future__ import annotations
from typing import Any, Dict, List, Tuple, Optional, Union
from .ops import (
    ExecIssue, OP_REGISTRY, eval_condition, _coalesce, _is_null
)

def _get_input_values(row, inputs):
    vals: List[Any] = []
    for inp in inputs:
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
                vals.append(matches if len(matches) > 1 else (matches[0] if matches else None))
            except Exception:
                vals.append(None)
        else:
            vals.append(None)
    return vals

def _apply_pipeline(globals_cfg, dictionaries, current, pipeline, field, row_idx, issues):
    cur: Any = current
    budget = 0
    MAX_OPS_PER_ROW = 200  # Budget d'opérations par ligne
    
    for op in pipeline:
        budget += 1
        if budget > MAX_OPS_PER_ROW:
            issues.append(ExecIssue(row=row_idx, field=field, code="E_OP_BUDGET_EXCEEDED", msg=f"op budget per row exceeded ({budget} > {MAX_OPS_PER_ROW})"))
            return None
            
        name = op.get("op")
        if name == "when":
            cond = op.get("cond", {})
            probe = _coalesce(cur if isinstance(cur, list) else [cur], globals_cfg)
            branch = op.get("then", []) if eval_condition(cond, probe, globals_cfg) else op.get("else", [])
            cur = _apply_pipeline(globals_cfg, dictionaries, cur, branch, field, row_idx, issues)
            continue

        fn = OP_REGISTRY.get(name)
        if not fn:
            issues.append(ExecIssue(row=row_idx, field=field, code="W_OP_UNKNOWN", msg=f"unknown op '{name}'"))
            continue

        kwargs = {k:v for k,v in op.items() if k not in ("op","then","else")}
        kwargs["globals"] = globals_cfg
        kwargs["dictionaries"] = dictionaries

        if name in ("concat", "coalesce"):
            arg = cur if isinstance(cur, list) else [cur]
            cur = fn(arg, **kwargs)  # type: ignore
            continue

        if isinstance(cur, list):
            cur = _coalesce(cur, globals_cfg)

        try:
            cur = fn(cur, **kwargs)  # type: ignore
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

    for field in mapping.get("fields", []):
        tgt = field.get("target")
        inputs = field.get("input") or []
        values = _get_input_values(row, inputs)
        cur: Any = values
        pipeline = field.get("pipeline") or []
        result = _apply_pipeline(globals_cfg, dictionaries, cur, pipeline, tgt, row_idx, issues)

        node = doc
        parts = tgt.split(".")
        for p in parts[:-1]:
            node = node.setdefault(p, {})
        node[parts[-1]] = result

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
