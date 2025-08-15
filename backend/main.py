""""main.py"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

# Imports des modules de l'application
from app.api.v1 import analyzers, projects, es_config_files, auth, datasets, files, mappings, dictionaries, demo
from app.core.db import engine, Base, get_db
from app.core.logging_config import setup_logging

# Import explicite de tous les modèles SQLAlchemy dans le bon ordre
from app.domain.user.models import User
from app.domain.dataset.models import Dataset
from app.domain.file.models import File, FileStatus, IngestionStatus
from app.domain.mapping.models import Mapping, MappingVersion
from app.domain.dictionary.models import Dictionary, DictionaryVersion
from app.domain.project.models import Project
from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse, Response
from app.core.exceptions import AppException
from loguru import logger
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

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
        "name": "Mappings",
        "description": "Gestion des mappings DSL avec validation, compilation et versioning.",
    },
    {
        "name": "Dictionaries",
        "description": "Gestion des dictionnaires (stopwords, synonymes) avec versioning.",
    },
    {
        "name": "Demo",
        "description": "Endpoints de démonstration pour le Mapping Studio V2.2 et le Workbench.",
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
    
    # Forcer la configuration des relations SQLAlchemy
    from sqlalchemy.orm import configure_mappers
    configure_mappers()
    logger.info("Relations SQLAlchemy configurées.")

    # Warm-up performance : précharger les mappings actifs et compiler les pipelines
    try:
        from app.domain.mapping.services import MappingService
        from app.domain.mapping.models import MappingVersion
        from sqlalchemy import select, text
        
        # Précharger les versions actives des mappings
        async with engine.begin() as conn:
            # Vérifier que la table existe avant de faire la requête
            try:
                await conn.execute(text("SELECT 1 FROM mapping_versions LIMIT 1"))
            except Exception:
                logger.info("Table mapping_versions n'existe pas encore, warm-up ignoré")
                return
                
            result = await conn.execute(
                select(MappingVersion).where(MappingVersion.is_active == True)
            )
            active_versions = result.fetchall()
            
        if active_versions:
            logger.info(f"Warm-up : précompilation de {len(active_versions)} mappings actifs")
            for version in active_versions:
                try:
                    # Calculer compiled_hash et compiler le mapping
                    MappingService.compile(version.dsl_content, include_plan=False)
                    
                    # Warm-up des pipelines d'exécution
                    from app.domain.mapping.executor import run_dry_run
                    # Précompiler avec un échantillon minimal
                    sample = {"rows": [{"test": "warmup"}]}
                    run_dry_run(version.dsl_content, sample["rows"])
                    
                except Exception as e:
                    logger.warning(f"Warm-up échoué pour mapping {version.id}: {e}")
            
            logger.info("Warm-up performance terminé")
        else:
            logger.info("Aucun mapping actif à précharger")
            
    except Exception as e:
        logger.warning(f"Warm-up performance échoué : {e}")
        # Ne pas faire échouer le démarrage si le warm-up échoue

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
    "http://127.0.0.1:5173", # Alternative localhost
    "http://127.0.0.1:3000", # Alternative localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Utiliser la liste spécifique au lieu de "*"
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

@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Expose les métriques Prometheus pour la surveillance."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)





# --- Inclusion des routeurs de l'API ---
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["Datasets"])
app.include_router(files.router, prefix="/api/v1/files", tags=["Files"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(analyzers.router, prefix="/api/v1/analyzer", tags=["Analyzer"])
app.include_router(es_config_files.router, prefix="/api/v1/es_config_files", tags=["ES Config Files"])
app.include_router(mappings.router, prefix="/api/v1", tags=["Mappings"])
app.include_router(dictionaries.router, prefix="/api/v1", tags=["Dictionaries"])
app.include_router(demo.router, prefix="/api/v1/demo", tags=["Demo"])

if __name__ == "__main__":
    import os
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    print("[FastAPI] PID:", os.getpid())
