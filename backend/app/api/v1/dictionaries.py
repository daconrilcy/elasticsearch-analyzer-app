# app/api/v1/dictionaries.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, List
from sqlalchemy.ext.asyncio import AsyncSession

from ...domain.dictionary.services import DictionaryService
from ...domain.dictionary.schemas import (
    DictionaryCreate, DictionaryUpdate, DictionaryOut, DictionaryDetailOut,
    DictionaryVersionCreate, DictionaryVersionUpdate, DictionaryVersionOut,
    DictionarySearchResults
)
from ...core.db import get_db
from ...domain.user.models import User
from ..dependencies import get_current_user

router = APIRouter(prefix="/dictionaries", tags=["dictionaries"])


@router.post("/", response_model=DictionaryOut)
async def create_dictionary(
    dictionary_in: DictionaryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée un nouveau dictionnaire avec sa première version."""
    service = DictionaryService()
    dictionary, version = await service.create(db, dictionary_in, current_user)
    return dictionary


@router.get("/", response_model=DictionarySearchResults)
async def get_dictionaries(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère une liste paginée de dictionnaires de l'utilisateur."""
    service = DictionaryService()
    dictionaries = await service.get_multi_by_owner(db, current_user.id, skip, limit)
    
    # Convertir en schémas avec versions actives
    result_dictionaries = []
    for dict_obj in dictionaries:
        active_version = next((v for v in dict_obj.versions if v.is_active), None)
        dict_out = DictionaryOut.model_validate(dict_obj)
        dict_with_version = dict_out.model_copy()
        dict_with_version.active_version = DictionaryVersionOut.model_validate(active_version) if active_version else None
        result_dictionaries.append(dict_with_version)
    
    return DictionarySearchResults(
        total=len(result_dictionaries),
        dictionaries=result_dictionaries,
        page=skip // limit + 1,
        size=limit
    )


@router.get("/{dictionary_id}", response_model=DictionaryDetailOut)
async def get_dictionary(
    dictionary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Récupère un dictionnaire avec toutes ses versions."""
    service = DictionaryService()
    dictionary = await service.get_with_versions(db, dictionary_id, current_user)
    return dictionary


@router.put("/{dictionary_id}", response_model=DictionaryOut)
async def update_dictionary(
    dictionary_id: str,
    dictionary_in: DictionaryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour un dictionnaire existant."""
    service = DictionaryService()
    dictionary = await service.update(db, dictionary_id, dictionary_in, current_user)
    return dictionary


@router.delete("/{dictionary_id}")
async def delete_dictionary(
    dictionary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime un dictionnaire et toutes ses versions."""
    service = DictionaryService()
    await service.remove(db, dictionary_id, current_user)
    return {"message": "Dictionnaire supprimé avec succès"}


# --- Endpoints pour les versions ---

@router.post("/{dictionary_id}/versions", response_model=DictionaryVersionOut)
async def create_dictionary_version(
    dictionary_id: str,
    version_in: DictionaryVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crée une nouvelle version d'un dictionnaire."""
    service = DictionaryService()
    version = await service.create_version(db, dictionary_id, version_in, current_user)
    return version


@router.put("/versions/{version_id}", response_model=DictionaryVersionOut)
async def update_dictionary_version(
    version_id: str,
    version_in: DictionaryVersionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Met à jour une version de dictionnaire."""
    service = DictionaryService()
    version = await service.update_version(db, version_id, version_in, current_user)
    return version


@router.delete("/versions/{version_id}")
async def delete_dictionary_version(
    version_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Supprime une version spécifique d'un dictionnaire."""
    service = DictionaryService()
    await service.remove_version(db, version_id, current_user)
    return {"message": "Version supprimée avec succès"}
