#!/usr/bin/env python3
"""Script pour vérifier les utilisateurs dans la base de données"""

import asyncio
from app.core.db import engine
from app.domain.user.models import User
from sqlalchemy import select

async def main():
    async with engine.begin() as conn:
        result = await conn.execute(select(User))
        users = result.fetchall()
        print(f'Utilisateurs trouvés: {len(users)}')
        for user in users:
            print(f'- {user.username} (ID: {user.id})')

if __name__ == "__main__":
    asyncio.run(main())
