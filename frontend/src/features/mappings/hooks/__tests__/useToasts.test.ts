import { renderHook, act } from '@testing-library/react';
import { useToasts } from '../useToasts';
import { describe, it, expect, vi } from 'vitest';

vi.useFakeTimers();

describe('useToasts', () => {
  it('should add and remove a toast', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.show('Test message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('can clear all toasts', () => {
    const { result } = renderHook(() => useToasts());

    act(() => {
      result.current.success('Success');
      result.current.error('Error');
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});