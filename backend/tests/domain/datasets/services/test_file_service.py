import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, UploadFile, status

from app.domain.file.services import FileService, TaskService
from app.domain.file import models
from app.domain.dataset import models as dataset_models
from app.domain.user.models import User

@pytest.fixture
def fake_user():
    return User(id=uuid.uuid4())

@pytest.fixture
def fake_dataset(fake_user):
    return dataset_models.Dataset(id=uuid.uuid4(), owner_id=fake_user.id, name="ds", description="desc")

@pytest.fixture
def fake_file_model(fake_dataset, fake_user):
    return models.File(
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

@pytest.fixture
def file_service():
    return FileService()

@pytest.fixture
def task_service():
    return TaskService()

@pytest.mark.asyncio
async def test_get_file_owned_by_user_success(fake_file_model, fake_user, file_service):
    db = AsyncMock()
    db.get.return_value = fake_file_model
    db.refresh = AsyncMock()
    result = await file_service.get_owned_by_user(db, fake_file_model.id, fake_user)
    assert result == fake_file_model

@pytest.mark.asyncio
async def test_get_file_owned_by_user_not_found(fake_user, file_service):
    db = AsyncMock()
    db.get.return_value = None
    with pytest.raises(Exception):  # ResourceNotFoundError
        await file_service.get_owned_by_user(db, uuid.uuid4(), fake_user)

@pytest.mark.asyncio
async def test_get_file_owned_by_user_forbidden(fake_file_model, file_service):
    db = AsyncMock()
    db.get.return_value = fake_file_model
    db.refresh = AsyncMock()
    other_user = User(id=uuid.uuid4())
    with pytest.raises(Exception):  # ForbiddenError
        await file_service.get_owned_by_user(db, fake_file_model.id, other_user)

@pytest.mark.asyncio
async def test_upload_new_file_version_ok(fake_dataset, fake_user, tmp_path, file_service):
    # Mock file
    mock_file = MagicMock()
    mock_file.filename = "test.csv"
    mock_file.read = AsyncMock(return_value=b"test content")

    # Mock database
    db = AsyncMock()
    db.add = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    # Execute
    result = await file_service.upload(db, fake_dataset, mock_file, fake_user)

    # Assertions
    assert result is not None
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()

def test_infer_schema_from_dataframe(task_service):
    import pandas as pd
    df = pd.DataFrame({"a": [1, 2], "b": [1.2, 3.4], "c": ["foo", "bar"]})
    schema = task_service._infer_schema_from_dataframe(df)
    assert schema["a"] == "integer"
    assert schema["b"] == "float"
    assert schema["c"] == "string"

def test_create_data_preview(task_service):
    import pandas as pd
    df = pd.DataFrame({"a": [1, 2, 3], "b": ["foo", "bar", "baz"]})
    preview = task_service._create_data_preview(df, 2)
    assert len(preview) == 2
    assert preview[0]["a"] == 1
    assert preview[0]["b"] == "foo"
