import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.domain.file.services import TaskService
from app.domain.file import models

@pytest.fixture
def fake_file_model(tmp_path):
    ds_id = uuid.uuid4()
    file_id = uuid.uuid4()
    dataset_path = tmp_path / str(ds_id)
    dataset_path.mkdir()
    return models.File(
        id=file_id,
        dataset_id=ds_id,
        filename_original="foo.csv",
        filename_stored="foo.csv",
        version=1,
        hash="abc",
        size_bytes=123,
        uploader_id=uuid.uuid4(),
        status=models.FileStatus.PENDING,
        inferred_schema=None,
    )

@pytest.fixture
def task_service():
    return TaskService()

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.settings")
@patch("app.domain.file.services.pd.read_csv")
@patch("app.domain.file.services.open", create=True)
async def test_parse_csv_and_update_db(mock_open, mock_read_csv, mock_settings, mock_sessionmaker, fake_file_model, tmp_path, task_service):
    mock_settings.UPLOAD_DIR = tmp_path

    mock_df = MagicMock()
    mock_df.dtypes.items.return_value = [("a", "int64"), ("b", "float64"), ("c", "object")]
    mock_read_csv.return_value = mock_df

    mock_db = AsyncMock()
    mock_db.get.return_value = fake_file_model
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    # Mock le fichier physique
    mock_file = MagicMock()
    mock_file.read.return_value = "a,b,c\n1,2.0,test"
    mock_file.seek = MagicMock()
    mock_open.return_value.__enter__.return_value = mock_file

    await task_service.parse_file(fake_file_model.id)

    assert fake_file_model.status == models.FileStatus.READY
    assert fake_file_model.inferred_schema == {"a": "integer", "b": "float", "c": "string"}
    assert mock_db.commit.await_count == 2  # commit initial, commit final

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.settings")
@patch("app.domain.file.services.pd.read_excel")
async def test_parse_xlsx_and_update_db(mock_read_excel, mock_settings, mock_sessionmaker, fake_file_model, tmp_path, task_service):
    fake_file_model.filename_stored = "foo.xlsx"
    mock_settings.UPLOAD_DIR = tmp_path

    mock_df = MagicMock()
    mock_df.dtypes.items.return_value = [("d", "float64")]
    mock_read_excel.return_value = mock_df

    mock_db = AsyncMock()
    mock_db.get.return_value = fake_file_model
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    await task_service.parse_file(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.READY
    assert fake_file_model.inferred_schema == {"d": "float"}

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.settings")
@patch("app.domain.file.services.pd.read_json")
async def test_parse_json_and_update_db(mock_read_json, mock_settings, mock_sessionmaker, fake_file_model, tmp_path, task_service):
    fake_file_model.filename_stored = "foo.json"
    mock_settings.UPLOAD_DIR = tmp_path

    mock_df = MagicMock()
    mock_df.dtypes.items.return_value = [("z", "int64")]
    mock_read_json.return_value = mock_df

    mock_db = AsyncMock()
    mock_db.get.return_value = fake_file_model
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    await task_service.parse_file(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.READY
    assert fake_file_model.inferred_schema == {"z": "integer"}

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
@patch("app.domain.file.services.settings")
async def test_parse_file_format_not_supported(mock_settings, mock_sessionmaker, fake_file_model, tmp_path, task_service):
    fake_file_model.filename_stored = "foo.txt"
    mock_settings.UPLOAD_DIR = tmp_path

    mock_db = AsyncMock()
    mock_db.get.return_value = fake_file_model
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    await task_service.parse_file(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.ERROR
    assert "Format de fichier non supporté" in fake_file_model.parsing_error

@pytest.mark.asyncio
@patch("app.domain.file.services.async_session_maker")
async def test_parse_file_not_found(mock_sessionmaker, task_service):
    mock_db = AsyncMock()
    mock_db.get.return_value = None
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    with pytest.raises(Exception):  # ResourceNotFoundError
        await task_service.parse_file(uuid.uuid4())
