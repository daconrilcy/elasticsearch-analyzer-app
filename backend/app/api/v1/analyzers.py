import json
from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from backend.app.domain.analyzer.models import AnalyzerGraph
from backend.app.domain.analyzer.services import convert_graph_to_es_analyzer, debug_analyzer_step_by_step
from backend.app.domain.analyzer.validators.validator import validate_full_graph
from elasticsearch import AsyncElasticsearch, ConnectionError
from backend.app.core.es_client import get_es_client
from backend.app.core.config import settings

router = APIRouter()


class AnalyzeRequest(BaseModel):
    text: str
    graph: AnalyzerGraph


@router.post("/test")
async def test_analyzer(
        request: AnalyzeRequest = Body(...),
        es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    Analyse un texte et retourne uniquement le résultat final.
    """
    if not es_client:
        raise HTTPException(status_code=503, detail="La connexion à Elasticsearch n'est pas configurée ou a échoué.")

    try:
        validate_full_graph(request.graph)
        analyzer_definition = convert_graph_to_es_analyzer(request.graph)

        # --- Log utile pour debug ---
        print("--- Définition de l'analyseur envoyée à Elasticsearch (/test) ---")
        print(json.dumps(analyzer_definition, indent=2, ensure_ascii=False))
        print("-----------------------------------------------------------------")

        response = await es_client.indices.analyze(body={"text": request.text, **analyzer_definition})
        return {"tokens": response.get("tokens", [])}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=503,
                            detail=f"Impossible de se connecter à Elasticsearch sur {settings.ES_HOST}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur interne est survenue: {e}")


@router.post("/debug")
async def debug_analyzer(
        request: AnalyzeRequest = Body(...),
        es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """
    Analyse un texte pas à pas (débogage complet).
    """
    if not es_client:
        raise HTTPException(status_code=503, detail="La connexion à Elasticsearch n'est pas configurée ou a échoué.")
    try:
        validate_full_graph(request.graph)
        steps, path = await debug_analyzer_step_by_step(request.graph, request.text, es_client)
        return {"steps": steps, "path": path}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=503,
                            detail=f"Impossible de se connecter à Elasticsearch sur {settings.ES_HOST}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur interne est survenue: {e}")
