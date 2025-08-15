# app/api/v1/mappings.py
import time
import json
import logging
from hashlib import sha256
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response
from prometheus_client import Counter
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.db import get_db
from ...core.es_client import get_es_client
from ...domain.user.models import User
from ...domain.mapping.services import MappingService
from ...domain.mapping.schemas import (
    ValidateOut, CompileOut, DryRunOut,
    MappingCreate, MappingUpdate, MappingOut, MappingDetailOut,
    MappingVersionCreate, MappingVersionUpdate, MappingVersionOut,
    InferTypesOut, EstimateSizeOut, CheckIdsOut
)
from app.api.dependencies import get_current_user_from_cookie

log = logging.getLogger("mapping")

router = APIRouter(prefix="/mappings", tags=["mappings"])

# Métriques Prometheus
COMPILE_COUNT = Counter("mapping_compile_calls_total", "compile calls")
APPLY_OK = Counter("mapping_apply_success_total", "apply OK", ["resource"])   # ilm|pipeline|index
APPLY_FAIL = Counter("mapping_apply_fail_total", "apply FAIL", ["resource"])

MAX_BODY = 5 * 1024 * 1024  # 5 MB


def log_call(route: str, dsl_version: str, compiled_hash: str, sample_size: int, latency_ms: float, issues_count: int):
    log.info(
        "mapping_call",
        extra={
            "route": route,
            "dsl_version": dsl_version,
            "compiled_hash": compiled_hash,
            "sample_size": sample_size,
            "latency_ms": latency_ms,
            "issues_count": issues_count,
        },
    )


# ---------- Validation / Compilation / Dry-run ----------

@router.post("/validate", response_model=ValidateOut)
async def validate_mapping(request: Request, user=Depends(get_current_user_from_cookie)):
    """Valide un mapping DSL et retourne les erreurs/warnings."""
    cl = request.headers.get("content-length")
    if cl and int(cl) > MAX_BODY:
        raise HTTPException(status_code=413, detail="Payload too large")
    body = await request.json()
    return MappingService.validate(body)


@router.post("/validate/test", response_model=ValidateOut)
def validate_mapping_test(body: Dict[str, Any]):
    """Version de test sans authentification."""
    return MappingService.validate(body)


@router.post("/compile", response_model=CompileOut)
async def compile_mapping(request: Request, includePlan: bool = False, user=Depends(get_current_user_from_cookie)):
    """Compile un mapping DSL en mapping Elasticsearch exploitable."""
    cl = request.headers.get("content-length")
    if cl and int(cl) > MAX_BODY:
        raise HTTPException(status_code=413, detail="Payload too large")
    body = await request.json()
    svc = MappingService()
    return svc.compile(body, include_plan=includePlan)


@router.post("/compile/test", response_model=CompileOut)
def compile_mapping_test(body: Dict[str, Any], includePlan: bool = False):
    """Version de test sans authentification."""
    svc = MappingService()
    return svc.compile(body, include_plan=includePlan)


@router.post("/dry-run", response_model=DryRunOut)
async def dry_run_mapping(request: Request, user=Depends(get_current_user_from_cookie)):
    """Exécute un dry-run du mapping sur un échantillon de données."""
    cl = request.headers.get("content-length")
    if cl and int(cl) > MAX_BODY:
        raise HTTPException(status_code=413, detail="Payload too large")
    body = await request.json()

    rows = (body.get("sample") or {}).get("rows") or body.get("rows") or []
    body["globals"] = body.get("globals") or {}  # sécurité
    sample = {"rows": rows}

    t0 = time.perf_counter()
    out = MappingService.dry_run(body, sample)
    lat = (time.perf_counter() - t0) * 1000
    dv = body.get("dsl_version", "1.0")
    ch = body.get("compiled_hash", "")
    ic = len(out.issues) if hasattr(out, "issues") else len(out.get("issues", []))
    log_call("/mappings/dry-run", dv, ch, len(rows), lat, ic)

    return out


@router.post("/dry-run/test", response_model=DryRunOut)
def dry_run_mapping_test(body: Dict[str, Any]):
    """Version de test sans authentification."""
    rows = (body.get("sample") or {}).get("rows") or body.get("rows") or []
    body["globals"] = body.get("globals") or {}  # sécurité
    sample = {"rows": rows}
    return MappingService.dry_run(body, sample)


# ---------- Schema (avec ETag stable) ----------

@router.get("/schema")
async def get_mapping_schema(request: Request, user=Depends(get_current_user_from_cookie)):
    """Récupère le schéma JSON du DSL Mapping (source de vérité pour le frontend)."""
    from ...domain.mapping.validators.common.mapping import get_schema

    schema_dict = get_schema()  # dict
    # ETag stable via SHA-256 du JSON trié (weak ETag)
    serialized = json.dumps(schema_dict, sort_keys=True, separators=(",", ":")).encode("utf-8")
    etag = f'W/"v2.2.0-{sha256(serialized).hexdigest()}"'

    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304)

    resp = JSONResponse(content=schema_dict)
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "public, max-age=3600"  # 1 heure
    return resp


