import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react';
import { useAbortable } from '../useAbortable';

describe('useAbortable', () => {
  it('should return a signal', () => {
    const { result } = renderHook(() => useAbortable());
    let signal: AbortSignal | undefined;
    act(() => {
      signal = result.current.signalNext();
    });
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('should abort the previous signal when signalNext is called', () => {
    const { result } = renderHook(() => useAbortable());
    let signal1: AbortSignal | undefined;
    act(() => {
      signal1 = result.current.signalNext();
    });

    expect(signal1?.aborted).toBe(false);

    act(() => {
      result.current.signalNext();
    });

    expect(signal1?.aborted).toBe(true);
  });

  it('should abort the current signal', () => {
    const { result } = renderHook(() => useAbortable());
    let signal: AbortSignal | undefined;
    act(() => {
      signal = result.current.signalNext();
    });

    expect(signal?.aborted).toBe(false);

    act(() => {
      result.current.abort();
    });

    expect(signal?.aborted).toBe(true);
  });
});