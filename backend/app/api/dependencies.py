# app/api/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import uuid

from app.core.db import get_db
from app.core.security import decode_access_token
from app.domain.user import models as user_models

# Schéma d’authentification OAuth2 pour récupération du token JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
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

    # Décodage du token JWT
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Récupération et validation de l'ID utilisateur
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, TypeError):
        logger.warning(f"Format d'UUID invalide dans le token: {user_id_str}")
        raise credentials_exception

    # Récupération de l'utilisateur en BDD
    user = await db.get(user_models.User, user_id)
    if user is None:
        logger.warning(f"Aucun utilisateur trouvé avec l'UUID {user_id}")
        raise credentials_exception

    # Vérification de cohérence du rôle entre token et BDD
    token_role = payload.get("role")
    if not token_role or user.role.value != token_role:
        logger.warning(f"Incohérence de rôle pour l'utilisateur {user.id}. Token: {token_role}, BDD: {user.role.value}")
        raise credentials_exception

    return user


def require_role(required_role: user_models.UserRole):
    """
    Dépendance pour restreindre l’accès à un rôle utilisateur précis.
    Usage: Depends(require_role(UserRole.admin))
    """
    async def role_checker(current_user: user_models.User = Depends(get_current_user)) -> user_models.User:
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
