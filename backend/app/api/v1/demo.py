# app/api/v1/demo.py
from __future__ import annotations

from typing import Any, Optional, List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.api.dependencies import get_current_user_from_cookie

# Domain
from app.domain.dataset import models as ds_models
from app.domain.file import models as file_models
from app.domain.mapping import models as map_models
from app.domain.mapping import schemas as map_schemas
from app.domain.mapping.services import MappingService

router = APIRouter()

# ---------------- Utils ----------------

def _as_uuid(u: Any) -> UUID:
    """Retourne un uuid.UUID depuis un User, un str, ou un UUID asyncpg."""
    from uuid import UUID as _UUID
    if isinstance(u, _UUID):
        return u
    if hasattr(u, "id"):
        v = getattr(u, "id")
        return v if isinstance(v, _UUID) else _UUID(str(v))
    return _UUID(str(u))

def _set_if_has(obj: Any, field: str, value: Any) -> None:
    """Affecte un attribut seulement s'il existe sur le modèle (tolérant)."""
    if hasattr(obj, field):
        setattr(obj, field, value)

# --------------- Données démo ---------------

DEMO_DATASET_NAME = "DEMO — Mapping Workbench"
DEMO_FILE_ORIGINAL = "customers_demo.csv"   # ⚠️ pas de File.name dans ton modèle
DEMO_FILE_STORED = "customers_demo_stored.csv"

DEMO_INFERRED_SCHEMA = {
    "id": {"type": "keyword"},
    "name": {"type": "text"},
    "age": {"type": "integer"},
    "join_date": {"type": "date"},
}

def _demo_mapping_create(source_file_id: UUID) -> map_schemas.MappingCreate:
    return map_schemas.MappingCreate(
        name="Demo Mapping",
        source_file_id=source_file_id,
        mapping_rules=[
            {"source": "id", "target": "id", "es_type": "keyword"},
            {"source": "name", "target": "name", "es_type": "text"},
            {"source": "age", "target": "age", "es_type": "integer"},
            {
                "source": "join_date",
                "target": "join_date",
                "es_type": "date",
                "format": "strict_date_optional_time||epoch_millis",
            },
        ],
        settings={"number_of_shards": 1, "number_of_replicas": 0},
    )

# --------------- Endpoint ---------------

@router.post("/setup", tags=["Demo"])
async def setup_demo_environment(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(get_current_user_from_cookie),
):
    """Crée/charge dataset + fichier READY (inferred_schema) + mapping de démo."""
    user_id = _as_uuid(current_user)
    logger.info(f"Création de l'environnement de démo pour user_id={user_id}")

    try:
        # -- 1) Dataset (par nom + owner si dispo)
        ds_filters: List[Any] = [ds_models.Dataset.name == DEMO_DATASET_NAME]
        if hasattr(ds_models.Dataset, "owner_id"):
            ds_filters.append(ds_models.Dataset.owner_id == user_id)

        q_ds = select(ds_models.Dataset).where(*ds_filters)
        dataset = (await db.execute(q_ds)).scalars().first()

        if not dataset:
            dataset = ds_models.Dataset(
                id=uuid4(),
                name=DEMO_DATASET_NAME,
                description="Dataset de démonstration auto-généré",
            )
            _set_if_has(dataset, "owner_id", user_id)
            db.add(dataset)
            await db.flush()

        # -- 2) Fichier (⚠️ utilise filename_original/filename_stored, pas name)
        file_filters: List[Any] = [file_models.File.dataset_id == dataset.id]
        if hasattr(file_models.File, "filename_original"):
            file_filters.append(file_models.File.filename_original == DEMO_FILE_ORIGINAL)

        q_file = select(file_models.File).where(*file_filters)
        file_obj: Optional[file_models.File] = (await db.execute(q_file)).scalars().first()

        if not file_obj:
            file_obj = file_models.File(
                id=uuid4(),
                dataset_id=dataset.id,
            )
            # Renseigne les champs présents dans ton modèle (tolérant aux différences)
            _set_if_has(file_obj, "filename_original", DEMO_FILE_ORIGINAL)
            _set_if_has(file_obj, "filename_stored", DEMO_FILE_STORED)
            _set_if_has(file_obj, "version", 1)
            _set_if_has(file_obj, "hash", "demo-hash")            # hash fictif
            _set_if_has(file_obj, "size_bytes", 1024)             # taille fictive
            _set_if_has(file_obj, "mime_type", "text/csv")
            _set_if_has(file_obj, "line_count", 3)
            _set_if_has(file_obj, "column_count", len(DEMO_INFERRED_SCHEMA))
            _set_if_has(file_obj, "inferred_schema", DEMO_INFERRED_SCHEMA)
            _set_if_has(file_obj, "uploader_id", user_id)

            # Statut READY
            ready_enum = getattr(file_models, "FileStatus", None)
            ready_value = getattr(ready_enum, "READY", "READY") if ready_enum else "READY"
            _set_if_has(file_obj, "status", ready_value)

            db.add(file_obj)
            await db.flush()
        else:
            # S’assure que le fichier satisfait les prérequis de MappingService.create
            ready_enum = getattr(file_models, "FileStatus", None)
            ready_value = getattr(ready_enum, "READY", "READY") if ready_enum else "READY"
            _set_if_has(file_obj, "status", ready_value)
            if not getattr(file_obj, "inferred_schema", None):
                _set_if_has(file_obj, "inferred_schema", DEMO_INFERRED_SCHEMA)
            if hasattr(file_obj, "filename_original") and not getattr(file_obj, "filename_original"):
                _set_if_has(file_obj, "filename_original", DEMO_FILE_ORIGINAL)
            await db.flush()

        # -- 3) Mapping (réutilise si déjà présent pour ce dataset + source_file_id)
        mp_filters: List[Any] = [map_models.Mapping.dataset_id == dataset.id]
        if hasattr(map_models.Mapping, "source_file_id"):
            mp_filters.append(map_models.Mapping.source_file_id == file_obj.id)

        q_map = select(map_models.Mapping).where(*mp_filters)
        mapping: Optional[map_models.Mapping] = (await db.execute(q_map)).scalars().first()

        if not mapping:
            svc = MappingService()
            mapping_in = _demo_mapping_create(file_obj.id)
            # Signature réelle: create(db, mapping_in, dataset_id)
            mapping = await svc.create(db, mapping_in=mapping_in, dataset_id=dataset.id)
        else:
            if getattr(mapping, "dataset_id", None) != dataset.id:
                _set_if_has(mapping, "dataset_id", dataset.id)

        await db.commit()
        return {
            "message": "Environnement de démo créé avec succès.",
            "dataset_id": str(dataset.id),
            "mapping_id": str(mapping.id),
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Erreur lors de la création de l'environnement de démo : {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création des données de démo.",
        )
