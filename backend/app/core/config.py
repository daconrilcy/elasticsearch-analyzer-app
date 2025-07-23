# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """
    Charge et valide les variables d'environnement.
    Utilise un fichier .env pour le développement local.
    """
    # Base de données
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/analyzer"

    # Elasticsearch
    ES_HOST: str = "http://localhost:9200"
    ES_USERNAME: Optional[str] = None
    ES_PASSWORD: Optional[str] = None
    ES_API_KEY: Optional[str] = None

    # Sécurité JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Paramètres de l'application
    APP_NAME: str = "Elasticsearch Analyzer Backend"
    API_V1_STR: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

@lru_cache()
def get_settings() -> Settings:
    """Retourne l'instance des paramètres, mise en cache."""
    return Settings()

settings = get_settings()