@router.get("/schema/test")
def get_mapping_schema_test():
    """Version de test sans authentification."""
    from ...domain.mapping.validators.common.mapping import get_schema
    return get_schema()


# ---------- Outils: check-ids / infer-types / estimate-size ----------

@router.post("/check-ids", response_model=CheckIdsOut)
def check_ids(body: Dict[str, Any], user=Depends(get_current_user_from_cookie)):
    """Vérifie les collisions d'ID sur un échantillon de données."""
    sample = body.get("sample", {})
    mapping = body.get("mapping", {})

    rows = sample.get("rows", [])
    idp = mapping.get("id_policy", {})

    cols = idp.get("from", [])
    if not cols and idp.get("source"):
        cols = [idp["source"]]

    sep = idp.get("sep", ":")

    seen, dups, samples = set(), 0, []

    for i, r in enumerate(rows):
        v = sep.join("" if r.get(c) is None else str(r.get(c)) for c in cols)
        if idp.get("hash"):
            import hashlib
            v = getattr(hashlib, idp["hash"])((idp.get("salt", "") + v).encode()).hexdigest()

        if v in seen:
            dups += 1
            if len(samples) < 5:
                samples.append({"row": i, "_id": v})
        seen.add(v)

    # Métriques Prometheus
    from app.domain.mapping.services import mapping_check_ids_total, mapping_check_ids_duplicates
    mapping_check_ids_total.inc()
    if dups > 0:
        mapping_check_ids_duplicates.inc(dups)

    return CheckIdsOut(
        total=len(rows),
        duplicates=dups,
        duplicate_rate=(dups / len(rows)) if rows else 0.0,
        samples=samples,
    )


@router.post("/check-ids/test", response_model=CheckIdsOut)
def check_ids_test(body: Dict[str, Any]):
    """Version de test sans authentification."""
    sample = body.get("sample", {})
    mapping = body.get("mapping", {})

    rows = sample.get("rows", [])
    idp = mapping.get("id_policy", {})

    cols = idp.get("from", [])
    if not cols and idp.get("source"):
        cols = [idp["source"]]

    sep = idp.get("sep", ":")

    seen, dups, samples = set(), 0, []

    for i, r in enumerate(rows):
        v = sep.join("" if r.get(c) is None else str(r.get(c)) for c in cols)
        if idp.get("hash"):
            import hashlib
            v = getattr(hashlib, idp["hash"])((idp.get("salt", "") + v).encode()).hexdigest()

        if v in seen:
            dups += 1
            if len(samples) < 5:
                samples.append({"row": i, "_id": v})
        seen.add(v)

    from app.domain.mapping.services import mapping_check_ids_total, mapping_check_ids_duplicates
    mapping_check_ids_total.inc()
    if dups > 0:
        mapping_check_ids_duplicates.inc(dups)

    return CheckIdsOut(
        total=len(rows),
        duplicates=dups,
        duplicate_rate=(dups / len(rows)) if rows else 0.0,
        samples=samples,
    )


@router.post("/infer-types", response_model=InferTypesOut)
def infer_types_ep(body: Dict[str, Any], user=Depends(get_current_user_from_cookie)):
    """Infère les types Elasticsearch à partir d'un échantillon de données."""
    rows = body.get("rows", [])
    globals_cfg = body.get("globals", {})
    return MappingService.infer_types(rows, globals_cfg)


@router.post("/estimate-size", response_model=EstimateSizeOut)
def estimate_size_ep(body: Dict[str, Any], user=Depends(get_current_user_from_cookie)):
    """Estime la taille de l'index et recommande le nombre de shards."""
    mapping = body.get("mapping") or body  # tolère en root
    field_stats = body.get("field_stats", [])
    num_docs = int(body.get("num_docs", 0))
    replicas = int(body.get("replicas", 1))
    target_shard_gb = int(body.get("target_shard_size_gb", 30))
    return MappingService.estimate_size(mapping, field_stats, num_docs, replicas, target_shard_gb)


@router.post("/infer-types/test", response_model=InferTypesOut)
def infer_types_test(body: Dict[str, Any]):
    """Version de test sans authentification."""
    rows = body.get("rows", [])
    globals_cfg = body.get("globals", {})
    return MappingService.infer_types(rows, globals_cfg)


@router.post("/estimate-size/test", response_model=EstimateSizeOut)
def estimate_size_test(body: Dict[str, Any]):
    """Version de test sans authentification."""
    mapping = body.get("mapping") or body  # tolère en root
    field_stats = body.get("field_stats", [])
    num_docs = int(body.get("num_docs", 0))
    replicas = int(body.get("replicas", 1))
    target_shard_gb = int(body.get("target_shard_size_gb", 30))
    return MappingService.estimate_size(mapping, field_stats, num_docs, replicas, target_shard_gb)


