import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_infer_types(async_client: AsyncClient):
    """Test de l'inférence de types."""
    rows = [{"a": "12", "b": "2024-01-01", "c": "oui", "d": "Paris", "e": "1.2.3.4"}]
    payload = {
        "rows": rows,
        "globals": {
            "nulls": [],
            "bool_true": ["oui"],
            "bool_false": ["non"],
            "decimal_sep": ",",
            "thousands_sep": " ",
            "date_formats": ["yyyy-MM-dd"],
            "default_tz": "Europe/Paris",
            "empty_as_null": True
        }
    }
    
    response = await async_client.post("/mappings/infer-types/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "field_stats" in data
    assert "suggestions" in data
    
    # Vérifier que les types sont bien inférés
    suggestions = data["suggestions"]
    
    # Champ 'a' devrait être numérique
    a_suggestion = next((s for s in suggestions if s["source"] == "a"), None)
    assert a_suggestion is not None
    assert a_suggestion["es_type"] in ("double", "integer")
    
    # Champ 'b' devrait être une date
    b_suggestion = next((s for s in suggestions if s["source"] == "b"), None)
    assert b_suggestion is not None
    assert b_suggestion["es_type"] == "date"
    
    # Champ 'c' devrait être un boolean
    c_suggestion = next((s for s in suggestions if s["source"] == "c"), None)
    assert c_suggestion is not None
    assert c_suggestion["es_type"] == "boolean"
    
    # Champ 'e' devrait être une IP
    e_suggestion = next((s for s in suggestions if s["source"] == "e"), None)
    assert e_suggestion is not None
    assert e_suggestion["es_type"] == "ip"


@pytest.mark.asyncio
async def test_estimate_size(async_client: AsyncClient):
    """Test de l'estimation de taille."""
    mapping = {
        "fields": [
            {"target": "name", "type": "text", "multi_fields": [{"name": "raw", "type": "keyword"}]},
            {"target": "status", "type": "keyword"},
            {"target": "price", "type": "double"},
            {"target": "created_at", "type": "date"}
        ]
    }
    
    stats = [
        {"target": "name", "avg_len": 20},
        {"target": "status", "avg_len": 6}
    ]
    
    payload = {
        "mapping": mapping,
        "field_stats": stats,
        "num_docs": 1_000_000,
        "replicas": 1,
        "target_shard_size_gb": 30
    }
    
    response = await async_client.post("/mappings/estimate-size/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "per_doc_bytes" in data
    assert "primary_size_bytes" in data
    assert "total_size_bytes" in data
    assert "recommended_shards" in data
    assert "breakdown" in data
    
    # Vérifications de base
    assert data["recommended_shards"] >= 1
    assert data["primary_size_bytes"] > 0
    assert data["per_doc_bytes"] > 0
    
    # Vérifier le breakdown
    breakdown = data["breakdown"]
    assert len(breakdown) == 4  # 4 champs
    
    # Vérifier que chaque champ a une estimation
    for field in breakdown:
        assert "target" in field
        assert "type" in field
        assert "per_doc_bytes" in field
        assert field["per_doc_bytes"] > 0


@pytest.mark.asyncio
async def test_infer_types_empty_data(async_client: AsyncClient):
    """Test de l'inférence avec des données vides."""
    payload = {"rows": [], "globals": {}}
    
    response = await async_client.post("/mappings/infer-types/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["field_stats"] == []
    assert data["suggestions"] == []


@pytest.mark.asyncio
async def test_estimate_size_minimal_mapping(async_client: AsyncClient):
    """Test de l'estimation avec un mapping minimal."""
    mapping = {"fields": [{"target": "test", "type": "keyword"}]}
    stats = [{"target": "test", "avg_len": 10}]
    
    payload = {
        "mapping": mapping,
        "field_stats": stats,
        "num_docs": 1000
    }
    
    response = await async_client.post("/mappings/estimate-size/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["recommended_shards"] == 1  # Pour 1000 docs, 1 shard suffit
    assert data["primary_size_bytes"] > 0


@pytest.mark.asyncio
async def test_infer_types_with_nulls(async_client: AsyncClient):
    """Test de l'inférence avec des valeurs nulles."""
    rows = [
        {"col": "value1"},
        {"col": None},
        {"col": ""},
        {"col": "value2"}
    ]
    
    payload = {
        "rows": rows,
        "globals": {
            "nulls": ["", "NULL", "N/A"],
            "empty_as_null": True
        }
    }
    
    response = await async_client.post("/mappings/infer-types/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    col_stats = next((s for s in data["field_stats"] if s["source"] == "col"), None)
    assert col_stats is not None
    assert col_stats["null_rate"] > 0  # Il y a des valeurs nulles
    assert col_stats["non_null"] == 2  # 2 valeurs non-nulles


@pytest.mark.asyncio
async def test_estimate_size_with_multi_fields(async_client: AsyncClient):
    """Test de l'estimation avec des multi-fields."""
    mapping = {
        "fields": [
            {
                "target": "title",
                "type": "text",
                "multi_fields": [
                    {"name": "raw", "type": "keyword"},
                    {"name": "stemmed", "type": "text"}
                ]
            }
        ]
    }
    
    stats = [{"target": "title", "avg_len": 50}]
    
    payload = {
        "mapping": mapping,
        "field_stats": stats,
        "num_docs": 10000
    }
    
    response = await async_client.post("/mappings/estimate-size/test", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    # Avec multi-fields, la taille par document devrait être plus importante
    assert data["per_doc_bytes"] > 100  # Au moins 100 bytes par doc
