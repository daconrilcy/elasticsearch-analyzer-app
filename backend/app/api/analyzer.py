from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.schemas.analyzer_graph import AnalyzerGraph 
from app.services.validation import validate_graph_structure
from app.services.analyzer_service import validate_token_filter_compat

router = APIRouter()

class ConvertRequest(BaseModel):
    # À adapter selon le schéma attendu
    text: str

class AnalyzeRequest(BaseModel):
    # À adapter selon le schéma attendu
    text: str

@router.post("/convert")
def convert(req: ConvertRequest):
    # Logique de conversion fictive
    return {"converted": req.text.upper()}

@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    # Logique d'analyse fictive
    return {"analysis": f"Longueur: {len(req.text)}"} 

@router.post("/api/v1/analyzer/convert")
async def convert_analyzer(graph: AnalyzerGraph):
    try:
        validate_graph_structure(graph)
        validate_token_filter_compat(graph)
        # ... d'autres validations custom ici ...
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"validated_graph": graph.dict()}