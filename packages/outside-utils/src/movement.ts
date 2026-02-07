/**
 * Movement and time utilities for fixed-step simulation.
 * Distance per tic is derived from speed (tiles per second) and tic duration (ms).
 *
 * @packageDocumentation
 */

/**
 * Position in world space (same shape as outside-core Position).
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Computes distance (in tiles) moved in one tic given speed and tic duration.
 *
 * @param speedTilesPerSec - Speed in tiles per second
 * @param ticDurationMs - Duration of one tic in milliseconds
 * @returns Distance in tiles per tic
 */
export function distancePerTic(
  speedTilesPerSec: number,
  ticDurationMs: number
): number {
  return speedTilesPerSec * (ticDurationMs / 1000);
}

/**
 * Steps a position by a given distance along a direction (angle in radians).
 *
 * @param position - Current position
 * @param directionRad - Direction in radians (0 = right, π/2 = down)
 * @param distance - Distance to move in tiles
 * @returns New position (same interface as Position)
 */
export function stepPosition(
  position: Position,
  directionRad: number,
  distance: number
): Position {
  return {
    x: position.x + Math.cos(directionRad) * distance,
    y: position.y + Math.sin(directionRad) * distance,
  };
}
