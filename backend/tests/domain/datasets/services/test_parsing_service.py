import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.domain.dataset.services.parsing_service import parse_file_and_update_db
from app.domain.dataset import models


@pytest.fixture
def fake_file_model(tmp_path):
    ds_id = uuid.uuid4()
    file_id = uuid.uuid4()
    dataset_path = tmp_path / str(ds_id)
    dataset_path.mkdir()
    return models.UploadedFile(
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


@pytest.mark.asyncio
@patch("app.domain.dataset.services.parsing_service.async_session_maker")
@patch("app.domain.dataset.services.parsing_service.settings")
@patch("app.domain.dataset.services.parsing_service.pd.read_csv")
async def test_parse_csv_and_update_db(mock_read_csv, mock_settings, mock_sessionmaker, fake_file_model, tmp_path):
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

    await parse_file_and_update_db(fake_file_model.id)

    assert fake_file_model.status == models.FileStatus.PARSED
    assert fake_file_model.inferred_schema == {"a": "integer", "b": "float", "c": "string"}
    assert mock_db.commit.await_count == 2  # commit initial, commit final


@pytest.mark.asyncio
@patch("app.domain.dataset.services.parsing_service.async_session_maker")
@patch("app.domain.dataset.services.parsing_service.settings")
@patch("app.domain.dataset.services.parsing_service.pd.read_excel")
async def test_parse_xlsx_and_update_db(mock_read_excel, mock_settings, mock_sessionmaker, fake_file_model, tmp_path):
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

    await parse_file_and_update_db(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.PARSED
    assert fake_file_model.inferred_schema == {"d": "float"}


@pytest.mark.asyncio
@patch("app.domain.dataset.services.parsing_service.async_session_maker")
@patch("app.domain.dataset.services.parsing_service.settings")
@patch("app.domain.dataset.services.parsing_service.pd.read_json")
async def test_parse_json_and_update_db(mock_read_json, mock_settings, mock_sessionmaker, fake_file_model, tmp_path):
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

    await parse_file_and_update_db(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.PARSED
    assert fake_file_model.inferred_schema == {"z": "integer"}


@pytest.mark.asyncio
@patch("app.domain.dataset.services.parsing_service.async_session_maker")
@patch("app.domain.dataset.services.parsing_service.settings")
async def test_parse_file_format_not_supported(mock_settings, mock_sessionmaker, fake_file_model, tmp_path):
    fake_file_model.filename_stored = "foo.unsupported"
    mock_settings.UPLOAD_DIR = tmp_path

    mock_db = AsyncMock()
    mock_db.get.return_value = fake_file_model
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    await parse_file_and_update_db(fake_file_model.id)
    assert fake_file_model.status == models.FileStatus.ERROR


@pytest.mark.asyncio
@patch("app.domain.dataset.services.parsing_service.async_session_maker")
async def test_parse_file_not_found(mock_sessionmaker):
    mock_db = AsyncMock()
    mock_db.get.return_value = None
    cm = MagicMock()
    cm.__aenter__.return_value = mock_db
    cm.__aexit__.return_value = AsyncMock()
    mock_sessionmaker.return_value = cm

    await parse_file_and_update_db(uuid.uuid4())
    mock_db.commit.assert_not_awaited()
