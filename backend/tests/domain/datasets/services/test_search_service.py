import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, status

from app.domain.dataset.services.search_service import search_in_index, get_mapping_by_index_name


@pytest.mark.asyncio
async def test_get_mapping_by_index_name_found():
    db = AsyncMock()
    fake_mapping = MagicMock()
    result = MagicMock()
    result.scalars().first.return_value = fake_mapping
    db.execute = AsyncMock(return_value=result)

    mapping = await get_mapping_by_index_name(db, "foo_index")
    db.execute.assert_awaited_once()
    assert mapping is fake_mapping

@pytest.mark.asyncio
async def test_get_mapping_by_index_name_not_found():
    db = AsyncMock()
    result = MagicMock()
    result.scalars().first.return_value = None
    db.execute = AsyncMock(return_value=result)

    mapping = await get_mapping_by_index_name(db, "bar_index")
    assert mapping is None

@pytest.fixture
def fake_es_response():
    return {
        "hits": {
            "total": {"value": 42},
            "hits": [
                {"_id": "1", "_source": {"foo": "bar"}},
                {"_id": "2", "_source": {"bar": "baz"}}
            ]
        }
    }

@pytest.mark.asyncio
@patch("app.domain.dataset.services.search_service.schemas.SearchHit")
@patch("app.domain.dataset.services.search_service.schemas.SearchResults")
async def test_search_in_index_ok(MockSearchResults, MockSearchHit, fake_es_response):
    es_client = AsyncMock()
    es_client.indices.exists = AsyncMock(return_value=True)
    es_client.search = AsyncMock(return_value=fake_es_response)

    # Fakes for schemas
    MockSearchHit.model_validate.side_effect = lambda hit: hit
    MockSearchResults.return_value = MagicMock()

    result = await search_in_index(es_client, "foo_index", "abc", page=2, size=5)

    es_client.indices.exists.assert_awaited_once_with(index="foo_index")
    es_client.search.assert_awaited_once()
    assert isinstance(result, MagicMock)
    assert MockSearchHit.model_validate.call_count == 2
    assert MockSearchResults.called

@pytest.mark.asyncio
async def test_search_in_index_index_not_exists():
    es_client = AsyncMock()
    es_client.indices.exists = AsyncMock(return_value=False)

    with pytest.raises(HTTPException) as e:
        await search_in_index(es_client, "doesnotexist", "yo", page=1, size=10)
    assert e.value.status_code == status.HTTP_404_NOT_FOUND

@pytest.mark.asyncio
@patch("app.domain.dataset.services.search_service.schemas.SearchHit")
@patch("app.domain.dataset.services.search_service.schemas.SearchResults")
async def test_search_in_index_es_error(MockSearchResults, MockSearchHit):
    es_client = AsyncMock()
    es_client.indices.exists = AsyncMock(return_value=True)
    es_client.search = AsyncMock(side_effect=Exception("fail!"))

    with pytest.raises(HTTPException) as e:
        await search_in_index(es_client, "foo_index", "crash", page=1, size=10)
    assert e.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
