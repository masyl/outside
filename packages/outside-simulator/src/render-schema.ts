/**
 * Render schema for simulation-to-renderer sync.
 * @packageDocumentation
 */

import {
  Observed,
  Position,
  VisualSize,
  Size,
  Direction,
  Speed,
  PreviousPosition,
  DefaultSpriteKey,
  VariantSpriteKey,
  Follow,
  FollowTarget,
  Collided,
  FloorTile,
  Walkable,
  Obstacle,
  Food,
  Hero,
} from './components';

export const RENDER_COMPONENTS = [
  Position,
  VisualSize,
  Size,
  Direction,
  Speed,
  PreviousPosition,
  DefaultSpriteKey,
  VariantSpriteKey,
  Follow,
  FollowTarget,
  Collided,
  FloorTile,
  Walkable,
  Obstacle,
  Food,
  Hero,
] as const;

/**
 * Snapshot schema for render-world bootstrap.
 * Includes Observed so observer deltas can apply add/remove lifecycle consistently.
 */
export const RENDER_SNAPSHOT_COMPONENTS = [Observed, ...RENDER_COMPONENTS] as const;
