import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.domain.file.services import TaskService
from app.domain.file import models as file_models
from app.domain.mapping import models as mapping_models, schemas as mapping_schemas



@pytest.fixture
def fake_file():
    f = MagicMock(spec=file_models.File)
    f.id = uuid.uuid4()
    f.dataset_id = uuid.uuid4()
    f.filename_stored = "file.csv"
    f.ingestion_status = None
    f.docs_indexed = None
    f.ingestion_errors = None
    return f


@pytest.fixture
def fake_mapping():
    m = MagicMock(spec=mapping_models.Mapping)
    m.id = uuid.uuid4()
    m.mapping_rules = [
        {"source": "col1", "target": "field1", "es_type": "keyword"},
        {"source": "col2", "target": "field2", "es_type": "integer"}
    ]
    m.index_name = "test-index"
    return m

@pytest.fixture
def task_service():
    return TaskService()

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.AsyncElasticsearch")
@patch("app.domain.file.services.pd.read_csv")
@patch("app.domain.file.services.async_bulk", new_callable=AsyncMock)
async def test_ingest_data_from_file_task_ok(
        mock_bulk, mock_read_csv, mock_es, mock_session, fake_file, fake_mapping, tmp_path, task_service
):
    # Prépare le context manager du DB
    fake_db = MagicMock()
    fake_db.get = AsyncMock(
        side_effect=lambda model, id: fake_file if model.__name__ == "File" else fake_mapping)
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
    await task_service.ingest_data(fake_file.id, fake_mapping.id)

    fake_db.commit.assert_called()
    assert fake_file.ingestion_status == file_models.IngestionStatus.COMPLETED
    assert fake_file.docs_indexed == 1
    assert not fake_file.ingestion_errors


def test_prepare_data_for_bulk(task_service):
    import pandas as pd
    df = pd.DataFrame({"col1": ["a"], "col2": [1]})
    rules = [
        mapping_schemas.MappingRule(source="col1", target="f1", es_type="text"),
        mapping_schemas.MappingRule(source="col2", target="f2", es_type="integer"),
    ]
    result = list(task_service._prepare_data_for_bulk(df, rules, "idx"))
    assert result[0]["_index"] == "idx"
    assert result[0]["_source"] == {"f1": "a", "f2": 1}


@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.AsyncElasticsearch")
@patch("app.domain.file.services.pd.read_csv")
@patch("app.domain.file.services.async_bulk", new_callable=AsyncMock)
async def test_ingest_data_from_file_task_fail_bulk(
        mock_bulk, mock_read_csv, mock_es, mock_session, fake_file, fake_mapping, tmp_path, task_service
):
    fake_db = MagicMock()
    fake_db.get = AsyncMock(
        side_effect=lambda model, id: fake_file if model.__name__ == "File" else fake_mapping)
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

    # Simule une erreur de bulk
    mock_bulk.return_value = (0, ["error1", "error2"])

    await task_service.ingest_data(fake_file.id, fake_mapping.id)

    assert fake_file.ingestion_status == file_models.IngestionStatus.FAILED
    assert fake_file.ingestion_errors == ["error1", "error2"]


@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.AsyncElasticsearch")
async def test_ingest_data_from_file_task_missing(fake_es, mock_session, fake_file, fake_mapping, task_service):
    fake_db = MagicMock()
    fake_db.get = AsyncMock(return_value=None)
    mock_session.return_value.__aenter__.return_value = fake_db

    with pytest.raises(Exception):  # ResourceNotFoundError
        await task_service.ingest_data(fake_file.id, fake_mapping.id)
