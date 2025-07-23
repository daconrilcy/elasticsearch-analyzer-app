from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api.v1 import analyzers, projects, es_config_files, auth
from app.core.db import engine, Base
from dotenv import load_dotenv

# 👇 1. Importez le middleware CORS
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


@asynccontextmanager
async def lifespan():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables checked/created (lifespan startup)")
    yield
    # ...


app = FastAPI(lifespan=lifespan)

# 👇 2. Définissez les origines autorisées
origins = [
    "http://localhost:5173",  # L'adresse de votre frontend Vite
    "http://localhost:3000",  # Au cas où vous utiliseriez un autre port
]

# 👇 3. Ajoutez le middleware à votre application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes (GET, POST, etc.)
    allow_headers=["*"],  # Autorise tous les en-têtes
)

# Le reste de votre fichier main.py
app.include_router(analyzers.router, prefix="/api/v1/analyzer")
app.include_router(projects.router, prefix="/api/v1/projects")
app.include_router(es_config_files.router, prefix="/api/v1/es_config_files")
app.include_router(auth.router, prefix="/api/v1/auth")


@app.get("/ping")
def ping():
    return {"message": "pong"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
