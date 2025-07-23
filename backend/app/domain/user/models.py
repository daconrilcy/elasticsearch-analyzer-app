# app/domain/user/models.py
import enum
from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum
from backend.app.core.db import Base


# Énumération pour les rôles utilisateurs.
# L'utilisation d'une énumération garantit la cohérence des données.
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # NOUVEAU CHAMP
    # Par défaut, tout nouvel utilisateur a le rôle 'user'.
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.USER)