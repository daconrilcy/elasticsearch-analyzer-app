""" app/api/v1/es_config_files.py """
import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List

router = APIRouter()

# Ce chemin pointe vers un dossier local de votre projet backend.
# En développement, ce même dossier doit être monté en tant que volume
# dans le conteneur Elasticsearch via docker-compose.yml.
ANALYSIS_FILES_PATH = Path(__file__).resolve().parent.parent / "es_analysis_files"


@router.get("/analysis", response_model=List[str])
async def list_analysis_files():
    """
    Retourne la liste des fichiers de configuration disponibles pour les analyseurs.
    Ces fichiers sont lus depuis le dossier local partagé.
    """
    # S'assure que le dossier existe pour éviter les erreurs au premier lancement.
    ANALYSIS_FILES_PATH.mkdir(parents=True, exist_ok=True)
    try:
        files = [f.name for f in ANALYSIS_FILES_PATH.iterdir() if f.is_file()]
        return sorted(files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la lecture des fichiers : {e}")


@router.post("/upload", response_model=dict)
async def upload_analysis_file(file: UploadFile = File(...)):
    """
    Téléverse un fichier de configuration depuis le frontend et le sauvegarde
    dans le dossier local partagé.
    """
    ANALYSIS_FILES_PATH.mkdir(parents=True, exist_ok=True)

    # Sécurité : Nettoie le nom du fichier pour éviter les traversées de répertoire (../)
    safe_filename = Path(file.filename).name
    destination_path = ANALYSIS_FILES_PATH / safe_filename

    if not safe_filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")

    try:
        with destination_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impossible de sauvegarder le fichier : {e}")
    finally:
        file.file.close()

    return {"filename": safe_filename, "message": "Fichier téléversé avec succès"}
