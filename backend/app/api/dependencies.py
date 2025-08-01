"""backend/app/api/dependencies.py"""
import uuid
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status,Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.domain.user import models as user_models
from app.domain.user.services import user_service

# Utilise le paramétrage dynamique, mais conserve la clarté du commentaire.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
        token: str = Depends(oauth2_scheme),
        session: AsyncSession = Depends(get_db)
) -> user_models.User:
    """
    Récupère l'utilisateur authentifié via le token JWT.
    Lève HTTP 401 si échec.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_from_payload: str | None = payload.get("sub")
        if user_id_from_payload is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_from_payload)
    except (ValueError, TypeError):
        logger.warning(f"Format d'UUID invalide dans le token: {user_id_from_payload}")
        raise credentials_exception

    user = await user_service.get(session, user_id=user_id)
    if user is None:
        logger.warning(f"Aucun utilisateur trouvé avec l'UUID {user_id}")
        raise credentials_exception

    token_role = payload.get("role")
    if not token_role or user.role.value != token_role:
        logger.warning(f"Incohérence de rôle pour l'utilisateur {user.id}. Token: {token_role}, BDD: {user.role.value}")
        raise credentials_exception

    return user

async def get_current_user_from_cookie(
    access_token: str | None = Cookie(None), # Récupère le cookie nommé "access_token"
    db: AsyncSession = Depends(get_db)
) -> user_models.User:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non authentifié (cookie manquant)"
        )
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Le cookie peut contenir "Bearer ", on le retire
        token = access_token.split(" ")[-1]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await user_service.get(db, user_id)
    if user is None:
        raise credentials_exception
    return user


def require_role(required_role: user_models.UserRole):
    """
    Dépendance pour restreindre l’accès à un rôle utilisateur précis.
    Usage: Depends(require_role(UserRole.admin))
    """

    async def role_checker(current_user: user_models.User = Depends(get_current_user)) -> user_models.User:
        """Vérifie le rôle de l'utilisateur."""
        if current_user.role != required_role:
            logger.warning(
                f"Accès refusé pour l'utilisateur {current_user.username} : "
                f"Rôle requis={required_role.value}, rôle actuel={current_user.role.value}."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
            )
        return current_user

    return role_checker

# --- Ajout de la dépendance pour la pagination ---
class PaginationParams:
    """
    Dépendance pour gérer les paramètres de pagination (skip/limit).
    Elle fournit des valeurs par défaut et plafonne la limite pour éviter les abus.
    """
    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip = skip
        # On s'assure que la limite ne dépasse jamais 100 pour la performance
        self.limit = min(limit, 100)
