import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, UploadFile, status

from app.domain.dataset.services.file_service import (
    get_file,
    get_file_owned_by_user,
    _generate_stored_filename,
    _infer_schema,
    upload_new_file_version,
)
from app.domain.dataset import models
from app.domain.user.models import User


@pytest.fixture
def fake_user():
    return User(id=uuid.uuid4())


@pytest.fixture
def fake_dataset(fake_user):
    return models.Dataset(id=uuid.uuid4(), owner_id=fake_user.id, name="ds", description="desc")


@pytest.fixture
def fake_file_model(fake_dataset, fake_user):
    return models.UploadedFile(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        filename_original="test.csv",
        filename_stored="stored.csv",
        version=1,
        hash="abc",
        size_bytes=123,
        uploader_id=fake_user.id,
        dataset=fake_dataset,
    )

@pytest.mark.asyncio
async def test_get_file_found(fake_file_model):
    db = AsyncMock()
    db.get.return_value = fake_file_model
    file = await get_file(db, fake_file_model.id)
    assert file is fake_file_model
    db.get.assert_called_once()

@pytest.mark.asyncio
async def test_get_file_not_found():
    db = AsyncMock()
    db.get.return_value = None
    file = await get_file(db, uuid.uuid4())
    assert file is None

@pytest.mark.asyncio
async def test_get_file_owned_by_user_success(fake_file_model, fake_user):
    db = AsyncMock()
    db.get.return_value = fake_file_model
    result = await get_file_owned_by_user(db, fake_file_model.id, fake_user)
    assert result == fake_file_model

@pytest.mark.asyncio
async def test_get_file_owned_by_user_not_found(fake_user):
    db = AsyncMock()
    db.get.return_value = None
    with pytest.raises(HTTPException) as e:
        await get_file_owned_by_user(db, uuid.uuid4(), fake_user)
    assert e.value.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
async def test_get_file_owned_by_user_forbidden(fake_file_model):
    db = AsyncMock()
    db.get.return_value = fake_file_model
    other_user = User(id=uuid.uuid4())
    with pytest.raises(HTTPException) as e:
        await get_file_owned_by_user(db, fake_file_model.id, other_user)
    assert e.value.status_code == status.HTTP_403_FORBIDDEN


def test_generate_stored_filename():
    ds_id = uuid.uuid4()
    fn = _generate_stored_filename(ds_id, 2, "foo.csv")
    assert fn.startswith(str(ds_id))
    assert fn.endswith(".csv")
    assert "v2" in fn


def test_infer_schema():
    import pandas as pd
    df = pd.DataFrame({"a": [1, 2], "b": [1.2, 3.4], "c": ["foo", "bar"]})
    schema = _infer_schema(df)
    assert {"field": "a", "type": "integer"} in schema
    assert {"field": "b", "type": "float"} in schema
    assert {"field": "c", "type": "string"} in schema


@pytest.mark.asyncio
@patch("app.domain.dataset.services.file_service._calculate_file_hash", new_callable=AsyncMock)
@patch("app.domain.dataset.services.file_service._is_duplicate", new_callable=AsyncMock)
@patch("app.domain.dataset.services.file_service._get_next_version", new_callable=AsyncMock)
@patch("app.domain.dataset.services.file_service.pd.read_csv", new_callable=MagicMock)
async def test_upload_new_file_version_ok(
        mock_read_csv, mock_next_ver, mock_dup, mock_hash,
        fake_dataset, fake_user, tmp_path
):
    from app.core.config import settings
    from app.domain.dataset.schemas import FileStructureField

    settings.UPLOAD_DIR = tmp_path
    mock_hash.return_value = "myhash"
    mock_dup.return_value = False
    mock_next_ver.return_value = 1

    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    # Fake file object
    fake_upload = AsyncMock(spec=UploadFile)
    fake_upload.filename = "test.csv"
    fake_upload.read.return_value = b"data"
    fake_upload.seek = AsyncMock()

    mock_file_model = models.UploadedFile(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        filename_original="test.csv",
        filename_stored="filename.csv",
        version=1,
        hash="myhash",
        size_bytes=123,
        uploader_id=fake_user.id,
        dataset=fake_dataset,
    )

    # Prépare un context manager asynchrone pour aiofiles.open
    async_cm = MagicMock()
    async_cm.__aenter__.return_value = AsyncMock()
    async_cm.__aexit__.return_value = AsyncMock()

    # Mocke aussi path.stat() pour éviter FileNotFoundError
    with patch("app.domain.dataset.services.file_service.aiofiles.open", return_value=async_cm), \
            patch("pathlib.Path.stat") as mock_stat:
        mock_stat.return_value.st_size = 123  # Simule la taille du fichier
        mock_read_csv.return_value = MagicMock(
            dtypes={"a": "int64", "b": "float64", "c": "object"},
            columns=["a", "b", "c"]
        )
        res_file, res_schema = await upload_new_file_version(
            db, fake_dataset, fake_upload, fake_user
        )

        assert isinstance(res_file, models.UploadedFile)
        assert isinstance(res_schema, list)
        db.add.assert_called_once()
        db.commit.assert_called_once()
        db.refresh.assert_called_once()
