import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.domain.dataset.services.ingestion_service import (
    ingest_data_from_file_task,
    _prepare_data_for_bulk,
)
from app.domain.dataset import models, schemas



@pytest.fixture
def fake_file():
    f = MagicMock(spec=models.UploadedFile)
    f.id = uuid.uuid4()
    f.dataset_id = uuid.uuid4()
    f.filename_stored = "file.csv"
    f.ingestion_status = None
    f.docs_indexed = None
    f.ingestion_errors = None
    return f


@pytest.fixture
def fake_mapping():
    m = MagicMock(spec=models.SchemaMapping)
    m.id = uuid.uuid4()
    m.mapping_rules = [
        {"source": "col1", "target": "field1", "es_type": "keyword"},
        {"source": "col2", "target": "field2", "es_type": "integer"}
    ]
    m.index_name = "test-index"
    return m


@pytest.mark.asyncio
@patch("app.domain.dataset.services.ingestion_service.SessionLocal")
@patch("app.domain.dataset.services.ingestion_service.AsyncElasticsearch")
@patch("app.domain.dataset.services.ingestion_service.pd.read_csv")
@patch("app.domain.dataset.services.ingestion_service.async_bulk", new_callable=AsyncMock)
async def test_ingest_data_from_file_task_ok(
        mock_bulk, mock_read_csv, mock_es, mock_session, fake_file, fake_mapping, tmp_path
):
    # Prépare le context manager du DB
    fake_db = MagicMock()
    fake_db.get = AsyncMock(
        side_effect=lambda model, id: fake_file if model.__name__ == "UploadedFile" else fake_mapping)
    fake_db.commit = AsyncMock()
    mock_session.return_value.__aenter__.return_value = fake_db

    # Prépare le fichier d'upload fictif
    from app.core.config import settings
    settings.UPLOAD_DIR = tmp_path
    (tmp_path / str(fake_file.dataset_id)).mkdir(parents=True, exist_ok=True)
    file_path = tmp_path / str(fake_file.dataset_id) / fake_file.filename_stored
    file_path.write_text("col1,col2\nval1,2")  # Simule un CSV

    # Mocke pandas.read_csv pour renvoyer un dataframe simulé
    import pandas as pd
    df = pd.DataFrame({"col1": ["val1"], "col2": [2]})
    mock_read_csv.return_value = df

    # Mocke async_bulk ES pour renvoyer (success, errors)
    mock_bulk.return_value = (1, [])

    # Lance l'appel
    await ingest_data_from_file_task(fake_file.id, fake_mapping.id)

    fake_db.commit.assert_called()
    assert fake_file.ingestion_status == models.IngestionStatus.COMPLETED
    assert fake_file.docs_indexed == 1
    assert not fake_file.ingestion_errors


def test_prepare_data_for_bulk():
    import pandas as pd
    df = pd.DataFrame({"col1": ["a"], "col2": [1]})
    rules = [
        schemas.MappingRule(source="col1", target="f1", es_type="text"),
        schemas.MappingRule(source="col2", target="f2", es_type="integer"),
    ]
    result = list(_prepare_data_for_bulk(df, rules, "idx"))
    assert result[0]["_index"] == "idx"
    assert result[0]["_source"] == {"f1": "a", "f2": 1}


@pytest.mark.asyncio
@patch("app.domain.dataset.services.ingestion_service.SessionLocal")
@patch("app.domain.dataset.services.ingestion_service.AsyncElasticsearch")
@patch("app.domain.dataset.services.ingestion_service.pd.read_csv")
@patch("app.domain.dataset.services.ingestion_service.async_bulk", new_callable=AsyncMock)
async def test_ingest_data_from_file_task_fail_bulk(
        mock_bulk, mock_read_csv, mock_es, mock_session, fake_file, fake_mapping, tmp_path
):
    fake_db = MagicMock()
    fake_db.get = AsyncMock(
        side_effect=lambda model, id: fake_file if model.__name__ == "UploadedFile" else fake_mapping)
    fake_db.commit = AsyncMock()
    mock_session.return_value.__aenter__.return_value = fake_db

    from app.core.config import settings
    settings.UPLOAD_DIR = tmp_path
    (tmp_path / str(fake_file.dataset_id)).mkdir(parents=True, exist_ok=True)
    file_path = tmp_path / str(fake_file.dataset_id) / fake_file.filename_stored
    file_path.write_text("col1,col2\nval1,2")

    import pandas as pd
    df = pd.DataFrame({"col1": ["val1"], "col2": [2]})
    mock_read_csv.return_value = df

    mock_bulk.return_value = (0, ["err1", "err2"])
    await ingest_data_from_file_task(fake_file.id, fake_mapping.id)

    fake_db.commit.assert_called()
    assert fake_file.ingestion_status == models.IngestionStatus.FAILED
    assert fake_file.ingestion_errors == ["err1", "err2"]


@pytest.mark.asyncio
@patch("app.domain.dataset.services.ingestion_service.SessionLocal")
@patch("app.domain.dataset.services.ingestion_service.AsyncElasticsearch")
async def test_ingest_data_from_file_task_missing(fake_es, mock_session, fake_file, fake_mapping):
    fake_db = MagicMock()
    # Fichier manquant
    fake_db.get = AsyncMock(side_effect=lambda model, id: None)
    fake_db.commit = AsyncMock()
    mock_session.return_value.__aenter__.return_value = fake_db

    await ingest_data_from_file_task(uuid.uuid4(), uuid.uuid4())
    fake_db.commit.assert_not_called()
