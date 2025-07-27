import uuid
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status

from app.domain.dataset.services.mapping_service import (
    create_schema_mapping,
    get_mapping,
    get_mappings_for_dataset,
    create_es_index_from_mapping,
    _generate_es_index_definition,
)
from app.domain.dataset import models, schemas

pytestmark = pytest.mark.asyncio


@pytest.fixture
def fake_user():
    from app.domain.user.models import User
    return User(id=uuid.uuid4())


@pytest.fixture
def fake_dataset(fake_user):
    return models.Dataset(
        id=uuid.uuid4(),
        owner_id=fake_user.id,
        name="MyData",
        description="desc"
    )


@pytest.fixture
def fake_file_model(fake_dataset, fake_user):
    return models.UploadedFile(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        filename_original="foo.csv",
        filename_stored="bar.csv",
        version=1,
        hash="abc",
        size_bytes=123,
        uploader_id=fake_user.id,
        dataset=fake_dataset,
        status=models.FileStatus.PARSED,
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
    return schemas.SchemaMappingCreate(
        name="map1",
        source_file_id=fake_file_model.id,
        mapping_rules=[mapping_rule],
    )


@pytest.fixture
def fake_mapping_model(fake_dataset, fake_file_model, mapping_rule):
    return models.SchemaMapping(
        id=uuid.uuid4(),
        dataset_id=fake_dataset.id,
        name="map1",
        source_file_id=fake_file_model.id,
        mapping_rules=[mapping_rule.model_dump()],
        index_name=None,
    )


async def test_create_schema_mapping_ok(fake_dataset, fake_file_model, fake_mapping_create, mapping_rule):
    db = AsyncMock()
    db.get = AsyncMock(side_effect=[fake_file_model])
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    mapping = await create_schema_mapping(db, fake_dataset, fake_mapping_create)
    db.get.assert_awaited()
    db.add.assert_called_once()
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once()
    assert mapping.dataset_id == fake_dataset.id
    assert mapping.name == "map1"


@pytest.mark.parametrize("file_status,inferred,exc_status", [
    (models.FileStatus.PENDING, None, status.HTTP_409_CONFLICT),  # Not parsed
    (models.FileStatus.PARSED, None, status.HTTP_409_CONFLICT),  # No inferred schema
    (models.FileStatus.PARSED, {"colX": "string"}, status.HTTP_400_BAD_REQUEST),  # Bad column
])
async def test_create_schema_mapping_error(fake_dataset, fake_file_model, fake_mapping_create, file_status, inferred, exc_status):
    bad_file = fake_file_model
    bad_file.status = file_status
    bad_file.inferred_schema = inferred
    db = AsyncMock()
    db.get = AsyncMock(side_effect=[bad_file])
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    # Colonne incorrecte si schema pas correct
    if exc_status == status.HTTP_400_BAD_REQUEST:
        fake_mapping_create.mapping_rules[0].source = "not_in_schema"
    with pytest.raises(HTTPException) as e:
        await create_schema_mapping(db, fake_dataset, fake_mapping_create)
    assert e.value.status_code == exc_status


async def test_create_schema_mapping_file_not_found(fake_dataset, fake_mapping_create):
    db = AsyncMock()
    db.get = AsyncMock(return_value=None)
    with pytest.raises(HTTPException) as e:
        await create_schema_mapping(db, fake_dataset, fake_mapping_create)
    assert e.value.status_code == status.HTTP_404_NOT_FOUND


async def test_get_mapping_found(fake_mapping_model):
    db = AsyncMock()
    db.get = AsyncMock(return_value=fake_mapping_model)
    mapping = await get_mapping(db, fake_mapping_model.id)
    assert mapping == fake_mapping_model
    db.get.assert_awaited_once()


async def test_get_mapping_not_found():
    db = AsyncMock()
    db.get = AsyncMock(return_value=None)
    mapping = await get_mapping(db, uuid.uuid4())
    assert mapping is None


async def test_get_mappings_for_dataset(fake_dataset, fake_mapping_model):
    db = AsyncMock()
    result = MagicMock()
    result.scalars().all.return_value = [fake_mapping_model]
    db.execute = AsyncMock(return_value=result)
    mappings = await get_mappings_for_dataset(db, fake_dataset.id)
    assert len(mappings) == 1
    assert mappings[0].id == fake_mapping_model.id


@pytest.mark.asyncio
@patch("app.domain.dataset.services.mapping_service._generate_es_index_definition", new_callable=AsyncMock)
async def test_create_es_index_from_mapping_ok(mock_generate_def, fake_mapping_model, fake_dataset):
    db = AsyncMock()
    db.get = AsyncMock(return_value=fake_dataset)
    es_client = AsyncMock()
    es_client.indices.exists = AsyncMock(return_value=False)
    es_client.indices.create = AsyncMock()
    mock_generate_def.return_value = {"mappings": {"properties": {}}}
    fake_mapping_model.index_name = None
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    mapping = await create_es_index_from_mapping(db, es_client, fake_mapping_model)
    es_client.indices.create.assert_awaited_once()
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once()
    assert mapping.index_name is not None


@pytest.mark.asyncio
async def test_create_es_index_from_mapping_already_exists(fake_mapping_model, fake_dataset):
    db = AsyncMock()
    db.get = AsyncMock(return_value=fake_dataset)
    es_client = AsyncMock()
    es_client.indices.exists = AsyncMock(return_value=True)
    fake_mapping_model.index_name = "exists"
    with pytest.raises(HTTPException) as e:
        await create_es_index_from_mapping(db, es_client, fake_mapping_model)
    assert e.value.status_code == status.HTTP_409_CONFLICT


@pytest.mark.asyncio
@patch("app.domain.dataset.services.mapping_service.convert_graph_to_es_analyzer", return_value={"foo": "bar"})
async def test_generate_es_index_definition_ok(mock_convert):
    db = AsyncMock()
    # Rule with analyzer
    rule = schemas.MappingRule(
        source="col1",
        target="dest_col1",
        es_type="text",
        analyzer_project_id=uuid.uuid4()
    )
    # Analyzer project mock
    analyzer_project = MagicMock()
    analyzer_project.name = "SuperAnalyzer"
    analyzer_project.graph = {
        "nodes": [],
        "edges": []
    }
    db.get = AsyncMock(return_value=analyzer_project)
    result = await _generate_es_index_definition(db, [rule])
    assert "mappings" in result
    assert "settings" in result
    assert "dest_col1" in result["mappings"]["properties"]
    assert "analysis" in result["settings"]
