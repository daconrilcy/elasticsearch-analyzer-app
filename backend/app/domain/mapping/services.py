import uuid
import hashlib
import json
import time
from typing import Optional, List, Any, Dict, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload, joinedload
from loguru import logger
from prometheus_client import Counter, Histogram, Gauge

from app.domain.mapping import models, schemas
from app.domain.user.models import User
from app.core.exceptions import (
    ResourceNotFoundError,
    ForbiddenError
)
from .validators.common.json_validator import validate_mapping as _validate
from .inference import infer_types
from .sizing import estimate_size
from .schemas import InferTypesOut, FieldStat, InferSuggestion, EstimateSizeOut

# Métriques Prometheus
mapping_validate_total = Counter('mapping_validate_total', 'Total des validations de mapping')
mapping_validate_errors_total = Counter('mapping_validate_errors_total', 'Total des erreurs de validation', ['code'])
mapping_compile_total = Counter('mapping_compile_total', 'Total des compilations de mapping')
mapping_compile_duration_seconds = Histogram('mapping_compile_duration_seconds', 'Durée de compilation des mappings')
dry_run_total = Counter('dry_run_total', 'Total des dry-runs')
dry_run_duration_ms = Histogram('dry_run_duration_ms', 'Durée des dry-runs en millisecondes', buckets=[100, 500, 1000, 1500, 2000, 5000])
dry_run_issues_total = Counter('dry_run_issues_total', 'Total des issues détectées', ['code'])
dry_run_sample_size = Histogram('dry_run_sample_size', 'Taille des échantillons de dry-run')
mapping_check_ids_total = Counter('mapping_check_ids_total', 'Total des vérifications d\'ID')
mapping_check_ids_duplicates = Counter('mapping_check_ids_duplicates', 'Total des doublons d\'ID détectés')


def _normalized_dsl(dsl: dict) -> str:
    """Normalise le DSL pour un hash cohérent."""
    return json.dumps(dsl, separators=(',', ':'), sort_keys=True, ensure_ascii=False)

def _sha256(s: str) -> str:
    """Calcule le hash SHA256 d'une chaîne."""
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

