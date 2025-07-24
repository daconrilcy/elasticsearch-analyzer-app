from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.domain.user.models import User
from app.core.security import get_password_hash, verify_password
from app.domain.user.schemas import UserCreate
from fastapi import HTTPException


async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: UserCreate):
    if await get_user_by_username(db, user_in.username):
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
    if await get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    hashed_password = get_password_hash(user_in.password)
    user = User(username=user_in.username, email=user_in.email, hashed_password=hashed_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, username: str, password: str):
    user = await get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
