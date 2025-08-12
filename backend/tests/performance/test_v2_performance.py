#!/usr/bin/env python3
"""Tests de performance pour la V2 du système de mapping."""

import pytest
import time
import random
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestV2Performance:
    """Tests de performance pour les fonctionnalités V2."""
    
    def generate_large_dataset(self, num_rows=1000, num_contacts=10, num_tags=20):
        """Génère un dataset volumineux pour les tests de performance."""
        rows = []
        for i in range(num_rows):
            row = {
                "id": f"user_{i}",
                "contacts": [
                    {
                        "phone": f"+33{random.randint(100000000, 999999999)}",
                        "email": f"contact{j}@example.com"
                    }
                    for j in range(num_contacts)
                ],
                "tags": [f"tag_{k}" for k in range(num_tags)],
                "scores": [
                    {
                        "value": random.randint(0, 100),
                        "category": random.choice(["A", "B", "C"])
                    }
                    for _ in range(5)
                ]
            }
            rows.append(row)
        return rows
    
    def test_large_dataset_performance(self):
        """Test de performance avec un grand dataset."""
        # Générer un dataset de 1000 lignes
        rows = self.generate_large_dataset(1000, 10, 20)
        
        mapping = {
            "dsl_version": "2.0",
            "index": "performance_test",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                },
                {
                    "path": "scores[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "contacts.phone",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*].phone"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "trim"
                                }
                            ]
                        }
                    ]
                },
                {
                    "target": "tags_first",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.tags[*]"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "take",
                            "which": "first"
                        }
                    ]
                },
                {
                    "target": "scores.filtered",
                    "type": "long",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.scores[*].value"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "when",
                                    "cond": {"gt": 50},
                                    "then": [
                                        {
                                            "op": "cast",
                                            "to": "long"
                                        }
                                    ],
                                    "else": [
                                        {
                                            "op": "literal",
                                            "value": 0
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Mesurer le temps d'exécution
        start_time = time.time()
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        assert response.status_code == 200
        assert execution_time < 30.0  # Doit s'exécuter en moins de 30 secondes
        
        result = response.json()
        assert len(result["docs_preview"]) == 1000
        
        print(f"⏱️  Performance: {len(rows)} lignes traitées en {execution_time:.2f}s")
        print(f"📊 Taux: {len(rows)/execution_time:.0f} lignes/seconde")
    
    def test_complex_pipeline_performance(self):
        """Test de performance avec des pipelines complexes."""
        rows = self.generate_large_dataset(500, 5, 10)
        
        mapping = {
            "dsl_version": "2.0",
            "index": "complex_pipeline_test",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "contacts[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "contacts.processed",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*]"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "when",
                                    "cond": {"contains": "phone"},
                                    "then": [
                                        {
                                            "op": "concat",
                                            "sep": " - ",
                                            "values": [
                                                {"kind": "jsonpath", "expr": "$.phone"},
                                                {"kind": "jsonpath", "expr": "$.email"}
                                            ]
                                        }
                                    ],
                                    "else": [
                                        {
                                            "op": "literal",
                                            "value": "no_contact"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        start_time = time.time()
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        assert response.status_code == 200
        assert execution_time < 20.0  # Doit s'exécuter en moins de 20 secondes
        
        result = response.json()
        assert len(result["docs_preview"]) == 500
        
        print(f"⏱️  Pipeline complexe: {len(rows)} lignes en {execution_time:.2f}s")
    
    def test_memory_usage(self):
        """Test de l'utilisation mémoire avec de gros datasets."""
        # Test avec un dataset très volumineux
        rows = self.generate_large_dataset(2000, 20, 50)
        
        mapping = {
            "dsl_version": "2.0",
            "index": "memory_test",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "containers": [
                {
                    "path": "data[]",
                    "type": "nested"
                }
            ],
            "fields": [
                {
                    "target": "data.value",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.data[*].value"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "trim"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Simuler des données imbriquées complexes
        for row in rows:
            row["data"] = [
                {"value": f"value_{i}_{j}"}
                for i in range(10)
                for j in range(5)
            ]
        
        start_time = time.time()
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        assert response.status_code == 200
        assert execution_time < 60.0  # Doit s'exécuter en moins de 60 secondes
        
        result = response.json()
        assert len(result["docs_preview"]) == 2000
        
        print(f"⏱️  Test mémoire: {len(rows)} lignes en {execution_time:.2f}s")
        print(f"📊 Données par ligne: {len(rows[0]['data'])} éléments imbriqués")
    
    def test_concurrent_operations(self):
        """Test de performance avec des opérations concurrentes."""
        rows = self.generate_large_dataset(100, 5, 10)
        
        mapping = {
            "dsl_version": "2.0",
            "index": "concurrent_test",
            "globals": {
                "nulls": [],
                "bool_true": [],
                "bool_false": [],
                "decimal_sep": ",",
                "thousands_sep": " ",
                "date_formats": [],
                "default_tz": "Europe/Paris",
                "empty_as_null": True
            },
            "id_policy": {
                "from": ["id"],
                "op": "concat",
                "sep": ":",
                "on_conflict": "error"
            },
            "fields": [
                {
                    "target": "phone_clean",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.contacts[*].phone"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "map",
                            "then": [
                                {
                                    "op": "trim"
                                },
                                {
                                    "op": "replace",
                                    "pattern": "\\+33",
                                    "replacement": "0"
                                }
                            ]
                        }
                    ]
                },
                {
                    "target": "tags_stats",
                    "type": "keyword",
                    "input": [
                        {
                            "kind": "jsonpath",
                            "expr": "$.tags[*]"
                        }
                    ],
                    "pipeline": [
                        {
                            "op": "take",
                            "which": "first"
                        },
                        {
                            "op": "concat",
                            "sep": "|",
                            "values": [
                                {"kind": "jsonpath", "expr": "$"},
                                {"kind": "literal", "value": "processed"}
                            ]
                        }
                    ]
                }
            ]
        }
        
        start_time = time.time()
        response = client.post("/mappings/dry-run", json={"rows": rows, **mapping})
        end_time = time.time()
        
        execution_time = end_time - start_time
        
        assert response.status_code == 200
        assert execution_time < 10.0  # Doit s'exécuter en moins de 10 secondes
        
        result = response.json()
        assert len(result["docs_preview"]) == 100
        
        print(f"⏱️  Opérations concurrentes: {len(rows)} lignes en {execution_time:.2f}s")
