import { renderHook } from '@testing-library/react';
import { useShortcuts } from '../useShortcuts';
import { describe, it, expect, vi } from 'vitest';

describe('useShortcuts', () => {
  it('should add and remove keydown event listener', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = renderHook(() => useShortcuts({}));
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});