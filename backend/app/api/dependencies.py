# app/api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from backend.app.core.db import get_db
from backend.app.core.security import decode_access_token
from backend.app.domain.user import models as user_models

# Ce schéma est utilisé par l'API de connexion pour générer le token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: AsyncSession = Depends(get_db)
) -> user_models.User:
    """
    Dépendance pour obtenir l'utilisateur actuellement authentifié à partir du token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les identifiants",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = await db.get(user_models.User, int(user_id))
    if user is None:
        raise credentials_exception

    # Vérification de sécurité : le rôle dans le token doit correspondre à celui en BDD.
    if user.role.value != payload.get("role"):
        logger.warning(f"Incohérence de rôle pour l'utilisateur {user.id}. Token invalide.")
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
