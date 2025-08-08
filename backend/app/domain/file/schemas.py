""" app/domain/file/schemas.py """
import uuid
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

from .models import FileStatus, IngestionStatus


class FileOut(BaseModel):
    """
    Schéma de sortie unifié et détaillé pour un fichier.
    Utilisé à la fois pour les listes et les vues de détail.
    """
    id: uuid.UUID = Field(description="Identifiant unique du fichier.")
    filename_original: str = Field(description="Nom original du fichier uploadé.")
    
    # Informations sur le statut
    status: FileStatus = Field(description="Statut actuel du fichier (parsing, prêt, erreur).")
    parsing_error: Optional[str] = Field(None, description="Message d'erreur si le parsing a échoué.")
    
    # Métadonnées et statistiques
    version: int = Field(description="Version du fichier au sein du dataset.")
    size_bytes: int = Field(description="Taille du fichier en octets.")
    hash: str = Field(description="Hash SHA-256 du contenu du fichier.")
    line_count: Optional[int] = Field(None, description="Nombre de lignes détectées après parsing.")
    column_count: Optional[int] = Field(None, description="Nombre de colonnes détectées après parsing.")
    
    # Informations de l'utilisateur et de date
    uploader_id: uuid.UUID = Field(description="ID de l'utilisateur qui a uploadé le fichier.")
    uploader_name: Optional[str] = Field(None, description="Nom de l'utilisateur qui a uploadé le fichier.")
    created_at: datetime = Field(description="Date et heure de l'upload.")
    updated_at: Optional[datetime] = Field(description="Date et heure de la dernière modification.")
    
    # Informations d'ingestion et de mapping
    ingestion_status: IngestionStatus = Field(description="Statut du processus d'ingestion dans Elasticsearch.")
    docs_indexed: Optional[int] = Field(None, description="Nombre de documents indexés avec succès.")
    ingestion_errors: Optional[List[str]] = Field(None, description="Liste des erreurs survenues lors de l'ingestion.")
    mapping_id: Optional[uuid.UUID] = Field(None, description="ID du mapping associé à ce fichier, s'il existe.")

    # Données d'aperçu
    inferred_schema: Optional[Dict[str, Any]] = Field(None, description="Schéma de données inféré lors du parsing.")
    preview_data: Optional[List[Dict[str, Any]]] = Field(None, description="Un échantillon des premières lignes de données.")

    model_config = ConfigDict(from_attributes=True)
