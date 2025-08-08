import uuid
from app.domain.dataset.models import Dataset
from app.domain.file.models import FileStatus, IngestionStatus, File
from app.domain.mapping.models import Mapping

def test_file_status_enum_values():
    assert FileStatus.PENDING.value == "pending"
    assert FileStatus.PARSING.value == "parsing"
    assert FileStatus.READY.value == "ready"
    assert FileStatus.ERROR.value == "error"

def test_ingestion_status_enum_values():
    assert IngestionStatus.NOT_STARTED.value == "not_started"
    assert IngestionStatus.IN_PROGRESS.value == "in_progress"
    assert IngestionStatus.COMPLETED.value == "completed"
    assert IngestionStatus.FAILED.value == "failed"

def test_dataset_model_fields():
    ds = Dataset(
        id=uuid.uuid4(),
        name="TestDS",
        description="desc",
        owner_id=uuid.uuid4()
    )
    assert ds.name == "TestDS"
    assert ds.description == "desc"
    assert ds.owner_id is not None

def test_file_model_fields():
    ds_id = uuid.uuid4()
    file = File(
        id=uuid.uuid4(),
        dataset_id=ds_id,
        filename_original="a.csv",
        filename_stored="b.csv",
        version=1,
        hash="h",
        size_bytes=100,
        uploader_id=uuid.uuid4()
    )
    assert file.dataset_id == ds_id
    assert file.filename_original == "a.csv"
    assert file.filename_stored == "b.csv"
    assert file.version == 1
    assert file.hash == "h"
    assert file.size_bytes == 100
    assert file.uploader_id is not None

def test_mapping_model_fields():
    ds_id = uuid.uuid4()
    file_id = uuid.uuid4()
    mapping = Mapping(
        id=uuid.uuid4(),
        dataset_id=ds_id,
        name="my mapping",
        source_file_id=file_id,
        mapping_rules=[{"source": "colA", "target": "colB", "es_type": "text"}]
    )
    assert mapping.dataset_id == ds_id
    assert mapping.source_file_id == file_id
    assert mapping.name == "my mapping"
    assert isinstance(mapping.mapping_rules, list)
