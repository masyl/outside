/**
 * Render schema for simulation-to-renderer sync.
 * @packageDocumentation
 */

import {
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
