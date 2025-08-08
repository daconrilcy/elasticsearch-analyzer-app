import uuid
import pytest
from unittest.mock import AsyncMock
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.dataset import models, schemas
from app.domain.dataset.services import DatasetService
from app.domain.user.models import User

pytestmark = pytest.mark.asyncio

@pytest.fixture
def dataset_input():
    return schemas.DatasetCreate(name="Test Dataset", description="Sample")

@pytest.fixture
def mock_user():
    return User(id=uuid.uuid4())

@pytest.fixture
def fake_dataset():
    return models.Dataset(id=uuid.uuid4(), name="Sample", owner_id=uuid.uuid4())

@pytest.fixture
def dataset_service():
    return DatasetService()

@pytest.mark.asyncio
async def test_create_dataset(dataset_input, mock_user, dataset_service):
    db = AsyncMock(spec=AsyncSession)
    db.add = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    result = await dataset_service.create(db=db, dataset_in=dataset_input, owner=mock_user)
    assert result.name == dataset_input.name
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()

@pytest.mark.asyncio
async def test_get_dataset_found(fake_dataset, dataset_service):
    db = AsyncMock(spec=AsyncSession)
    db.get.return_value = fake_dataset
    result = await dataset_service.get(db, fake_dataset.id)
    assert result.id == fake_dataset.id

@pytest.mark.asyncio
async def test_get_dataset_owned_by_user_success(fake_dataset, dataset_service):
    db = AsyncMock(spec=AsyncSession)
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = fake_dataset
    db.execute = AsyncMock(return_value=mock_result)
    user = User(id=fake_dataset.owner_id)
    result = await dataset_service.get_owned_by_user(db, fake_dataset.id, user)
    assert result.id == fake_dataset.id

@pytest.mark.asyncio
async def test_get_dataset_owned_by_user_not_found(dataset_service):
    db = AsyncMock(spec=AsyncSession)
    db.get.return_value = None
    with pytest.raises(Exception):
        await dataset_service.get_owned_by_user(db, uuid.uuid4(), User(id=uuid.uuid4()))

@pytest.mark.asyncio
async def test_get_dataset_owned_by_user_forbidden(fake_dataset, dataset_service):
    db = AsyncMock(spec=AsyncSession)
    db.get.return_value = fake_dataset
    user = User(id=uuid.uuid4())
    with pytest.raises(Exception):
        await dataset_service.get_owned_by_user(db, fake_dataset.id, user)
