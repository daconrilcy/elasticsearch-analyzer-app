import os
import json # <--- 1. Importez le module json
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.schemas.analyzer_graph import AnalyzerGraph 
from app.services.graph_converter import convert_graph_to_es_analyzer
from app.services.debug_analyzer_service import debug_analyzer_step_by_step
from app.services.validation import validate_full_graph
from elasticsearch import AsyncElasticsearch, ConnectionError

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    graph: AnalyzerGraph

# --- ▼▼▼ BLOC DE CONNEXION CORRIGÉ ▼▼▼ ---

# 1. Récupérer les variables d'environnement
ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
ES_API_KEY = os.getenv("ES_API_KEY")
ES_USERNAME = os.getenv("ES_USERNAME")
ES_PASSWORD = os.getenv("ES_PASSWORD")

# 2. Construire le dictionnaire de connexion
connection_args = {}

# Ajoutez l'hôte (la librairie attend une liste)
connection_args['hosts'] = [ES_HOST]

# Ajoutez les informations d'authentification si elles existent
if ES_API_KEY:
    connection_args["api_key"] = ES_API_KEY
elif ES_USERNAME and ES_PASSWORD:
    connection_args["basic_auth"] = (ES_USERNAME, ES_PASSWORD)

# 3. Créer le client en dépaquetant les arguments

# On initialise la variable à None pour commencer
es_client: AsyncElasticsearch | None = None

try:
    es_client = AsyncElasticsearch(**connection_args)
except TypeError as e:
    print(f"Erreur lors de l'initialisation du client Elasticsearch: {e}")
    # On ne peut pas utiliser es_client = None ici car cela ne fonctionne pas avec les types
    # On peut soit lever une exception, soit utiliser un client factice
    raise HTTPException(status_code=500, detail=f"Erreur lors de l'initialisation du client Elasticsearch: {e}")

@router.post("/test")
async def test_analyzer(request: AnalyzeRequest = Body(...)):
    """
    Analyse un texte et retourne uniquement le résultat final.
    """
    if not es_client:
        raise HTTPException(status_code=503, detail="La connexion à Elasticsearch n'est pas configurée ou a échoué.")
    try:
        validate_full_graph(request.graph)
        analyzer_definition = convert_graph_to_es_analyzer(request.graph)

        # --- 2. Ajout du log ---
        print("--- Définition de l'analyseur envoyée à Elasticsearch (/test) ---")
        print(json.dumps(analyzer_definition, indent=2, ensure_ascii=False))
        print("-----------------------------------------------------------------")
        
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
    Analyse un texte pas à pas. Le log n'est pas nécessaire ici car le débogage se fait
    dans le service, mais on pourrait en ajouter un si besoin.
    """
    if not es_client:
        raise HTTPException(status_code=503, detail="La connexion à Elasticsearch n'est pas configurée ou a échoué.")
    try:
        validate_full_graph(request.graph)
        
        # Note : le service debug_analyzer_step_by_step fait plusieurs appels.
        # Pour un log détaillé, il faudrait le placer à l'intérieur de ce service.
        # Pour l'instant, nous nous concentrons sur la validation qui est la source d'erreur la plus probable.

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
      if es_client:
        await es_client.close()