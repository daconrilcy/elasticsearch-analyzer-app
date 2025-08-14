import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

vi.useFakeTimers();

async function flushMicrotasks(times = 2) {
  // deux tours suffisent pour vider la plupart des chaînes de then()
  for (let i = 0; i < times; i++) await Promise.resolve();
}

describe('withRateLimit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules(); // nouveau singleton à chaque test
    vi.useFakeTimers();
  });

  it('should execute functions within the rate limit', async () => {
    const { withRateLimit } = await import('../rateLimit');
    const func = vi.fn();

    for (let i = 0; i < 5; i++) {
      withRateLimit(async () => {
        func();
      });
    }

    // Les 5 premières passent sans attendre un token (micro-tick)
    await flushMicrotasks();
    expect(func).toHaveBeenCalledTimes(5);
  });

  it('should delay functions that exceed the rate limit', async () => {
    const { withRateLimit } = await import('../rateLimit');
    const func = vi.fn();

    for (let i = 0; i < 6; i++) {
      withRateLimit(async () => {
        func();
      });
    }

    // 5 premières exécutions : micro-tâches (pas de timers)
    await flushMicrotasks();
    expect(func).toHaveBeenCalledTimes(5);

    // 6e : attend ~200ms (5 req/s) → avance le temps puis re-flush micro-tâches
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    await flushMicrotasks();

    expect(func).toHaveBeenCalledTimes(6);
  });
});
