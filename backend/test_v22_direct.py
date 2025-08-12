#!/usr/bin/env python3
"""Test direct des opérations V2.2."""

from app.domain.mapping.executor.ops import op_unique, op_sort, op_filter, op_slice

def test_v22_ops_direct():
    """Test direct des nouvelles opérations V2.2."""
    
    # Test unique
    data = ["c", "b", "a", "b", None]
    result = op_unique(data)
    print(f"unique({data}) = {result}")
    assert "a" in result
    assert "b" in result
    assert "c" in result
    assert len(result) == 4  # None est filtré
    
    # Test sort
    data = [3, 1, 4, 1, 5, 9, 2, 6]
    result = op_sort(data, numeric=True, order="asc")
    print(f"sort({data}) = {result}")
    assert result == [1, 1, 2, 3, 4, 5, 6, 9]
    
    # Test filter
    data = [1, 2, 3, 4, 5, 6, 7, 8]
    result = op_filter(data, cond={"gt": 3})
    print(f"filter({data}, gt: 3) = {result}")
    assert result == [4, 5, 6, 7, 8]
    
    # Test slice
    data = [1, 2, 3, 4, 5]
    result = op_slice(data, start=1, end=4)
    print(f"slice({data}, 1:4) = {result}")
    assert result == [2, 3, 4]
    
    print("✅ Toutes les opérations V2.2 fonctionnent correctement !")

if __name__ == "__main__":
    test_v22_ops_direct()
