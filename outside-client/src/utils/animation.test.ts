import { describe, expect, it } from 'vitest';

import { computeWalkFrameIndex } from './animation';

describe('computeWalkFrameIndex', () => {
  it('returns 0 for non-positive speed', () => {
    expect(computeWalkFrameIndex({ timeMs: 100, speedTilesPerSec: 0, frames: 4 })).toBe(0);
  });

  it('cycles once per tile traveled', () => {
    // speed = 1 tile/sec, frames = 4, 1.5x cycle rate → 6 fps
    expect(computeWalkFrameIndex({ timeMs: 0, speedTilesPerSec: 1, frames: 4 })).toBe(0);
    expect(computeWalkFrameIndex({ timeMs: 250, speedTilesPerSec: 1, frames: 4 })).toBe(1);
    expect(computeWalkFrameIndex({ timeMs: 500, speedTilesPerSec: 1, frames: 4 })).toBe(3);
    expect(computeWalkFrameIndex({ timeMs: 750, speedTilesPerSec: 1, frames: 4 })).toBe(0);
    expect(computeWalkFrameIndex({ timeMs: 1000, speedTilesPerSec: 1, frames: 4 })).toBe(2);
  });

  it('runs faster when speed increases', () => {
    // speed = 2 tiles/sec, frames = 4, 1.5x cycle rate → 12 fps
    expect(computeWalkFrameIndex({ timeMs: 125, speedTilesPerSec: 2, frames: 4 })).toBe(1);
    expect(computeWalkFrameIndex({ timeMs: 250, speedTilesPerSec: 2, frames: 4 })).toBe(3);
  });
});

