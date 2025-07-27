import uuid
import hashlib
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import aiofiles
import pandas as pd
from loguru import logger

from app.domain.dataset import models
from app.domain.user.models import User
from app.domain.dataset.schemas import FileStructureField
from app.core.config import settings


async def get_file(db: AsyncSession, file_id: uuid.UUID) -> Optional[models.UploadedFile]:
    """Récupère un fichier uploadé."""
    return await db.get(models.UploadedFile, file_id)


async def get_file_owned_by_user(db: AsyncSession, file_id: uuid.UUID, user: User) -> models.UploadedFile:
    file = await get_file(db, file_id)
    if not file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fichier non trouvé.")
    if file.dataset.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé à ce fichier.")
    return file


def _generate_stored_filename(dataset_id: uuid.UUID, version: int, original_filename: str) -> str:
    extension = Path(original_filename).suffix
    return f"{dataset_id}_v{version}{extension}"


async def _calculate_file_hash(file: UploadFile) -> str:
    hasher = hashlib.sha256()
    await file.seek(0)
    while chunk := await file.read(8192):
        hasher.update(chunk)
    await file.seek(0)
    return hasher.hexdigest()


async def _get_next_version(db: AsyncSession, dataset_id: uuid.UUID) -> int:
    from sqlalchemy import select, func
    result = await db.execute(
        select(func.max(models.UploadedFile.version)).where(models.UploadedFile.dataset_id == dataset_id)
    )
    max_version = result.scalar_one_or_none()
    return (max_version or 0) + 1


async def _is_duplicate(db: AsyncSession, dataset_id: uuid.UUID, file_hash: str) -> bool:
    from sqlalchemy import select
    result = await db.execute(
        select(models.UploadedFile).where(
            models.UploadedFile.dataset_id == dataset_id,
            models.UploadedFile.hash == file_hash
        )
    )
    return result.scalars().first() is not None


def _infer_schema(df: pd.DataFrame) -> List[Dict[str, str]]:
    schema = []
    for column, dtype in df.dtypes.items():
        if "int" in str(dtype):
            type_str = "integer"
        elif "float" in str(dtype):
            type_str = "float"
        elif "datetime" in str(dtype):
            type_str = "datetime"
        else:
            type_str = "string"
        schema.append({"field": column, "type": type_str})
    return schema


async def upload_new_file_version(
    db: AsyncSession, dataset: models.Dataset, file: UploadFile, uploader: User
) -> Tuple[models.UploadedFile, List[Dict[str, str]]]:
    file_hash = await _calculate_file_hash(file)
    if await _is_duplicate(db, dataset.id, file_hash):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Fichier déjà existant.")

    version = await _get_next_version(db, dataset.id)
    stored_name = _generate_stored_filename(dataset.id, version, file.filename)
    folder = settings.UPLOAD_DIR / str(dataset.id)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / stored_name

    try:
        async with aiofiles.open(path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        logger.error(f"Erreur sauvegarde fichier : {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Erreur lors de la sauvegarde.")

    size = path.stat().st_size
    new_file = models.UploadedFile(
        dataset_id=dataset.id,
        filename_original=file.filename,
        filename_stored=stored_name,
        version=version,
        hash=file_hash,
        size_bytes=size,
        uploader_id=uploader.id,
    )

    inferred = []
    try:
        if path.suffix == '.csv':
            df = pd.read_csv(path, nrows=100)
        elif path.suffix in ['.xlsx', '.xls']:
            df = pd.read_excel(path, nrows=100)
        elif path.suffix == '.json':
            df = pd.read_json(path, lines=True)
        else:
            df = None
        if df is not None:
            inferred = _infer_schema(df)
            new_file.inferred_schema = inferred
    except Exception as e:
        logger.warning(f"Échec inférence schéma : {e}")

    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return new_file, inferred
