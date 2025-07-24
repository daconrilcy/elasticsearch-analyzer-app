# app/domain/user/models.py
import enum
from sqlalchemy import Column, String, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from app.core.db import Base
import uuid


# Énumération pour les rôles utilisateurs.
# L'utilisation d'une énumération garantit la cohérence des données.
class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole), nullable=False, default=UserRole.USER)