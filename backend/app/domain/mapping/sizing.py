import math
from typing import Any, Dict, List

C = {
    "doc_overhead": 100,          # bytes/docs (routing, _source small, etc.)
    "keyword_doc_values": 16,     # overhead DV
    "text_index_factor": 1.5,     # ~1.5x avg_len (tokens/postings)
    "norms_bytes": 1,             # approx per text field
    "num_bytes": 8,               # int/long/double/date
    "geo_point_bytes": 16,
    "ip_bytes": 16,
}

NUMERIC = {"integer", "long", "double", "date", "boolean"}
SIMPLE_NUM = {"integer", "long", "double", "date"}

def _mf_multiplier(f: Dict[str, Any]) -> float:
    mf = f.get("multi_fields") or []
    return 1.0 + len(mf)

def _bytes_for_field(f: Dict[str, Any], stats: Dict[str, Any]) -> int:
    t = f["type"]
    name = f["target"]
    st = stats.get(name) or {}
    avg_len = st.get("avg_len", 16)
    
    if t == "keyword":
        # DV + term
        return int(avg_len + C["keyword_doc_values"])
    if t == "text":
        base = int(C["text_index_factor"] * avg_len) + C["norms_bytes"]
        return base
    if t in SIMPLE_NUM: return C["num_bytes"]
    if t == "boolean": return 1
    if t == "ip": return C["ip_bytes"]
    if t == "geo_point": return C["geo_point_bytes"]
    if t == "geo_shape": return 64  # très approximatif
    return 8

def estimate_size(mapping: Dict[str, Any], field_stats: List[Dict[str, Any]], num_docs: int, replicas: int = 1, target_shard_gb: int = 30):
    # index field stats by target (fallback par source)
    stats_map = {}
    for s in field_stats:
        # accepte "source" et "target"
        k = s.get("target") or s.get("source")
        if k: stats_map[k] = s

    breakdown = []
    per_doc = C["doc_overhead"]
    for f in mapping.get("fields", []):
        b = _bytes_for_field(f, stats_map)
        b = int(b * _mf_multiplier(f))
        breakdown.append({"target": f["target"], "type": f["type"], "per_doc_bytes": b})
        per_doc += b

    primary_size = per_doc * max(num_docs, 0)
    total_size = primary_size * (1 + replicas)
    shard_size_bytes = target_shard_gb * (1024**3)
    rec_shards = max(1, math.ceil(primary_size / shard_size_bytes))
    
    return {
        "per_doc_bytes": per_doc,
        "primary_size_bytes": primary_size,
        "total_size_bytes": total_size,
        "recommended_shards": rec_shards,
        "target_shard_size_gb": target_shard_gb,
        "breakdown": breakdown
    }
