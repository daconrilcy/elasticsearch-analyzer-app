# app/domain/mapping/validators/common/json_validator.py
from __future__ import annotations
import json
import importlib.resources as r
from typing import Any, Dict, List, Tuple
from jsonschema import Draft202012Validator


class ValidationIssue(dict):
    @property
    def code(self) -> str: 
        return self.get("code", "")
    
    @property
    def path(self) -> str: 
        return self.get("path", "")
    
    @property
    def msg(self) -> str: 
        return self.get("msg", "")


def _load_schema() -> Dict[str, Any]:
    """Charge le schéma JSON depuis le package."""
    data = r.files(__package__).joinpath("mapping.schema.json").read_text(encoding="utf-8")
    return json.loads(data)


def _get_schema() -> Dict[str, Any]:
    """Récupère le schéma JSON (recharge à chaque appel pour les tests)."""
    return _load_schema()


def _get_validator() -> Draft202012Validator:
    """Récupère un nouveau validateur avec le schéma actuel."""
    schema = _get_schema()
    return Draft202012Validator(schema)


_SCHEMA = _load_schema()
_JSON_VALIDATOR = Draft202012Validator(_SCHEMA)


def _jsonschema_validate(instance: Dict[str, Any]) -> List[ValidationIssue]:
    """Valide l'instance contre le schéma JSON."""
    errs: List[ValidationIssue] = []
    validator = _get_validator()  # Utilise le schéma fraîchement chargé
    for e in sorted(validator.iter_errors(instance), key=lambda e: e.path):
        path = "/" + "/".join(str(p) for p in e.path)
        errs.append(ValidationIssue(code=e.validator.upper(), path=path, msg=e.message))
    return errs


def _post_validate(instance: Dict[str, Any]) -> List[ValidationIssue]:
    """Applique les post-règles de validation métier."""
    errors: List[ValidationIssue] = []
    fields = instance.get("fields", [])
    analysis = (instance.get("settings") or {}).get("analysis") or {}
    analyzers = analysis.get("analyzer") or {}
    normalizers = analysis.get("normalizer") or {}

    # Unicité des targets
    seen = set()
    for idx, f in enumerate(fields):
        tgt = f.get("target")
        if tgt in seen:
            errors.append(ValidationIssue(
                code="E_TARGET_DUPLICATE", 
                path=f"/fields/{idx}/target", 
                msg=f"duplicate target '{tgt}'"
            ))
        else:
            seen.add(tgt)

    # Existence analyzers/normalizers + collisions multi_fields
    for idx, f in enumerate(fields):
        # Vérification des analyseurs
        an = f.get("analyzer")
        if an and an not in analyzers:
            errors.append(ValidationIssue(
                code="E_ANALYZER_NOT_FOUND", 
                path=f"/fields/{idx}/analyzer", 
                msg=f"analyzer '{an}' not found"
            ))
        
        # Vérification des normaliseurs
        nm = f.get("normalizer")
        if nm and nm not in normalizers:
            errors.append(ValidationIssue(
                code="E_NORMALIZER_NOT_FOUND", 
                path=f"/fields/{idx}/normalizer", 
                msg=f"normalizer '{nm}' not found"
            ))
        
        # Vérification des multi_fields
        mf = f.get("multi_fields") or []
        mf_names = set()
        for midx, m in enumerate(mf):
            n = m.get("name")
            if n in mf_names:
                errors.append(ValidationIssue(
                    code="E_MULTI_FIELD_COLLISION", 
                    path=f"/fields/{idx}/multi_fields/{midx}/name", 
                    msg=f"multi_field name '{n}' duplicated"
                ))
            else:
                mf_names.add(n)
            
            # Vérification des analyseurs dans multi_fields
            man = m.get("analyzer")
            if man and man not in analyzers:
                errors.append(ValidationIssue(
                    code="E_ANALYZER_NOT_FOUND", 
                    path=f"/fields/{idx}/multi_fields/{midx}/analyzer", 
                    msg=f"analyzer '{man}' not found"
                ))
            
            # Vérification des normaliseurs dans multi_fields
            mnn = m.get("normalizer")
            if mnn and mnn not in normalizers:
                errors.append(ValidationIssue(
                    code="E_NORMALIZER_NOT_FOUND", 
                    path=f"/fields/{idx}/multi_fields/{midx}/normalizer", 
                    msg=f"normalizer '{mnn}' not found"
                ))
        
        # Vérification des collisions avec .raw réservé
        if any(m.get("name") == "raw" for m in mf) and any(ff.get("target") == f"{tgt}.raw" for ff in fields):
            errors.append(ValidationIssue(
                code="E_MULTI_FIELD_RESERVED_RAW_COLLISION", 
                path=f"/fields/{idx}", 
                msg=f"'.raw' reserved collision on '{tgt}'"
            ))
        
        # Vérification de la limite d'opérations par pipeline
        pipeline = f.get("pipeline", [])
        if len(pipeline) > 50:
            errors.append(ValidationIssue(
                code="W_PIPELINE_TOO_LONG", 
                path=f"/fields/{idx}/pipeline", 
                msg=f"pipeline has {len(pipeline)} operations (recommended: ≤50, max: 200)"
            ))
        elif len(pipeline) > 200:
            errors.append(ValidationIssue(
                code="E_PIPELINE_TOO_LONG", 
                path=f"/fields/{idx}/pipeline", 
                msg=f"pipeline has {len(pipeline)} operations (max: 200)"
            ))

    # Vérification de la politique d'ID
    if not instance.get("id_policy"):
        errors.append(ValidationIssue(
            code="E_ID_CONFLICT_POLICY_MISSING", 
            path="/id_policy", 
            msg="id_policy is required"
        ))
    
    return errors


def validate_mapping(mapping: Dict[str, Any]) -> Tuple[bool, List[ValidationIssue]]:
    """
    Valide un mapping DSL complet.
    
    Args:
        mapping: Le mapping DSL à valider
        
    Returns:
        Tuple (is_valid, list_of_errors)
    """
    # Validation JSON Schema
    errs = _jsonschema_validate(mapping)
    if errs: 
        return False, errs
    
    # Validation post-règles métier
    perrs = _post_validate(mapping)
    
    # Séparer erreurs vs warnings
    errors = [e for e in perrs if not e.code.startswith("W_")]
    warnings = [e for e in perrs if e.code.startswith("W_")]
    
    # Seules les erreurs bloquent la validation
    if errors:
        return False, errors
    
    # Les warnings n'empêchent pas la validation de passer
    return True, warnings
