from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


if __name__ == "__main__":
    from sqlalchemy import Column, Integer, String
    import asyncio


    class User(Base):
        __tablename__ = "users_test"
        id = Column(Integer, primary_key=True, index=True)
        name = Column(String, index=True)


    async def main():
        # 1. Crée la table
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # 2. Ajoute un user de test
        async with SessionLocal() as session:
            user = User(name="TestUser")
            session.add(user)
            await session.commit()

        # 3. Lis les users
        async with SessionLocal() as session:
            result = await session.execute(
                User.__table__.select()
            )
            users = result.fetchall()
            print("Users en base:", users)

        # 4. Drop table (optionnel)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)


    asyncio.run(main())
