import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';
import { describe, it, expect, vi } from 'vitest';

vi.useFakeTimers();

describe('useDebounce', () => {
  it('should debounce the callback function', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current();
      result.current();
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});