# py/validator.py
from __future__ import annotations
import json, pathlib
from typing import Any, Dict, List, Tuple
from jsonschema import Draft202012Validator

SCHEMA_PATH = pathlib.Path(__file__).resolve().parents[1] / "mapping.schema.json"

class ValidationIssue(dict):
    @property
    def code(self) -> str: return self.get("code","")
    @property
    def path(self) -> str: return self.get("path","")
    @property
    def msg(self) -> str: return self.get("msg","")

def load_schema() -> Dict[str, Any]:
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def jsonschema_validate(instance: Dict[str, Any], schema: Dict[str, Any]) -> List[ValidationIssue]:
    v = Draft202012Validator(schema)
    errs: List[ValidationIssue] = []
    for e in sorted(v.iter_errors(instance), key=lambda e: e.path):
        path = "/" + "/".join(str(p) for p in e.path)
        errs.append(ValidationIssue(code=e.validator.upper(), path=path, msg=e.message))
    return errs

def post_validate(instance: Dict[str, Any]) -> List[ValidationIssue]:
    errors: List[ValidationIssue] = []
    fields = instance.get("fields", [])
    settings = (instance.get("settings") or {}).get("analysis") or {}
    analyzers = settings.get("analyzer") or {}
    normalizers = settings.get("normalizer") or {}

    seen = set()
    for idx, f in enumerate(fields):
        tgt = f.get("target")
        if tgt in seen:
            errors.append(ValidationIssue(code="E_TARGET_DUPLICATE", path=f"/fields/{idx}/target", msg=f"duplicate target '{tgt}'"))
        else:
            seen.add(tgt)

    for idx, f in enumerate(fields):
        an = f.get("analyzer")
        if an and an not in analyzers:
            errors.append(ValidationIssue(code="E_ANALYZER_NOT_FOUND", path=f"/fields/{idx}/analyzer", msg=f"analyzer '{an}' not found in settings.analysis.analyzer"))
        nm = f.get("normalizer")
        if nm and nm not in normalizers:
            errors.append(ValidationIssue(code="E_NORMALIZER_NOT_FOUND", path=f"/fields/{idx}/normalizer", msg=f"normalizer '{nm}' not found in settings.analysis.normalizer"))
        mf = f.get("multi_fields") or []
        mf_names = set()
        for midx, m in enumerate(mf):
            n = m.get("name")
            if n in mf_names:
                errors.append(ValidationIssue(code="E_MULTI_FIELD_COLLISION", path=f"/fields/{idx}/multi_fields/{midx}/name", msg=f"multi_field name '{n}' duplicated"))
            else:
                mf_names.add(n)
            man = m.get("analyzer")
            if man and man not in analyzers:
                errors.append(ValidationIssue(code="E_ANALYZER_NOT_FOUND", path=f"/fields/{idx}/multi_fields/{midx}/analyzer", msg=f"analyzer '{man}' not found"))
            mnn = m.get("normalizer")
            if mnn and mnn not in normalizers:
                errors.append(ValidationIssue(code="E_NORMALIZER_NOT_FOUND", path=f"/fields/{idx}/multi_fields/{midx}/normalizer", msg=f"normalizer '{mnn}' not found"))
        if any(m.get("name") == "raw" for m in mf):
            if any(ff.get("target") == f"{tgt}.raw" for ff in fields):
                errors.append(ValidationIssue(code="E_MULTI_FIELD_RESERVED_RAW_COLLISION", path=f"/fields/{idx}", msg=f"'.raw' reserved collision on '{tgt}'"))

    if not instance.get("id_policy"):
        errors.append(ValidationIssue(code="E_ID_CONFLICT_POLICY_MISSING", path="/id_policy", msg="id_policy is required"))
    return errors

def validate_mapping(mapping: Dict[str, Any]) -> Tuple[bool, List[ValidationIssue]]:
    schema = load_schema()
    errs = jsonschema_validate(mapping, schema)
    if errs: 
        return False, errs
    perrs = post_validate(mapping)
    if perrs:
        return False, perrs
    return True, []

if __name__ == "__main__":
    sample = {"index": "demo", "globals": {"nulls":[],"bool_true":[],"bool_false":[],"decimal_sep":",","thousands_sep":" ","date_formats":[],"default_tz":"Europe/Paris","empty_as_null":True,"preview":{"sample_size":10,"seed":1}}, "id_policy":{"from":["id"],"op":"concat","sep":":","on_conflict":"error"}, "fields":[{"target":"name","type":"text","input":[{"kind":"column","name":"full_name"}],"pipeline":[{"op":"trim"}]}]}
    ok, errors = validate_mapping(sample)
    print("OK" if ok else errors)
