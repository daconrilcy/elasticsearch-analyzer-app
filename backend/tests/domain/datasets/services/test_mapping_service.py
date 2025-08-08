import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status

from app.domain.mapping.services import MappingService
from app.domain.mapping import models, schemas
from app.domain.dataset import models as dataset_models
from app.domain.file import models as file_models

pytestmark = pytest.mark.asyncio

@pytest.fixture
def fake_user():
    from app.domain.user.models import User
    return User(id=uuid.uuid4())

@pytest.fixture
def fake_dataset(fake_user):
    return dataset_models.Dataset(
        id=uuid.uuid4(),
        owner_id=fake_user.id,
        name="MyData",
        description="desc"
    )

@pytest.fixture
def fake_file_model(fake_dataset, fake_user):
    return file_models.File(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        filename_original="foo.csv",
        filename_stored="bar.csv",
        version=1,
        hash="abc",
        size_bytes=123,
        uploader_id=fake_user.id,
        dataset=fake_dataset,
        status=file_models.FileStatus.READY,
        inferred_schema={"col1": "string", "col2": "integer"}
    )

@pytest.fixture
def mapping_rule():
    return schemas.MappingRule(
        source="col1",
        target="dest_col1",
        es_type="text",
        analyzer_project_id=None,
    )

@pytest.fixture
def fake_mapping_create(fake_file_model, mapping_rule):
    return schemas.MappingCreate(
        name="map1",
        source_file_id=fake_file_model.id,
        mapping_rules=[mapping_rule],
    )

@pytest.fixture
def fake_mapping_model(fake_dataset, fake_file_model, mapping_rule):
    return models.Mapping(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        name="map1",
        source_file_id=fake_file_model.id,
        mapping_rules=[mapping_rule.model_dump()],
        index_name=None,
    )

@pytest.fixture
def mapping_service():
    return MappingService()

async def test_create_mapping_ok(fake_dataset, fake_file_model, fake_mapping_create, mapping_rule, mapping_service):
    db = AsyncMock()
    db.get = AsyncMock(side_effect=[fake_file_model])
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    mapping = await mapping_service.create(db, fake_mapping_create, fake_dataset.id)
    db.get.assert_awaited()
    db.add.assert_called_once()
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once()
    assert mapping.dataset_id == fake_dataset.id
    assert mapping.name == "map1"

@pytest.mark.parametrize("file_status,inferred,exc_status", [
    (file_models.FileStatus.PENDING, None, status.HTTP_409_CONFLICT),  # Not parsed
    (file_models.FileStatus.READY, None, status.HTTP_409_CONFLICT),  # No inferred schema
    (file_models.FileStatus.READY, {"colX": "string"}, status.HTTP_400_BAD_REQUEST),  # Bad column
])
async def test_create_mapping_error(fake_dataset, fake_file_model, fake_mapping_create, file_status, inferred, exc_status, mapping_service):
    fake_file_model.status = file_status
    fake_file_model.inferred_schema = inferred
    db = AsyncMock()
    db.get = AsyncMock(side_effect=[fake_file_model])
    with pytest.raises(HTTPException) as e:
        await mapping_service.create(db, fake_mapping_create, fake_dataset.id)
    assert e.value.status_code == exc_status

async def test_create_mapping_file_not_found(fake_dataset, fake_mapping_create, mapping_service):
    db = AsyncMock()
    db.get = AsyncMock(side_effect=[None])
    with pytest.raises(HTTPException) as e:
        await mapping_service.create(db, fake_mapping_create, fake_dataset.id)
    assert e.value.status_code == status.HTTP_404_NOT_FOUND

async def test_get_mapping_found(fake_mapping_model, mapping_service):
    db = AsyncMock()
    db.get.return_value = fake_mapping_model
    result = await mapping_service.get(db, fake_mapping_model.id)
    assert result == fake_mapping_model

async def test_get_mapping_not_found(mapping_service):
    db = AsyncMock()
    db.get.return_value = None
    result = await mapping_service.get(db, uuid.uuid4())
    assert result is None

async def test_get_mappings_for_dataset(fake_dataset, fake_mapping_model, mapping_service):
    db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [fake_mapping_model]
    db.execute = AsyncMock(return_value=mock_result)
    result = await mapping_service.get_by_dataset(db, fake_dataset.id)
    assert result == [fake_mapping_model]