# ---------- CRUD Mappings ----------

@router.post("/", response_model=MappingOut)
async def create_mapping(
    mapping_in: MappingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Crée un nouveau mapping."""
    service = MappingService()
    mapping = await service.create(db, mapping_in, current_user)
    return mapping


@router.get("/", response_model=List[MappingOut])
async def get_mappings(
    dataset_id: str = Query(None, description="Filtrer par dataset"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Récupère une liste de mappings de l'utilisateur."""
    service = MappingService()
    if dataset_id:
        mappings = await service.get_by_dataset(db, dataset_id, current_user)
    else:
        mappings = await service.get_multi_by_owner(db, current_user.id, skip, limit)
    return mappings


@router.get("/{mapping_id}", response_model=MappingDetailOut)
async def get_mapping(
    mapping_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Récupère un mapping avec toutes ses versions."""
    service = MappingService()
    mapping = await service.get_with_versions(db, mapping_id, current_user)
    return mapping


@router.put("/{mapping_id}", response_model=MappingOut)
async def update_mapping(
    mapping_id: str,
    mapping_in: MappingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Met à jour un mapping existant."""
    service = MappingService()
    mapping = await service.update(db, mapping_id, mapping_in, current_user)
    return mapping


@router.delete("/{mapping_id}")
async def delete_mapping(
    mapping_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Supprime un mapping et toutes ses versions."""
    service = MappingService()
    await service.remove(db, mapping_id, current_user)
    return {"message": "Mapping supprimé avec succès"}


# ---------- Versions ----------

@router.post("/{mapping_id}/versions", response_model=MappingVersionOut)
async def create_mapping_version(
    mapping_id: str,
    version_in: MappingVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Crée une nouvelle version d'un mapping."""
    service = MappingService()
    version = await service.create_version(db, mapping_id, version_in, current_user)
    return version


@router.put("/versions/{version_id}", response_model=MappingVersionOut)
async def update_mapping_version(
    version_id: str,
    version_in: MappingVersionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Met à jour une version de mapping."""
    service = MappingService()
    version = await service.update_version(db, version_id, version_in, current_user)
    return version


@router.delete("/versions/{version_id}")
async def delete_mapping_version(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_cookie),
):
    """Supprime une version spécifique d'un mapping."""
    service = MappingService()
    await service.remove_version(db, version_id, current_user)
    return {"message": "Version supprimée avec succès"}


# ---------- Apply (ILM / Pipeline / Index) ----------

@router.post("/apply")
async def apply_mapping(
    body: dict,
    current_user: User = Depends(get_current_user_from_cookie),
    mapping_service: MappingService = Depends(),
    es_client=Depends(get_es_client),
):
    """Applique un mapping avec ILM et pipeline d'ingestion (idempotent)."""
    try:
        COMPILE_COUNT.inc()
        compiled = mapping_service.compile(body, include_plan=False)

        ilm_policy = compiled.get("ilm_policy", {})
        ingest_pipeline = compiled.get("ingest_pipeline", {})
        settings = compiled.get("settings", {})
        mappings = compiled.get("mappings", {})

        results: Dict[str, Any] = {}

        # 1. ILM
        if ilm_policy:
            try:
                r1 = es_client.ilm.put_lifecycle(
                    name=ilm_policy["name"],
                    body=ilm_policy["policy"],
                )
                APPLY_OK.labels("ilm").inc()
                results["ilm"] = {"status": "ok", "result": r1}
            except Exception as e:
                APPLY_FAIL.labels("ilm").inc()
                results["ilm"] = {"status": "error", "error": str(e)}

        # 2. Pipeline
        if ingest_pipeline:
            try:
                r2 = es_client.ingest.put_pipeline(
                    id=ingest_pipeline["name"],
                    body=ingest_pipeline["pipeline"],
                )
                APPLY_OK.labels("pipeline").inc()
                results["pipeline"] = {"status": "ok", "result": r2}
            except Exception as e:
                APPLY_FAIL.labels("pipeline").inc()
                results["pipeline"] = {"status": "error", "error": str(e)}

        # 3. Index
        try:
            index_body = {"settings": settings, "mappings": mappings}
            r3 = es_client.indices.create(
                index=body["index"],
                body=index_body,
                ignore=400,  # Ignore si l'index existe déjà
            )
            APPLY_OK.labels("index").inc()
            results["index"] = {"status": "ok", "result": r3}
        except Exception as e:
            APPLY_FAIL.labels("index").inc()
            results["index"] = {"status": "error", "error": str(e)}

        return {
            "ok": True,
            "message": "Mapping appliqué avec succès",
            "results": results,
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "message": "Erreur lors de l'application du mapping",
        }
