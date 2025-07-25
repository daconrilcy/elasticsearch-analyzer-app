import uuid
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.domain.user import models as user_models
from app.domain.user.services import user_service

# Le tokenUrl doit correspondre au chemin complet de l'endpoint de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_db)
) -> user_models.User:
    """
    Dépendance pour obtenir l'utilisateur actuellement authentifié à partir du token JWT.
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
        # Gère le cas où la chaîne dans le token n'est pas un UUID valide
        raise credentials_exception

    # --- CORRECTION APPLIQUÉE ICI ---
    # On utilise le service pour récupérer l'utilisateur avec l'objet UUID directement,
    # sans aucune conversion en 'int'.
    user = await user_service.get(session, id=user_id)
    if user is None:
        raise credentials_exception

    # Optionnel mais recommandé : Vérification de sécurité sur le rôle
    if user.role.value != payload.get("role"):
        logger.warning(f"Incohérence de rôle pour l'utilisateur {user.id}. Token potentiellement invalide.")
        raise credentials_exception

    return user


def require_role(required_role: user_models.UserRole):
    """
    Factory de dépendances pour exiger un rôle utilisateur spécifique.
    """
    async def role_checker(current_user: user_models.User = Depends(get_current_user)) -> user_models.User:
        if current_user.role != required_role:
            logger.warning(
                f"Accès refusé pour l'utilisateur {current_user.username}. "
                f"Rôle requis: {required_role.value}, rôle actuel: {current_user.role.value}."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas les permissions nécessaires pour effectuer cette action.",
            )
        return current_user
    return role_checker

