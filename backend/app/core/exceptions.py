"""
app/core/exceptions.py
Définit les exceptions personnalisées de l'application et les messages d'erreur.
"""
from fastapi import HTTPException, status
# --- 1. Centralisation des Messages d'Erreur ---
# Vous pouvez facilement modifier tous les messages de l'application ici.
ERROR_MESSAGES = {
    "UNSUPPORTED_FORMAT": "Format de fichier non supporté. Les formats acceptés sont .csv, .xlsx, .xls, .json.",
    "FILE_TOO_LARGE": "Fichier trop volumineux. La taille maximale est de 100 Mo.",
    "FILE_ALREADY_EXISTS": "Ce fichier existe déjà dans ce jeu de données.",
    "FILE_READING_ERROR": "Ce fichier ne peut etre lu",
    "SAVE_ERROR": "Erreur interne lors de la sauvegarde du fichier.",
    "SERVER_ERROR": "Une erreur de serveur inattendue est survenue.",
    "NOT_FOUND": "La ressource demandée n'a pas été trouvée.",
    "FORBIDDEN": "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
}

# --- 2. Classe de Base pour les Exceptions de l'Application ---
class AppException(Exception):
    """Classe de base pour les exceptions personnalisées de notre application."""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.detail)

# --- 3. Exceptions Spécifiques pour chaque Cas d'Erreur ---
# Chaque erreur métier a maintenant sa propre classe.
class UnsupportedFormatError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["UNSUPPORTED_FORMAT"]):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)

class FileTooLargeError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["FILE_TOO_LARGE"]):
        super().__init__(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail)

class FileAlreadyExistsError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["FILE_ALREADY_EXISTS"]):
        super().__init__(status.HTTP_409_CONFLICT, detail)

class SaveError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["SAVE_ERROR"]):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, detail)

class ResourceNotFoundError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["NOT_FOUND"]):
        super().__init__(status.HTTP_404_NOT_FOUND, detail)

class FileReadingError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["FILE_READING_ERROR"]):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail)

class ForbiddenError(AppException):
    def __init__(self, detail: str = ERROR_MESSAGES["FORBIDDEN"]):
        super().__init__(status.HTTP_403_FORBIDDEN, detail)


class FileParsingError(AppException):
    def __init__(self, detail: str = "Erreur lors du parsing du fichier."):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail)

class IngestionError(AppException):
    def __init__(self, detail: str = "Erreur lors de l'ingestion des données."):
        super().__init__(status.HTTP_500_INTERNAL_SERVER_ERROR, detail)