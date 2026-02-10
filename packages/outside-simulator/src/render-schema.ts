/**
 * Render schema for simulation-to-renderer sync.
 * @packageDocumentation
 */

import {
  ActualSpeed,
  Observed,
  Position,
  VisualSize,
  Size,
  Direction,
  Speed,
  TargetPace,
  WalkingSpeed,
  RunningSpeed,
  PositionZ,
  VelocityZ,
  Grounded,
  PreviousPosition,
  DefaultSpriteKey,
  VariantSpriteKey,
  Follow,
  FollowTarget,
  Collided,
  FloorTile,
  Walkable,
  Obstacle,
  ObstacleSize,
  Food,
  Hero,
  WanderPersistence,
} from './components';

export const RENDER_COMPONENTS = [
  ActualSpeed,
  Position,
  VisualSize,
  Size,
  Direction,
  Speed,
  TargetPace,
  WalkingSpeed,
  RunningSpeed,
  PositionZ,
  VelocityZ,
  Grounded,
  PreviousPosition,
  DefaultSpriteKey,
  VariantSpriteKey,
  Follow,
  FollowTarget,
  Collided,
  FloorTile,
  Walkable,
  Obstacle,
  ObstacleSize,
  Food,
  Hero,
  WanderPersistence,
] as const;

/**
 * Snapshot schema for render-world bootstrap.
 * Includes Observed so observer deltas can apply add/remove lifecycle consistently.
 */
export const RENDER_SNAPSHOT_COMPONENTS = [Observed, ...RENDER_COMPONENTS] as const;
