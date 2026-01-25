import type { Direction } from '@outside/core';

export type Vector2 = { x: number; y: number };

/**
 * Convert a velocity vector into an 8-way `Direction`.
 *
 * Coordinate system:
 * - +x = right
 * - +y = down
 *
 * Returns `fallback` when the vector has no magnitude.
 */
export function directionFromVelocity(velocity: Vector2, fallback: Direction = 'down'): Direction {
  const { x, y } = velocity;
  if (x === 0 && y === 0) return fallback;

  const angle = Math.atan2(y, x); // -π..π (y positive is down)
  const octant = Math.round(angle / (Math.PI / 4));
  const idx = ((octant % 8) + 8) % 8;

  const DIRS: Direction[] = [
    'right',
    'down-right',
    'down',
    'down-left',
    'left',
    'up-left',
    'up',
    'up-right',
  ];

  return DIRS[idx];
}

