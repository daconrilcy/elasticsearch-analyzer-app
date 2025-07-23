# main.py
from fastapi import FastAPI, Depends
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession

# 1. Imports mis à jour
from app.api.v1 import analyzers, projects, es_config_files, auth
from app.core.db import engine, Base, get_db
from app.core.logging_config import setup_logging  # <-- Importer la configuration du logging
from loguru import logger  # <-- Importer logger pour l'utiliser


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 2. Configurer le logging au démarrage de l'application
    setup_logging()
    logger.info("Démarrage de l'application...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables de la base de données vérifiées/créées.")
    yield
    logger.info("Arrêt de l'application...")


app = FastAPI(
    title="Elasticsearch Analyzer API",
    lifespan=lifespan
)


# ... (votre configuration CORS reste ici) ...

# 3. Nouveaux endpoints pour les Health Checks
@app.get("/health", tags=["Health Checks"])
async def health_check():
    """
    Vérifie si l'application est en cours d'exécution (liveness probe).
    """
    logger.info("Health check demandé.")
    return {"status": "ok"}


@app.get("/ready", tags=["Health Checks"])
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Vérifie si l'application est prête à accepter du trafic (readiness probe),
    en testant la connexion à la base de données.
    """
    try:
        await db.execute("SELECT 1")
        logger.info("Readiness check réussi.")
        return {"status": "ready", "dependencies": {"database": "ok"}}
    except Exception as e:
        logger.error(f"Readiness check échoué : impossible de se connecter à la base de données. Erreur: {e}")
        return {"status": "not_ready", "dependencies": {"database": "error"}}


# Inclusion des routeurs (inchangé)
app.include_router(analyzers.router, prefix="/api/v1/analyzer", tags=["Analyzer"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(es_config_files.router, prefix="/api/v1/es_config_files", tags=["ES Config Files"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