class MappingService:
    """Service pour les opérations CRUD sur l'entité Mapping."""

    async def get(self, db: AsyncSession, mapping_id: uuid.UUID) -> Optional[models.Mapping]:
        """Récupère un mapping par son ID."""
        return await db.get(models.Mapping, mapping_id)

    async def get_owned_by_user(
        self, db: AsyncSession, mapping_id: uuid.UUID, user: User
    ) -> models.Mapping:
        """
        Récupère un mapping et vérifie la propriété via le dataset parent.
        """
        mapping = await db.get(models.Mapping, mapping_id)
        if not mapping:
            raise ResourceNotFoundError("Mapping non trouvé.")
        
        await db.refresh(mapping, attribute_names=['dataset'])
        if mapping.dataset.owner_id != user.id:
            raise ForbiddenError("Accès non autorisé à ce mapping.")
        return mapping

    async def create(
        self, db: AsyncSession, mapping_in: schemas.MappingCreate, dataset_id: uuid.UUID
    ) -> models.Mapping:
        """Crée un nouveau mapping."""
        from app.domain.file import models as file_models
        from fastapi import HTTPException, status
        
        # Vérifie que le fichier source existe et est prêt
        file = await db.get(file_models.File, mapping_in.source_file_id)
        if not file:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier source non trouvé.")
        
        if file.status != file_models.FileStatus.READY:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier n'est pas encore prêt pour le mapping.")
        
        if not file.inferred_schema:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Le fichier n'a pas de schéma inféré.")
        
        # Vérifie que les colonnes source existent dans le schéma
        schema_columns = set(file.inferred_schema.keys())
        for rule in mapping_in.mapping_rules:
            if rule.source not in schema_columns:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Colonne '{rule.source}' non trouvée dans le schéma du fichier.")
        
        new_mapping = models.Mapping(
            **mapping_in.model_dump(),
            dataset_id=dataset_id
        )
        db.add(new_mapping)
        await db.commit()
        await db.refresh(new_mapping)
        logger.info(f"Mapping '{new_mapping.name}' (ID: {new_mapping.id}) créé pour dataset {dataset_id}.")
        return new_mapping

    # Méthodes de validation DSL
    @staticmethod
    def validate(mapping: Dict[str, Any]) -> schemas.ValidateOut:
        """Valide un mapping DSL et retourne les erreurs/warnings."""
        mapping_validate_total.inc()
        
        ok, errs = _validate(mapping)
        if not ok:
            # Incrémenter les compteurs d'erreurs par code
            for e in errs:
                mapping_validate_errors_total.labels(code=e.get("code", "unknown")).inc()
            
            return schemas.ValidateOut(
                errors=[schemas.ValidationIssueModel(
                    code=e["code"], 
                    path=e["path"], 
                    msg=e["msg"]
                ) for e in errs]
            )
        # TODO: field_stats + warnings + compile preview si besoin
        return schemas.ValidateOut(errors=[], warnings=[], field_stats=[], compiled=None)

    @staticmethod
    def _apply_containers(props: dict, containers: list[dict]) -> None:
        """Applique la définition des containers (object/nested) au mapping ES."""
        for c in containers or []:
            path = c["path"]  # ex: "contacts[]" ou "address"
            ctype = c["type"]  # "nested" | "object"
            parts = path.replace("[]", "").split(".")
            
            node = props
            for p in parts[:-1]:
                node = node.setdefault(p, {}).setdefault("properties", {})
            
            leaf = parts[-1]
            node.setdefault(leaf, {}).setdefault("properties", {})
            # Si [] présent → type nested, sinon object
            node[leaf]["type"] = "nested" if "[]" in path or ctype == "nested" else "object"

    @staticmethod
    def compile(mapping: Dict[str, Any], include_plan: bool = False) -> schemas.CompileOut:
        """Compile un mapping DSL en mapping Elasticsearch exploitable."""
        start_time = time.time()
        mapping_compile_total.inc()
        
        # Compilation ES minimale (types + multi-fields). Les analyzers/normalizers sont passés tels quels.
        props: Dict[str, Any] = {}
        
        # Appliquer d'abord les containers (object/nested)
        MappingService._apply_containers(props, mapping.get("containers") or [])
        
        for f in mapping["fields"]:
            field_def: Dict[str, Any] = {"type": f["type"]}
            if f.get("format"): 
                field_def["format"] = f["format"]
            if f.get("analyzer"): 
                field_def["analyzer"] = f["analyzer"]
            if f.get("normalizer"): 
                field_def["normalizer"] = f["normalizer"]
            if f.get("options"): 
                field_def.update({k: v for k, v in f["options"].items()})
            
            # multi_fields
            if f.get("multi_fields"):
                field_def["fields"] = {}
                for mf in f["multi_fields"]:
                    sub = {"type": mf["type"]}
                    if mf.get("analyzer"): 
                        sub["analyzer"] = mf["analyzer"]
                    if mf.get("normalizer"): 
                        sub["normalizer"] = mf["normalizer"]
                    field_def["fields"][mf["name"]] = sub
            
            # imbrication support simple: "a.b.c"
            node = props
            parts = f["target"].split(".")
            for p in parts[:-1]:
                node = node.setdefault(p, {}).setdefault("properties", {})
            node[parts[-1]] = field_def

        settings = mapping.get("settings") or {}
        plan = [{"target": f["target"], "input": f["input"], "ops": f.get("pipeline", [])} for f in mapping["fields"]] if include_plan else None
        
        # Calcul du hash du DSL normalisé pour idempotence
        dsl = dict(mapping)  # Copie défensive
        dsl.setdefault("dsl_version", "2.1")  # Version V2.1 par défaut
        normalized = _normalized_dsl(dsl)
        compiled_hash = _sha256(normalized)
        
        # Génération automatique des pipelines d'ingestion et politiques ILM
        ingest = MappingService._gen_ingest_pipeline(mapping)
        ilm = MappingService._gen_ilm_policy(mapping)
        
        # ⚠️ stocke compiled_hash quand tu persistes MappingVersion
        out = schemas.CompileOut(
            settings=settings, 
            mappings={"properties": props}, 
            execution_plan=plan,
            compiled_hash=compiled_hash,
            ingest_pipeline=ingest,
            ilm_policy=ilm
        )
        
        # Mesurer la durée de compilation
        duration = time.time() - start_time
        mapping_compile_duration_seconds.observe(duration)
        
        return out

    @staticmethod
    def dry_run(mapping: Dict[str, Any], sample: Dict[str, Any]) -> schemas.DryRunOut:
        """Exécute un dry-run du mapping sur un échantillon de données."""
        start_time = time.time()
        dry_run_total.inc()
        
        from app.domain.mapping.executor import run_dry_run
        
        # sample attend "rows": List[Dict[str, Any]]
        rows = sample.get("rows", [])
        
        # Mesurer la taille de l'échantillon
        dry_run_sample_size.observe(len(rows))
        
        result = run_dry_run(mapping, rows)
        
        # Mesurer la durée et incrémenter les issues par code
        duration_ms = (time.time() - start_time) * 1000
        dry_run_duration_ms.observe(duration_ms)
        
        # Compter les issues par code
        if "issues" in result:
            for issue in result["issues"]:
                code = issue.get("code", "unknown")
                dry_run_issues_total.labels(code=code).inc()
        
        from .schemas import DryRunOut
        return DryRunOut(**result)

    @staticmethod
    def infer_types(rows: List[dict], globals_cfg: dict) -> InferTypesOut:
        """Infère les types Elasticsearch à partir d'un échantillon de données."""
        fs, sug = infer_types(rows, globals_cfg or {})
        return InferTypesOut(field_stats=fs, suggestions=sug)

    @staticmethod
    def estimate_size(mapping: dict, field_stats: List[dict], num_docs: int, replicas: int = 1, target_shard_gb: int = 30) -> EstimateSizeOut:
        """Estime la taille de l'index et recommande le nombre de shards."""
        data = estimate_size(mapping, field_stats, num_docs, replicas, target_shard_gb)
        return EstimateSizeOut(**data)

    @staticmethod
    def _gen_ingest_pipeline(mapping: dict) -> dict:
        """Génère un pipeline d'ingestion automatique."""
        name = f"{mapping['index']}_ingest_v1"
        procs = [
            {"set": {"field": "_meta.ingested_at", "value": "{{_ingest.timestamp}}" }}
        ]
        # date processors (basique) pour les fields 'date'
        for f in mapping.get("fields", []):
            if f.get("type") == "date":
                field = f["target"]
                formats = f.get("format") or "ISO8601"
                procs.append({"date": {"field": field, "target_field": field, "formats": formats.split("||")}})
        return {"name": name, "pipeline": {"processors": procs, "on_failure": [{"set":{"field":"_meta.ingest_error","value":"{{_ingest.on_failure_message}}"}}]}}

    @staticmethod
    def _gen_ilm_policy(mapping: dict, target_shard_gb: int = 30) -> dict:
        """Génère une politique ILM automatique."""
        name = f"{mapping['index']}_ilm_v1"
        policy = {
          "policy": {
            "phases": {
              "hot":   {"actions": {"rollover": {"max_primary_shard_size": f"{target_shard_gb}gb", "max_age": "30d"}}},
              "warm":  {"min_age": "30d","actions": {"forcemerge": {"max_num_segments": 1}}},
              "delete":{"min_age": "180d","actions": {"delete": {}}}
            }
          }
        }
        return {"name": name, "policy": policy}

    # Méthodes de versioning
    async def get_with_versions(
        self, db: AsyncSession, mapping_id: uuid.UUID, user: User
    ) -> models.Mapping:
        """Récupère un mapping avec toutes ses versions."""
        from app.domain.dataset.models import Dataset
        
        query = (
            select(models.Mapping)
            .join(Dataset)
            .where(models.Mapping.id == mapping_id, Dataset.owner_id == user.id)
            .options(
                selectinload(models.Mapping.versions).options(
                    joinedload(models.MappingVersion.creator)
                )
            )
        )
        result = await db.execute(query)
        mapping = result.scalars().first()

        if not mapping:
            raise ResourceNotFoundError("Mapping non trouvé ou accès non autorisé.")
        
        return mapping

    async def create_version(
        self, db: AsyncSession, mapping_id: uuid.UUID, version_in: schemas.MappingVersionCreate, user: User
    ) -> models.MappingVersion:
        """Crée une nouvelle version d'un mapping."""
        # Vérifier que l'utilisateur a accès au mapping via le dataset
        mapping = await self.get_owned_by_user(db, mapping_id, user)
        
        # Désactiver l'ancienne version active
        if version_in.is_active:
            await self._deactivate_current_version(db, mapping_id)
        
        # Obtenir le numéro de la prochaine version
        next_version = await self._get_next_version_number(db, mapping_id)
        
        # Créer la nouvelle version
        new_version = models.MappingVersion(
            mapping_id=mapping_id,
            version=next_version,
            dsl_content=version_in.dsl_content,
            description=version_in.description,
            version_metadata=version_in.version_metadata,
            created_by=user.id,
            is_active=version_in.is_active or False
        )
        db.add(new_version)
        
        await db.commit()
        await db.refresh(new_version)
        
        logger.info(f"Version {next_version} du mapping {mapping_id} créée par {user.id}.")
        return new_version

    async def update_version(
        self, db: AsyncSession, version_id: uuid.UUID, version_in: schemas.MappingVersionUpdate, user: User
    ) -> models.MappingVersion:
        """Met à jour une version de mapping."""
        version = await self._get_version_by_id(db, version_id, user)
        
        update_data = version_in.model_dump(exclude_unset=True)
        
        # Si on active cette version, désactiver les autres
        if version_in.is_active:
            await self._deactivate_current_version(db, version.mapping_id)
        
        for field, value in update_data.items():
            setattr(version, field, value)
        
        await db.commit()
        await db.refresh(version)
        logger.info(f"Version {version.version} du mapping {version.mapping_id} mise à jour.")
        return version

    async def remove_version(self, db: AsyncSession, version_id: uuid.UUID, user: User):
        """Supprime une version spécifique d'un mapping."""
        version = await self._get_version_by_id(db, version_id, user)
        
        # Vérifier qu'il ne s'agit pas de la seule version
        total_versions = await self._count_versions(db, version.mapping_id)
        if total_versions <= 1:
            raise ValueError("Impossible de supprimer la seule version d'un mapping.")
        
        await db.delete(version)
        await db.commit()
        logger.info(f"Version {version.version} du mapping {version.mapping_id} supprimée.")

    # Méthodes privées pour le versioning
    async def _deactivate_current_version(self, db: AsyncSession, mapping_id: uuid.UUID):
        """Désactive la version active actuelle d'un mapping."""
        query = (
            select(models.MappingVersion)
            .where(
                and_(
                    models.MappingVersion.mapping_id == mapping_id,
                    models.MappingVersion.is_active == True
                )
            )
        )
        result = await db.execute(query)
        active_versions = result.scalars().all()
        
        for version in active_versions:
            version.is_active = False

    async def _get_next_version_number(self, db: AsyncSession, mapping_id: uuid.UUID) -> int:
        """Obtient le numéro de la prochaine version."""
        query = (
            select(func.max(models.MappingVersion.version))
            .where(models.MappingVersion.mapping_id == mapping_id)
        )
        result = await db.execute(query)
        max_version = result.scalar()
        return (max_version or 0) + 1

    async def _get_version_by_id(self, db: AsyncSession, version_id: uuid.UUID, user: User) -> models.MappingVersion:
        """Récupère une version par son ID et vérifie les permissions."""
        version = await db.get(models.MappingVersion, version_id)
        if not version:
            raise ResourceNotFoundError("Version non trouvée.")
        
        # Vérifier que l'utilisateur a accès au mapping via le dataset
        await self.get_owned_by_user(db, version.mapping_id, user)
        return version

    async def _count_versions(self, db: AsyncSession, mapping_id: uuid.UUID) -> int:
        """Compte le nombre de versions d'un mapping."""
        query = select(func.count(models.MappingVersion.id)).where(
            models.MappingVersion.mapping_id == mapping_id
        )
        result = await db.execute(query)
        return result.scalar()

    async def update(
        self, db: AsyncSession, mapping_id: uuid.UUID, mapping_in: schemas.MappingUpdate
    ) -> models.Mapping:
        """Met à jour un mapping existant."""
        mapping = await db.get(models.Mapping, mapping_id)
        if not mapping:
            raise ResourceNotFoundError("Mapping non trouvé.")
        
        update_data = mapping_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(mapping, field, value)
        
        await db.commit()
        await db.refresh(mapping)
        logger.info(f"Mapping {mapping_id} mis à jour.")
        return mapping

    async def remove(self, db: AsyncSession, mapping_id: uuid.UUID):
        """Supprime un mapping."""
        mapping = await db.get(models.Mapping, mapping_id)
        if mapping:
            await db.delete(mapping)
            await db.commit()
            logger.info(f"Mapping ID {mapping_id} supprimé.")

    async def get_by_dataset(
        self, db: AsyncSession, dataset_id: uuid.UUID
    ) -> List[models.Mapping]:
        """Récupère tous les mappings d'un dataset."""
        query = select(models.Mapping).where(models.Mapping.dataset_id == dataset_id)
        result = await db.execute(query)
        return result.scalars().all()
