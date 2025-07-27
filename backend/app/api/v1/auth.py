# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import create_access_token
# --- CORRECTION 1: Importer l'instance du service, pas le module ---
from app.domain.user.services import user_service
from app.domain.user import schemas as user_schemas
# Import des nouvelles dépendances centralisées
from app.api.dependencies import get_current_user

router = APIRouter()


@router.post("/register", response_model=user_schemas.UserOut)
async def register(user_in: user_schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    """Crée un nouvel utilisateur (avec le rôle 'user' par défaut)."""
    # --- CORRECTION 2: Appeler la méthode sur l'instance du service ---
    return await user_service.create(db, user_in)


@router.post("/login")
async def login(user_in: user_schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    """Authentifie un utilisateur et retourne un token JWT incluant son rôle."""
    # --- CORRECTION 3: Appeler la méthode sur l'instance du service ---
    user = await user_service.authenticate(db, user_in.username, user_in.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")

    # Le rôle de l'utilisateur est maintenant inclus dans le payload du token.
    token_data = {"sub": str(user.id), "role": user.role.value}
    token = create_access_token(token_data)

    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=user_schemas.UserOut)
async def read_me(current_user: user_schemas.UserOut = Depends(get_current_user)):
    """Retourne les informations de l'utilisateur actuellement connecté."""
    return current_user

