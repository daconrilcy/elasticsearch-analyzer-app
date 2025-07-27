# backend/app/domain/user/schemas.py

import uuid
import enum
from pydantic import BaseModel, EmailStr, ConfigDict

# --- DÉFINITION DE L'ÉNUMÉRATION ICI POUR CASSER L'IMPORT CIRCULAIRE ---
class UserRole(str, enum.Enum):
    """Énumération pour les rôles utilisateurs."""
    USER = "user"
    ADMIN = "admin"


# --- SCHÉMAS Pydantic ---

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
    is_active: bool

    # Permet de créer le schéma à partir d'un objet de modèle SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
