import { describe, expect, it } from 'vitest';

import { directionFromVelocity } from './direction';

describe('directionFromVelocity', () => {
  it('returns fallback for zero velocity', () => {
    expect(directionFromVelocity({ x: 0, y: 0 }, 'left')).toBe('left');
  });

  it('maps cardinal directions', () => {
    expect(directionFromVelocity({ x: 1, y: 0 })).toBe('right');
    expect(directionFromVelocity({ x: -1, y: 0 })).toBe('left');
    expect(directionFromVelocity({ x: 0, y: 1 })).toBe('down');
    expect(directionFromVelocity({ x: 0, y: -1 })).toBe('up');
  });

  it('maps diagonals', () => {
    expect(directionFromVelocity({ x: 1, y: 1 })).toBe('down-right');
    expect(directionFromVelocity({ x: -1, y: 1 })).toBe('down-left');
    expect(directionFromVelocity({ x: 1, y: -1 })).toBe('up-right');
    expect(directionFromVelocity({ x: -1, y: -1 })).toBe('up-left');
  });

  it('rounds to the nearest octant', () => {
    // Slightly more "right" than "down-right"
    expect(directionFromVelocity({ x: 10, y: 1 })).toBe('right');
    // Slightly more "down" than "down-right"
    expect(directionFromVelocity({ x: 1, y: 10 })).toBe('down');
  });
});

