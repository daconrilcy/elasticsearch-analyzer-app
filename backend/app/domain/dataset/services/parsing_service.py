import uuid
import pandas as pd
from loguru import logger
from app.core.config import settings
from app.core.db import async_session_maker

from app.domain.dataset import models


async def parse_file_and_update_db(file_id: uuid.UUID):
    """Parse un fichier uploadé et met à jour son schéma et statut en base."""
    async with async_session_maker() as db:
        uploaded_file = await db.get(models.UploadedFile, file_id)
        if not uploaded_file:
            logger.error(f"[ParsingTask] Fichier {file_id} introuvable.")
            return

        uploaded_file.status = models.FileStatus.PARSING
        await db.commit()

        try:
            path = settings.UPLOAD_DIR / str(uploaded_file.dataset_id) / uploaded_file.filename_stored
            if path.suffix == '.csv':
                df = pd.read_csv(path)
            elif path.suffix in ['.xlsx', '.xls']:
                df = pd.read_excel(path)
            elif path.suffix == '.json':
                df = pd.read_json(path, lines=True)
            else:
                raise ValueError("Format de fichier non supporté pour le parsing.")

            schema = {}
            for col, dtype in df.dtypes.items():
                if "int" in str(dtype):
                    schema[col] = "integer"
                elif "float" in str(dtype):
                    schema[col] = "float"
                elif "datetime" in str(dtype):
                    schema[col] = "datetime"
                else:
                    schema[col] = "string"

            uploaded_file.inferred_schema = schema
            uploaded_file.status = models.FileStatus.PARSED
        except Exception as e:
            logger.error(f"[ParsingTask] Échec parsing fichier {file_id}: {e}")
            uploaded_file.status = models.FileStatus.ERROR
        finally:
            await db.commit()
