# backend/app/domain/user/schemas.py

import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from .models import UserRole


class UserCreate(BaseModel):
    """Schéma pour la création d'un utilisateur."""
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    """Schéma pour la connexion utilisateur."""
    username: str
    password: str


class UserOut(BaseModel):
    """Schéma de sortie utilisateur (réponse API)."""
    id: uuid.UUID
    username: str
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)
