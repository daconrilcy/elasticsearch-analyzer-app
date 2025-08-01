""" app/api/v1/auth.py """
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.domain.user.services import user_service
from app.domain.user import schemas as user_schemas
from app.api.dependencies import get_current_user, get_current_user_from_cookie

router = APIRouter()


@router.post("/register", response_model=user_schemas.UserOut)
async def register(user_in: user_schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    """Crée un nouvel utilisateur (avec le rôle 'user' par défaut)."""
    return await user_service.create(db, user_in)


@router.post("/login")
async def login(
    response: Response,  # Injecte l'objet Response de FastAPI
    user_in: user_schemas.UserLogin, 
    db: AsyncSession = Depends(get_db)
):
    """
    Authentifie un utilisateur, place le token JWT dans un cookie HttpOnly sécurisé,
    et retourne les informations de l'utilisateur.
    """
    user = await user_service.authenticate(db, user_in.username, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Identifiants invalides"
        )

    # Crée le token avec l'ID de l'utilisateur et son rôle
    token_data = {"sub": str(user.id), "role": user.role.value}
    token = create_access_token(token_data)

    # --- Logique de Cookie Sécurisé ---
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,  # Le cookie est inaccessible depuis JavaScript (protection XSS)
        samesite="lax", # Protection contre les attaques CSRF
        expires=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        # secure=True,  # À activer en production (HTTPS)
        # domain=None,  # Laissez à None pour localhost
    )
    
    # Le corps de la réponse peut être un simple message de succès
    # ou les informations de l'utilisateur si le frontend en a besoin immédiatement.
    return {"message": "Connexion réussie"}


@router.post("/logout")
async def logout(response: Response):
    """Déconnecte l'utilisateur en supprimant le cookie d'authentification."""
    response.delete_cookie(key="access_token")
    return {"message": "Déconnexion réussie"}


@router.get("/me", response_model=user_schemas.UserOut)
async def read_me(
    current_user: user_schemas.UserOut = Depends(get_current_user_from_cookie)):
    """Retourne les informations de l'utilisateur actuellement connecté."""
    return current_user