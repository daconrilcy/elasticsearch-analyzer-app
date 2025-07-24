# app/core/es_client.py
from elasticsearch import AsyncElasticsearch
from fastapi import Depends, HTTPException, status
from app.core.config import get_settings, Settings


async def get_es_client(settings: Settings = Depends(get_settings)) -> AsyncElasticsearch:
    """
    Dépendance FastAPI pour fournir un client AsyncElasticsearch.
    Gère la connexion et la fermeture propre.
    """
    connection_args = {'hosts': [settings.ES_HOST]}
    if settings.ES_API_KEY:
        connection_args["api_key"] = settings.ES_API_KEY
    elif settings.ES_USERNAME and settings.ES_PASSWORD:
        connection_args["basic_auth"] = (settings.ES_USERNAME, settings.ES_PASSWORD)

    es_client = None
    try:
        es_client = AsyncElasticsearch(**connection_args)
        yield es_client
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Impossible de se connecter à Elasticsearch: {e}"
        )
    finally:
        if es_client:
            await es_client.close()


if __name__ == "__main__":
    import asyncio

    settings = get_settings()
    es_client = AsyncElasticsearch(hosts=[settings.ES_HOST])


    async def main():
        info = await es_client.info()
        print(info)
        await es_client.close()  # ferme proprement


    asyncio.run(main())
