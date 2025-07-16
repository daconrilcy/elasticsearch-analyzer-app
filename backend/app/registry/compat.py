import json
from pathlib import Path

COMPAT_PATH = Path(__file__).parent / "_es_token_filter_compatibility.json"

with open(COMPAT_PATH, encoding="utf-8") as f:
    _compatibility = json.load(f)["compatibility"]

def is_token_filter_compatible(tokenizer_name, token_filter_name):
    for item in _compatibility:
        if item["tokenizer"] == tokenizer_name:
            filters = item["token_filters"]
            if filters.get("*") is True:
                return True
            if token_filter_name in filters:
                return filters[token_filter_name] is True
            if filters.get("*") == "partial":
                return filters.get(token_filter_name, False)
    return False
