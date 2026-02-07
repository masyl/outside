import { describe, it, expect } from 'vitest';
import { distancePerTic, stepPosition } from './movement';

describe('distancePerTic', () => {
  it('should compute distance for 1 tile/sec and 1000ms tic', () => {
    expect(distancePerTic(1, 1000)).toBe(1);
  });

  it('should compute distance for 2 tiles/sec and 500ms tic', () => {
    expect(distancePerTic(2, 500)).toBe(1);
  });

  it('should compute distance for 1 tile/sec and 50ms tic', () => {
    expect(distancePerTic(1, 50)).toBe(0.05);
  });
});

describe('stepPosition', () => {
  it('should step right (0 rad) by 1', () => {
    const result = stepPosition({ x: 0, y: 0 }, 0, 1);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(0);
  });

  it('should step down (π/2 rad) by 1', () => {
    const result = stepPosition({ x: 0, y: 0 }, Math.PI / 2, 1);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(1);
  });

  it('should step by zero and leave position unchanged', () => {
    const result = stepPosition({ x: 3, y: 4 }, Math.PI / 4, 0);
    expect(result.x).toBe(3);
    expect(result.y).toBe(4);
  });
});
