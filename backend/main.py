""""main.py"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

# Imports des modules de l'application
from app.api.v1 import analyzers, projects, es_config_files, auth, datasets, files
from app.core.db import engine, Base, get_db
from app.core.logging_config import setup_logging
import app.domain  # Assure l'import de tous les modèles SQLAlchemy (User, Dataset, File, Mapping)
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException
from loguru import logger

# --- Métadonnées pour la documentation de l'API ---
# Décrit chaque groupe d'endpoints pour une meilleure lisibilité dans la documentation auto-générée.
tags_metadata = [
    {
        "name": "Authentication",
        "description": "Endpoints pour l'enregistrement et la connexion des utilisateurs.",
    },
    {
        "name": "Datasets",
        "description": "Gestion complète des jeux de données : upload, parsing, mapping, ingestion et recherche.",
    },
    {
        "name": "Projects",
        "description": "Gestion des projets d'analyseurs personnalisés.",
    },
    {
        "name": "Analyzer",
        "description": "Endpoints pour le débogage et la validation des analyseurs personnalisés.",
    },
    {
        "name": "ES Config Files",
        "description": "Gestion des fichiers de configuration pour les analyseurs (ex: stopwords).",
    },
    {
        "name": "Health Checks",
        "description": "Endpoints pour surveiller la santé et la disponibilité de l'application.",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gère les événements de démarrage et d'arrêt de l'application.
    """
    # Configurer le logging au démarrage
    setup_logging()
    logger.info("Démarrage de l'application...")

    # Créer les tables de la base de données si elles n'existent pas
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables de la base de données vérifiées/créées.")

    yield  # L'application s'exécute ici

    logger.info("Arrêt de l'application...")


app = FastAPI(
    title="Elasticsearch Data Wizard API",
    description="Une API pour guider les utilisateurs de l'upload de données à la création d'index Elasticsearch, en passant par la conception d'analyseurs personnalisés.",
    version="1.0.0",
    openapi_tags=tags_metadata,
    lifespan=lifespan
)

# Configuration CORS pour autoriser les requêtes du frontend
origins = [
    "http://localhost:5173",  # Adresse par défaut de Vite
    "http://localhost:3000",  # Autre port de développement courant
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NOUVEAU : Gestionnaire d'exceptions global ---
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    import sys
    print(f"[EXCEPTION_HANDLER] catch: {exc.__class__.__name__} | status: {exc.status_code} | detail: {exc.detail}", file=sys.stderr)
    logger.debug(f"[EXCEPTION_HANDLER] catch: {exc.__class__.__name__} | status: {exc.status_code} | detail: {exc.detail}", file=sys.stderr)
    logger.warning(f"Erreur interceptée: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log interne si tu veux
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur serveur inattendue."}
    )

# --- Endpoints de Health Check ---
@app.get("/health", tags=["Health Checks"])
async def health_check():
    """Vérifie si l'application est en cours d'exécution (liveness probe)."""
    logger.info("Health check demandé.")
    return {"status": "ok"}


@app.get("/ready", tags=["Health Checks"])
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Vérifie si l'application est prête à accepter du trafic (readiness probe)."""
    try:
        await db.execute("SELECT 1")
        logger.info("Readiness check réussi.")
        return {"status": "ready", "dependencies": {"database": "ok"}}
    except Exception as e:
        logger.error(f"Readiness check échoué : impossible de se connecter à la base de données. Erreur: {e}")
        return {"status": "not_ready", "dependencies": {"database": "error"}}


# --- Inclusion des routeurs de l'API ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(analyzers.router, prefix="/api/v1/analyzer", tags=["Analyzer"])
app.include_router(es_config_files.router, prefix="/api/v1/es_config_files", tags=["ES Config Files"])

if __name__ == "__main__":
    import os
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    print("[FastAPI] PID:", os.getpid())
