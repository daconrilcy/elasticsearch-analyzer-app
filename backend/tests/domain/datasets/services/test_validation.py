import pytest
from fastapi import HTTPException, status
from app.domain.dataset.services.validation import (
    validate_uploaded_file, ALLOWED_EXTENSIONS, MAX_FILE_SIZE
)


class DummyUploadFile:
    """Fake UploadFile for tests."""

    def __init__(self, filename, size):
        self.filename = filename
        self.size = size


def test_validate_uploaded_file_ok():
    for ext in ALLOWED_EXTENSIONS:
        f = DummyUploadFile(f"data{ext}", 10_000)
        # Doit passer sans lever d'exception
        validate_uploaded_file(f)


def test_validate_uploaded_file_forbidden_ext():
    file = DummyUploadFile("foo.exe", 1000)
    with pytest.raises(HTTPException) as e:
        validate_uploaded_file(file)
    assert e.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "non autorisé" in str(e.value.detail)


def test_validate_uploaded_file_too_large():
    file = DummyUploadFile("foo.csv", MAX_FILE_SIZE + 1)
    with pytest.raises(HTTPException) as e:
        validate_uploaded_file(file)
    assert e.value.status_code == status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    assert "trop volumineux" in str(e.value.detail)


def test_validate_uploaded_file_ext_case_insensitive():
    file = DummyUploadFile("FOO.CSV", 100)
    # L'extension doit être acceptée (case-insensitive)
    validate_uploaded_file(file)
