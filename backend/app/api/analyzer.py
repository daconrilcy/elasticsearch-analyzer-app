import os
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.schemas.analyzer_graph import AnalyzerGraph 
from app.services.graph_converter import convert_graph_to_es_analyzer
from app.services.debug_analyzer_service import debug_analyzer_step_by_step
from elasticsearch import AsyncElasticsearch, ConnectionError

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    graph: AnalyzerGraph

# --- Configuration de la connexion ---
ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
ES_API_KEY = os.getenv("ES_API_KEY")
ES_USERNAME = os.getenv("ES_USERNAME")
ES_PASSWORD = os.getenv("ES_PASSWORD")

connection_params = {}
if ES_API_KEY:
    connection_params["api_key"] = ES_API_KEY
elif ES_USERNAME and ES_PASSWORD:
    connection_params["basic_auth"] = (ES_USERNAME, ES_PASSWORD)

es_client = AsyncElasticsearch(ES_HOST, **connection_params)


@router.post("/test")
async def test_analyzer(request: AnalyzeRequest = Body(...)):
    """
    Analyse un texte et retourne uniquement le résultat final.
    (Gardé pour des tests simples si nécessaire).
    """
    try:
        analyzer_definition = convert_graph_to_es_analyzer(request.graph)
        response = await es_client.indices.analyze(body={"text": request.text, **analyzer_definition})
        return {"tokens": response.get("tokens", [])}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=503, detail=f"Impossible de se connecter à Elasticsearch sur {ES_HOST}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur interne est survenue: {e}")

# ROUTE DE DÉBOGAGE
@router.post("/debug")
async def debug_analyzer(request: AnalyzeRequest = Body(...)):
    """
    Analyse un texte pas à pas et retourne les résultats intermédiaires
    ainsi que le chemin de graphe valide.
    """
    try:
        steps, path = await debug_analyzer_step_by_step(request.graph, request.text, es_client)
        return {"steps": steps, "path": path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=503, detail=f"Impossible de se connecter à Elasticsearch sur {ES_HOST}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur interne est survenue: {e}")


@router.on_event("shutdown")
async def shutdown_event():
    await es_client.close()
