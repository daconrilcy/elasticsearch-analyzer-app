""" backend/app/domain/user/services.py """
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.domain.user.models import User
from app.core.security import get_password_hash, verify_password
from app.domain.user.schemas import UserCreate
from fastapi import HTTPException


class UserService:
    """
    Classe de service regroupant la logique métier pour les utilisateurs.
    """

    @staticmethod
    async def get(db: AsyncSession, user_id: uuid.UUID) -> User | None:
        """
        Récupère un utilisateur par son ID.
        C'est la fonction qui manquait pour la dépendance get_current_user.
        """
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_username(db: AsyncSession, username: str) -> User | None:
        """Récupère un utilisateur par son nom d'utilisateur."""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> User | None:
        """Récupère un utilisateur par son email."""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create(self, db: AsyncSession, user_in: UserCreate) -> User:
        """Crée un nouvel utilisateur."""
        if await self.get_by_username(db, user_in.username):
            raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
        if await self.get_by_email(db, user_in.email):
            raise HTTPException(status_code=400, detail="Email déjà utilisé")

        hashed_password = get_password_hash(user_in.password)
        user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hashed_password
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def authenticate(self, db: AsyncSession, username: str, password: str) -> User | None:
        """Authentifie un utilisateur."""
        user = await self.get_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user


# On crée une instance unique (singleton) de la classe de service.
# C'est cet objet 'user_service' qui sera importé par les autres fichiers.
user_service = UserService()
