import uuid
from datetime import datetime
import pytest
from pydantic import ValidationError

from app.domain.dataset import schemas
from app.domain.file.models import FileStatus, IngestionStatus
from app.domain.file import schemas as file_schemas
from app.domain.mapping import schemas as mapping_schemas


def test_file_out_model():
    file_out = file_schemas.FileOut(
        id=uuid.uuid4(),
        filename_original="foo.csv",
        version=2,
        hash="h",
        size_bytes=10,
        created_at=datetime.now(),
        updated_at=datetime.now(),
        status=FileStatus.READY,
        parsing_error=None,
        line_count=100,
        column_count=5,
        uploader_id=uuid.uuid4(),
        uploader_name="test_user",
        inferred_schema={"colA": "string"},
        ingestion_status=IngestionStatus.COMPLETED,
        docs_indexed=42,
        ingestion_errors=["err1", "err2"],
        mapping_id=None,
        preview_data=[{"colA": "value1"}, {"colA": "value2"}],
    )
    assert file_out.version == 2
    assert file_out.status == FileStatus.READY
    assert file_out.ingestion_status == IngestionStatus.COMPLETED
    assert file_out.inferred_schema["colA"] == "string"


def test_mapping_rule_valid_and_validator():
    # Pas d'analyzer si pas "text"
    rule = mapping_schemas.MappingRule(source="colA", target="foo", es_type="integer", analyzer_project_id=None)
    assert rule.es_type == "integer"
    # Analyzer OK si text
    rule2 = mapping_schemas.MappingRule(
        source="colA",
        target="foo",
        es_type="text",
        analyzer_project_id=uuid.uuid4()
    )
    assert rule2.es_type == "text"
    # Analyzer ERROR si es_type != text
    with pytest.raises(ValidationError):
        mapping_schemas.MappingRule(
            source="colA",
            target="foo",
            es_type="integer",
            analyzer_project_id=uuid.uuid4()
        )

def test_schema_mapping_create_update():
    rule = mapping_schemas.MappingRule(source="col", target="t", es_type="text", analyzer_project_id=None)
    create = mapping_schemas.MappingCreate(
        name="map1",
        source_file_id=uuid.uuid4(),
        mapping_rules=[rule]
    )
    assert create.name == "map1"
    up = mapping_schemas.MappingUpdate(name="map2", mapping_rules=[rule])
    assert up.name == "map2"
    assert up.mapping_rules[0].source == "col"

def test_schema_mapping_out_model():
    rule = mapping_schemas.MappingRule(source="col", target="t", es_type="text", analyzer_project_id=None)
    mapping_out = mapping_schemas.MappingOut(
        id=uuid.uuid4(),
        dataset_id=uuid.uuid4(),
        name="test_mapping",
        source_file_id=uuid.uuid4(),
        mapping_rules=[rule],
        created_at=datetime.now(),
        updated_at=datetime.now(),
        index_name=None,
    )
    assert isinstance(mapping_out.mapping_rules, list)

def test_dataset_create_update_out_detail():
    d_id = uuid.uuid4()
    now = datetime.now()
    ds_create = schemas.DatasetCreate(name="test_dataset", description="desc")
    assert ds_create.name == "test_dataset"
    ds_update = schemas.DatasetUpdate(name="ds2")
    assert ds_update.name == "ds2"
    ds_out = schemas.DatasetOut(
        id=d_id,
        name="test_dataset",
        description=None,
        owner_id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
    )
    assert ds_out.id == d_id
    detail = schemas.DatasetDetailOut(**ds_out.model_dump(), files=[], mappings=[])
    assert isinstance(detail.files, list)
    assert isinstance(detail.mappings, list)

def test_search_results_models():
    hit = schemas.SearchHit(_score=1.23, _source={"foo": "bar"})
    assert hit.score == 1.23
    assert hit.source["foo"] == "bar"
    sr = schemas.SearchResults(total=10, hits=[hit], page=1, size=10)
    assert sr.total == 10
    assert len(sr.hits) == 1
