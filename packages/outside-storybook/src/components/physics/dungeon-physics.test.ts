import { describe, expect, it } from 'vitest';
import {
  computeSphereWallPenetration,
  countSevereWallPenetrationsFromSamples,
  runClippingExperiment,
  type SphereSample,
  type WallBoxSample,
} from './dungeon-physics';

describe('dungeon physics clipping metric', () => {
  const wall: WallBoxSample = {
    centerX: 2,
    centerY: 0.5,
    centerZ: 2,
    halfX: 0.5,
    halfY: 0.5,
    halfZ: 0.5,
  };

  it('returns zero penetration when sphere is outside wall box', () => {
    const sphere: SphereSample = { x: 3.4, y: 0.3, z: 2, radius: 0.3 };
    expect(computeSphereWallPenetration(sphere, wall)).toBe(0);
  });

  it('returns positive penetration when sphere overlaps wall box', () => {
    const sphere: SphereSample = { x: 2.2, y: 0.4, z: 2, radius: 0.4 };
    expect(computeSphereWallPenetration(sphere, wall)).toBeGreaterThan(0.1);
  });

  it('counts severe penetrations above tolerance', () => {
    const spheres: SphereSample[] = [
      { x: 2.15, y: 0.35, z: 2, radius: 0.35 },
      { x: 4.0, y: 0.35, z: 4.0, radius: 0.35 },
    ];

    const severe = countSevereWallPenetrationsFromSamples(spheres, [wall], 0.05);
    expect(severe).toBe(1);
  });

  it('keeps severe clipping at zero in baseline experiment', () => {
    const result = runClippingExperiment({
      width: 12,
      depth: 10,
      botCount: 6,
      botRadius: 0.3,
      moveSpeed: 2.2,
      jumpImpulse: 2.4,
      durationSec: 8,
      fixedStepSec: 1 / 120,
      severeTolerance: 0.03,
      seed: 42,
    });

    expect(result.maxSevereClips).toBe(0);
    expect(result.finalSevereClips).toBe(0);
  });

  it('is deterministic for same seed and experiment settings', () => {
    const options = {
      width: 12,
      depth: 10,
      botCount: 10,
      botRadius: 0.3,
      moveSpeed: 5.2,
      jumpImpulse: 3.6,
      durationSec: 6,
      fixedStepSec: 1 / 120,
      severeTolerance: 0.03,
      seed: 42,
    } as const;

    const first = runClippingExperiment(options);
    const second = runClippingExperiment(options);

    expect(second).toEqual(first);
  });
});
