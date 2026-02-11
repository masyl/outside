import { describe, expect, it } from 'vitest';
import { runPhysics3dRuntimeBenchmark } from './physics3d-runtime-benchmark';

describe('physics3d runtime benchmark utility', () => {
  it('should return comparable summaries for ts and lua runtimes', () => {
    const result = runPhysics3dRuntimeBenchmark({
      rounds: 2,
      ticsPerRound: 20,
      botCount: 12,
      worldRadius: 4,
      seed: 77,
    });

    expect(result.options.rounds).toBe(2);
    expect(result.options.ticsPerRound).toBe(20);

    expect(result.summaries.ts.runtimeMode).toBe('ts');
    expect(result.summaries.lua.runtimeMode).toBe('lua');

    expect(result.summaries.ts.rounds).toBe(2);
    expect(result.summaries.lua.rounds).toBe(2);

    expect(result.summaries.ts.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.summaries.lua.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.summaries.ts.averageMsPerTic).toBeGreaterThanOrEqual(0);
    expect(result.summaries.lua.averageMsPerTic).toBeGreaterThanOrEqual(0);

    expect(result.summaries.ts.totalCollisionEvents).toBeGreaterThanOrEqual(0);
    expect(result.summaries.lua.totalCollisionEvents).toBeGreaterThanOrEqual(0);
    expect(Math.abs(result.summaries.lua.totalCollisionEvents - result.summaries.ts.totalCollisionEvents))
      .toBeLessThanOrEqual(2);
  });
});
