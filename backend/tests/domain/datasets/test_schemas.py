import uuid
from datetime import datetime
import pytest
from pydantic import ValidationError

from app.domain.dataset.schemas import (
    FileStructureField,
    FileUploadResponse,
    UploadedFileOut,
    IngestRequest,
    MappingRule,
    SchemaMappingCreate,
    SchemaMappingUpdate,
    SchemaMappingOut,
    DatasetCreate,
    DatasetUpdate,
    DatasetOut,
    DatasetDetailOut,
    SearchQuery,
    SearchHit,
    SearchResults,
)
from app.domain.dataset.models import FileStatus, IngestionStatus

def test_file_structure_field_model():
    field = FileStructureField(field="foo", type="string")
    assert field.field == "foo"
    assert field.type == "string"

def test_file_upload_response_alias():
    response = FileUploadResponse(file_id="file1", schema=[
        FileStructureField(field="col1", type="string"),
        FileStructureField(field="col2", type="integer"),
    ])
    assert response.file_id == "file1"
    # L'alias fonctionne bien
    assert hasattr(response, "inferred_schema")
    assert len(response.inferred_schema) == 2

def test_uploaded_file_out_model():
    file_out = UploadedFileOut(
        id=uuid.uuid4(),
        dataset_id=uuid.uuid4(),
        filename_original="foo.csv",
        filename_stored="bar.csv",
        version=2,
        hash="h",
        size_bytes=10,
        upload_date=datetime.now(),
        status=FileStatus.PARSED,
        uploader_id=uuid.uuid4(),
        inferred_schema={"colA": "string"},
        ingestion_status=IngestionStatus.COMPLETED,
        docs_indexed=42,
        ingestion_errors=["err1", "err2"],
    )
    assert file_out.version == 2
    assert file_out.status == FileStatus.PARSED
    assert file_out.ingestion_status == IngestionStatus.COMPLETED
    assert file_out.inferred_schema["colA"] == "string"

def test_ingest_request_model():
    req = IngestRequest(mapping_id=uuid.uuid4())
    assert isinstance(req.mapping_id, uuid.UUID)

def test_mapping_rule_valid_and_validator():
    # Pas d'analyzer si pas "text"
    rule = MappingRule(source="colA", target="foo", es_type="integer", analyzer_project_id=None)
    assert rule.es_type == "integer"
    # Analyzer OK si text
    rule2 = MappingRule(
        source="colA",
        target="foo",
        es_type="text",
        analyzer_project_id=uuid.uuid4()
    )
    assert rule2.es_type == "text"
    # Analyzer ERROR si es_type != text
    with pytest.raises(ValidationError):
        MappingRule(
            source="colA",
            target="foo",
            es_type="integer",
            analyzer_project_id=uuid.uuid4()
        )

def test_schema_mapping_create_update():
    rule = MappingRule(source="col", target="t", es_type="text", analyzer_project_id=None)
    create = SchemaMappingCreate(
        name="map1",
        source_file_id=uuid.uuid4(),
        mapping_rules=[rule]
    )
    assert create.name == "map1"
    up = SchemaMappingUpdate(name="map2", mapping_rules=[rule])
    assert up.name == "map2"
    assert up.mapping_rules[0].source == "col"

def test_schema_mapping_out_model():
    rule = MappingRule(source="col", target="t", es_type="text", analyzer_project_id=None)
    mapping_out = SchemaMappingOut(
        id=uuid.uuid4(),
        dataset_id=uuid.uuid4(),
        name="n",
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
    ds_create = DatasetCreate(name="ds", description="desc")
    assert ds_create.name == "ds"
    ds_update = DatasetUpdate(name="ds2")
    assert ds_update.name == "ds2"
    ds_out = DatasetOut(
        id=d_id,
        name="ds",
        description=None,
        owner_id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
    )
    assert ds_out.id == d_id
    detail = DatasetDetailOut(**ds_out.model_dump(), files=[], mappings=[])
    assert isinstance(detail.files, list)
    assert isinstance(detail.mappings, list)

def test_search_query_and_results_models():
    sq = SearchQuery(query="foo", page=1, size=10)
    assert sq.query == "foo"
    hit = SearchHit(_score=1.23, _source={"foo": "bar"})
    assert hit.score == 1.23
    assert hit.source["foo"] == "bar"
    sr = SearchResults(total=10, hits=[hit], page=1, size=10)
    assert sr.total == 10
    assert len(sr.hits) == 1

def test_search_query_page_minimum():
    with pytest.raises(ValidationError):
        SearchQuery(query="x", page=0, size=10)
    with pytest.raises(ValidationError):
        SearchQuery(query="x", page=1, size=0)
