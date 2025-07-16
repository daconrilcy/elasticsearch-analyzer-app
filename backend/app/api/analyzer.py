import os
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.schemas.analyzer_graph import AnalyzerGraph 
from app.services.graph_converter import convert_graph_to_es_analyzer
from elasticsearch import AsyncElasticsearch, ConnectionError
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class AnalyzeRequest(BaseModel):
    text: str
    graph: AnalyzerGraph

# --- CONFIGURATION DE LA CONNEXION ---
# On lit la configuration depuis les variables d'environnement.
# Cela permet de changer facilement entre le local et le VPS.
ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
ES_USERNAME = os.getenv("ES_USERNAME") # Pour une connexion par login/mdp
ES_PASSWORD = os.getenv("ES_PASSWORD")

connection_params = {}
if ES_USERNAME and ES_PASSWORD:
    connection_params["basic_auth"] = (ES_USERNAME, ES_PASSWORD)
else:
    raise HTTPException(status_code=401, detail="No credentials provided")

# On initialise le client Elasticsearch avec les bons paramètres
es_client = AsyncElasticsearch(ES_HOST, **connection_params)


@router.post("/test")
async def test_analyzer(request: AnalyzeRequest = Body(...)):
    """
    Reçoit un texte et un graphe, le convertit en analyseur ES,
    et retourne les tokens résultants.
    """
    try:
        analyzer_definition = convert_graph_to_es_analyzer(request.graph)
        
        response = await es_client.indices.analyze(
            body={
                "text": request.text,
                **analyzer_definition
            }
        )
        
        return {"tokens": response.get("tokens", [])}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError:
        raise HTTPException(status_code=503, detail=f"Impossible de se connecter à Elasticsearch sur {ES_HOST}.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur interne est survenue: {e}")

@router.on_event("shutdown")
async def shutdown_event():
    await es_client.close()
