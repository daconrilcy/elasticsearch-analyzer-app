# app/domain/dataset/services.py
import uuid
import hashlib
import aiofiles
import pandas as pd
from pathlib import Path
from typing import Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from loguru import logger

from . import models, schemas
from backend.app.domain.user.models import User
from backend.app.core.config import settings
from backend.app.core.db import \
    SessionLocal  # Assurez-vous que SessionLocal peut fournir une session synchrone pour les tâches


# --- Fonctions utilitaires ---

def _generate_stored_filename(dataset_id: uuid.UUID, version: int, original_filename: str) -> str:
    """Génère un nom de fichier unique et sécurisé pour le stockage."""
    extension = Path(original_filename).suffix
    return f"{dataset_id}_v{version}{extension}"


async def _calculate_file_hash(file: UploadFile) -> str:
    """Calcule le hash SHA256 d'un fichier uploadé de manière asynchrone."""
    hasher = hashlib.sha256()
    await file.seek(0)
    while chunk := await file.read(8192):
        hasher.update(chunk)
    await file.seek(0)
    return hasher.hexdigest()


# --- Services pour les Datasets ---

async def create_dataset(db: AsyncSession, dataset_in: schemas.DatasetCreate, owner: User) -> models.Dataset:
    """Crée un nouveau jeu de données."""
    new_dataset = models.Dataset(**dataset_in.model_dump(), owner_id=owner.id)
    db.add(new_dataset)
    await db.commit()
    await db.refresh(new_dataset)
    logger.info(f"Dataset '{new_dataset.name}' (ID: {new_dataset.id}) créé par l'utilisateur {owner.id}.")
    return new_dataset


async def get_dataset(db: AsyncSession, dataset_id: uuid.UUID) -> Optional[models.Dataset]:
    """Récupère un dataset par son ID."""
    return await db.get(models.Dataset, dataset_id)


# --- Services pour l'Upload de Fichiers ---

async def get_next_version(db: AsyncSession, dataset_id: uuid.UUID) -> int:
    """Calcule la prochaine version pour un fichier dans un dataset."""
    max_version_result = await db.execute(
        select(func.max(models.UploadedFile.version)).where(models.UploadedFile.dataset_id == dataset_id)
    )
    max_version = max_version_result.scalar_one_or_none()
    return (max_version or 0) + 1


async def is_hash_duplicate(db: AsyncSession, dataset_id: uuid.UUID, file_hash: str) -> bool:
    """Vérifie si un fichier avec le même hash existe déjà pour ce dataset."""
    result = await db.execute(
        select(models.UploadedFile).where(
            models.UploadedFile.dataset_id == dataset_id,
            models.UploadedFile.hash == file_hash
        )
    )
    return result.scalars().first() is not None


async def upload_new_file_version(
        db: AsyncSession,
        dataset: models.Dataset,
        file: UploadFile,
        uploader: User
) -> models.UploadedFile:
    """Orchestre le processus d'upload d'un nouveau fichier."""
    file_hash = await _calculate_file_hash(file)
    if await is_hash_duplicate(db, dataset.id, file_hash):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un fichier identique existe déjà pour ce jeu de données."
        )

    next_version = await get_next_version(db, dataset.id)

    stored_filename = _generate_stored_filename(dataset.id, next_version, file.filename)
    upload_path = settings.UPLOAD_DIR / str(dataset.id)
    upload_path.mkdir(parents=True, exist_ok=True)
    file_path = upload_path / stored_filename

    try:
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        logger.info(f"Fichier '{stored_filename}' sauvegardé sur le disque.")
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier : {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Impossible de sauvegarder le fichier.")

    file_size = file_path.stat().st_size

    new_file = models.UploadedFile(
        dataset_id=dataset.id,
        filename_original=file.filename,
        filename_stored=stored_filename,
        version=next_version,
        hash=file_hash,
        size_bytes=file_size,
        uploader_id=uploader.id,
    )

    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    logger.info(f"Fichier version {next_version} ajouté au dataset {dataset.id}.")

    return new_file


# --- Logique de Parsing ---

def _infer_schema_from_dataframe(df: pd.DataFrame) -> dict:
    """Infère un schéma simple à partir d'un DataFrame pandas."""
    schema = {}
    for column, dtype in df.dtypes.items():
        if "int" in str(dtype):
            schema[column] = "integer"
        elif "float" in str(dtype):
            schema[column] = "float"
        elif "datetime" in str(dtype):
            schema[column] = "datetime"
        else:
            schema[column] = "string"
    return schema


def parse_file_and_update_db(file_id: uuid.UUID):
    """
    Tâche exécutée en arrière-plan.
    Lit un fichier depuis le disque, infère son schéma, et met à jour la BDD.
    """
    db: Session = next(SessionLocal.get_db())
    uploaded_file = None  # CORRECTION: Initialisation de la variable à None
    try:
        uploaded_file = db.get(models.UploadedFile, file_id)
        if not uploaded_file:
            logger.error(f"[BackgroundTask] Fichier {file_id} non trouvé pour le parsing.")
            return

        uploaded_file.status = models.FileStatus.PARSING
        db.commit()

        file_path = settings.UPLOAD_DIR / str(uploaded_file.dataset_id) / uploaded_file.filename_stored
        logger.info(f"[BackgroundTask] Parsing du fichier : {file_path}")

        df = None
        if file_path.suffix == '.csv':
            df = pd.read_csv(file_path)
        elif file_path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        elif file_path.suffix == '.json':
            df = pd.read_json(file_path, lines=True)

        if df is not None:
            schema = _infer_schema_from_dataframe(df)
            uploaded_file.schema = schema
            uploaded_file.status = models.FileStatus.PARSED
            logger.info(f"[BackgroundTask] Schéma inféré pour le fichier {file_id}: {schema}")
        else:
            raise ValueError("Format de fichier non supporté pour le parsing.")

    except Exception as e:
        logger.error(f"[BackgroundTask] Échec du parsing pour le fichier {file_id}. Erreur: {e}")
        # CORRECTION: On vérifie maintenant directement la variable, ce qui est plus sûr.
        if uploaded_file:
            uploaded_file.status = models.FileStatus.ERROR
    finally:
        # CORRECTION: On s'assure que la variable existe avant de faire le commit.
        if uploaded_file:
            db.commit()
        db.close()
