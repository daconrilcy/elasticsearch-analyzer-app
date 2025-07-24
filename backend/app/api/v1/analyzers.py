# app/api/v1/analyzers.py
from fastapi import APIRouter, Depends, Body, HTTPException, status
from elasticsearch import AsyncElasticsearch, ConnectionError
from pydantic import BaseModel

from app.core.es_client import get_es_client
from app.domain.analyzer.models import AnalyzerGraph
# CORRECTION : L'import de 'convert_graph_to_es_analyzer' a été supprimé car il n'est pas utilisé ici.
from app.domain.analyzer.services import debug_analyzer_step_by_step
# Import du validateur principal
from app.domain.analyzer.validators.validator import validate_full_graph, ValidationError

router = APIRouter()


# Schéma Pydantic pour les requêtes d'analyse et de validation
class AnalyzerRequest(BaseModel):
    text: str
    graph: AnalyzerGraph


@router.post("/debug")
async def debug_analyzer_endpoint(
        request: AnalyzerRequest = Body(...),
        es_client: AsyncElasticsearch = Depends(get_es_client)
):
    """Analyse un texte pas à pas et retourne chaque étape."""
    try:
        validate_full_graph(request.graph)
        steps, path = await debug_analyzer_step_by_step(request.graph, request.text, es_client)
        return {"steps": steps, "path": path}
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Impossible de se connecter à Elasticsearch.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Une erreur interne est survenue: {e}")


@router.post("/validate", status_code=status.HTTP_200_OK)
async def validate_analyzer_endpoint(graph: AnalyzerGraph = Body(...)):
    """
    Valide la structure et la cohérence d'un graphe d'analyseur.
    Retourne un succès si valide, sinon une erreur 400 avec les détails.
    """
    try:
        validate_full_graph(graph)
        return {"detail": "Le graphe de l'analyseur est valide."}
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
