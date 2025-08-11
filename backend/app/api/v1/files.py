import uuid
from typing import List
import asyncio

from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

# Import des dépendances et des modèles/schémas
from app.core.db import get_db
# --- CORRECTION : Utiliser la dépendance du cookie ---
from app.api.dependencies import get_current_user_from_cookie
from app.domain.user.models import User
from app.domain.file import models, schemas
from app.domain.file.services import FileService, TaskService
from app.domain.file_preview.services import FilePreviewService
from app.domain.file_preview.schemas import FilePreviewChunk
from loguru import logger

router = APIRouter(
    tags=["Files"],
    # --- CORRECTION : Applique la dépendance du cookie à toutes les routes ---
    dependencies=[Depends(get_current_user_from_cookie)]
)

file_service = FileService()
preview_service = FilePreviewService()

# --- Dépendance de sécurité unifiée ---

async def get_current_file_for_owner(
    file_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    # --- CORRECTION : Utilise la dépendance du cookie ---
    current_user: User = Depends(get_current_user_from_cookie)
) -> models.File:
    """
    Dépendance FastAPI pour récupérer un fichier par son ID et vérifier
    que l'utilisateur authentifié en est bien le propriétaire.
    """
    return await file_service.get_owned_by_user(db=db, file_id=file_id, user=current_user)

# La dépendance get_current_file_for_owner_sse est maintenant redondante et a été supprimée.

# --- Endpoints de l'API ---

@router.get(
    "/{file_id}",
    response_model=schemas.FileOut,
    summary="Obtenir les détails d'un fichier"
)
async def get_file_details(
    file: models.File = Depends(get_current_file_for_owner),
    db: AsyncSession = Depends(get_db)
):
    """Retourne les informations détaillées pour un fichier spécifique."""
    # Charger explicitement la relation uploader pour avoir accès au nom d'utilisateur
    await db.refresh(file, attribute_names=['uploader'])
    
    # Créer un dictionnaire avec les données du fichier et le nom d'utilisateur
    file_data = {
        "id": file.id,
        "filename_original": file.filename_original,
        "filename_stored": file.filename_stored,
        "status": file.status,
        "parsing_error": file.parsing_error,
        "version": file.version,
        "size_bytes": file.size_bytes,
        "file_size": file.size_bytes,  # Alias pour compatibilité
        "hash": file.hash,
        "line_count": file.line_count,
        "column_count": file.column_count,
        "uploader_id": file.uploader_id,
        "uploader_name": file.uploader.username if file.uploader else None,
        "created_at": file.created_at,
        "updated_at": file.updated_at,
        "ingestion_status": file.ingestion_status,
        "docs_indexed": file.docs_indexed,
        "ingestion_errors": file.ingestion_errors,
        "mapping_id": None,  # Le modèle File n'a pas cet attribut
        "inferred_schema": file.inferred_schema,
        "preview_data": file.preview_data,
        "mime_type": file.mime_type
    }
    
    return file_data

@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un fichier"
)
async def delete_file(
    file: models.File = Depends(get_current_file_for_owner),
    db: AsyncSession = Depends(get_db)
):
    """Supprime un fichier du stockage physique et de la base de données."""
    await file_service.remove(db=db, file_id=file.id)
    return

@router.post(
    "/{file_id}/reparse",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Relancer le parsing d'un fichier"
)
async def reparse_file(
    file: models.File = Depends(get_current_file_for_owner),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Déclenche une nouvelle tâche de fond pour parser ou re-parser un fichier."""
    if file.status in [models.FileStatus.PARSING, models.IngestionStatus.IN_PROGRESS]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Le fichier est déjà en cours de traitement (statut: {file.status.value})."
        )
    task_service = TaskService()
    background_tasks.add_task(task_service.parse_file, file_id=file.id)
    return {"message": "La tâche de parsing pour le fichier a été lancée."}

from starlette.responses import Response
from sse_starlette.sse import EventSourceResponse

@router.get("/{file_id}/status")
async def stream_file_status(
    file: models.File = Depends(get_current_file_for_owner),
    db: AsyncSession = Depends(get_db)
):
    async def event_generator():
        last_status = None
        keepalive_count = 0
        try:
            while file.status in [models.FileStatus.PENDING, models.FileStatus.PARSING]:
                await asyncio.sleep(2)
                await db.refresh(file)
                # Statut changé : on notifie
                if file.status != last_status:
                    yield {
                        "event": "status_update",
                        "data": file.status.value
                    }
                    last_status = file.status
                else:
                    keepalive_count += 1
                    # Ping toutes les 10s
                    if keepalive_count % 5 == 0:
                        yield {"data": "ping"}
            # Statut final obligatoire
            yield {
                "event": "status_update",
                "data": file.status.value
            }
            # Si erreur, message dédié
            if file.status == models.FileStatus.ERROR and file.ingestion_errors:
                yield {
                    "event": "parsing_error",
                    "data": file.ingestion_errors[0]
                }
        except Exception as e:
            # Log optionnel ici
            yield {
                "event": "error",
                "data": f"Erreur interne SSE: {str(e)}"
            }
    # Indique explicitement le content-type SSE (précaution pour Vite)
    return EventSourceResponse(event_generator(), headers={"Content-Type": "text/event-stream"})


@router.get(
    "/{file_id}/preview",
    response_model=FilePreviewChunk,
    summary="Obtenir un aperçu (chunk) d'un fichier"
)
async def get_file_preview(
    file: models.File = Depends(get_current_file_for_owner),
    chunk_index: int = Query(0, ge=0),
    chunk_size: int = Query(100, ge=1, le=10_000),
):
    """Retourne un aperçu paginé par chunk du contenu du fichier."""
    return preview_service.get_preview(file, chunk_index=chunk_index, chunk_size=chunk_size)


@router.get(
    "/{file_id}/download",
    summary="Télécharger un fichier"
)
async def download_file(
    file: models.File = Depends(get_current_file_for_owner),
    db: AsyncSession = Depends(get_db)
):
    """Télécharge le fichier physique stocké sur le serveur."""
    from pathlib import Path
    from fastapi.responses import FileResponse
    from app.core.config import settings
    
    try:
        # Construire le chemin du fichier stocké
        folder = settings.UPLOAD_DIR / str(file.dataset_id)
        file_path = folder / file.filename_stored
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Le fichier physique n'a pas été trouvé sur le serveur."
            )
        
        # Retourner le fichier en tant que réponse de téléchargement
        return FileResponse(
            path=file_path,
            filename=file.filename_original,
            media_type='application/octet-stream'
        )
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du fichier {file.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur interne lors du téléchargement du fichier."
        )

