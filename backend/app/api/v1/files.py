import uuid
from typing import List

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

# Import des dépendances et des modèles/schémas depuis leurs emplacements corrects
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.domain.user.models import User
from app.domain.dataset import models, schemas
from app.domain.dataset.services import FileService  # Import de la classe de service

router = APIRouter(
    prefix="/files",
    tags=["Files"],
    # Applique la dépendance d'authentification à toutes les routes de ce routeur
    dependencies=[Depends(get_current_user)]
)

# Instance du service qui sera utilisée par les endpoints
file_service = FileService()


# --- Dépendance pour la sécurité ---

async def get_current_file_for_owner(
        file_id: uuid.UUID,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
) -> models.File:
    """
    Dépendance FastAPI pour récupérer un fichier par son ID et vérifier
    que l'utilisateur authentifié en est bien le propriétaire (via le dataset).
    Lève une exception 404 ou 403 si ce n'est pas le cas.
    """
    return await file_service.get_owned_by_user(db=db, file_id=file_id, user=current_user)


# --- Endpoints de l'API ---

@router.get(
    "/{file_id}",
    response_model=schemas.FileDetailOut,
    summary="Obtenir les détails d'un fichier"
)
async def get_file_details(
        file: models.File = Depends(get_current_file_for_owner)
):
    """
    Retourne les informations détaillées pour un fichier spécifique.
    L'accès est sécurisé par la dépendance `get_current_file_for_owner`.
    """
    return file


@router.delete(
    "/{file_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un fichier"
)
async def delete_file(
        file: models.File = Depends(get_current_file_for_owner),
        db: AsyncSession = Depends(get_db)
):
    """
    Supprime un fichier du stockage physique et de la base de données.
    """
    # Note: Il faudrait ajouter une méthode `remove` au FileService.
    # En attendant, la logique est ici mais devrait être déplacée.
    await file_service.remove(db=db, file_id=file.id)
    # Une réponse 204 No Content ne doit pas avoir de corps.
    return


@router.post(
    "/{file_id}/reparse",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Relancer le parsing d'un fichier"
)
async def reparse_file(
        file: models.File = Depends(get_current_file_for_owner)
):
    """
    Déclenche une nouvelle tâche de fond pour parser ou re-parser un fichier.
    Ceci est utile si le processus de parsing initial a échoué ou si la logique a changé.
    """
    if file.status in [models.FileStatus.PARSING, models.FileStatus.IN_PROGRESS]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Le fichier est déjà en cours de traitement (statut: {file.status.value})."
        )

    # La méthode `launch_parsing_task` devrait idéalement mettre à jour le statut
    # et lancer la tâche de fond.
    await file_service.launch_parsing_task(file_id=file.id)

    return {"message": "La tâche de parsing pour le fichier a été lancée."}
