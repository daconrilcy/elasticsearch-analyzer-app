""" backend/tests/domain/project/test_schemas.py"""

import uuid
from app.domain.project.schemas import ProjectOut
from app.domain.analyzer.models import AnalyzerGraph, Node, Edge, Kind
from app.domain.project.models import ProjectStatus


def test_project_out_parses_graph_dict():
    graph_dict = {
        "id": "test-graph-id",
        "name": "MyAnalyzer",
        "version": "1",
        "nodes": [
            {
                "id": "n1",
                "kind": "input",
                "name": "whitespace",
                "label": "Tokenizer",
                "category": "tokenization",
                "params": {"some_param": True},
                "meta": {"x": 100, "y": 200}
            }
        ],
        "edges": [
            {"source": "n1", "target": "n2"}
        ],
        "settings": {"language": "en"}
    }

    data = {
        "id": uuid.uuid4(),
        "name": "Test Project",
        "description": "Un projet de test",
        "graph": graph_dict,  # <--- test du parsing ici
        "version": 1,
        "status": ProjectStatus.DRAFT
    }

    project = ProjectOut(**data)

    assert isinstance(project.graph, AnalyzerGraph)
    assert project.graph.name == "MyAnalyzer"
    assert project.graph.nodes[0].kind == Kind.input
    assert project.graph.edges[0].source == "n1"
