import {
  ActualSpeed,
  Collided,
  Direction,
  FloorTile,
  Follow,
  FollowTarget,
  Food,
  Grounded,
  Hero,
  Observed,
  Obstacle,
  ObstacleSize,
  Position,
  PositionZ,
  Speed,
  Size,
  TargetPace,
  WalkingSpeed,
  RunningSpeed,
  TARGET_PACE_RUNNING,
  TARGET_PACE_RUNNING_FAST,
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  TARGET_PACE_WALKING_SLOW,
  DefaultSpriteKey,
  VariantSpriteKey,
  VisualSize,
} from '@outside/simulator';
import { hasComponent, query, type World } from 'bitecs';

export type InspectorTileKind = 'floor' | 'wall';
export type InspectorEntityKind = 'bot' | 'hero' | 'food' | 'unknown';

export interface InspectorTile {
  eid: number;
  x: number;
  y: number;
  size: number;
  kind: InspectorTileKind;
  inCollidedCooldown: boolean;
  collidedTicksRemaining: number;
}

export interface InspectorEntity {
  eid: number;
  prefabName: string;
  x: number;
  y: number;
  /** Visual sprite diameter used for normal entity rendering. */
  diameter: number;
  /** Physics collider shape rendered in debug overlay. */
  physicsShape: 'circle' | 'box';
  /** Physics collider size in tiles (circle diameter or box side length). */
  physicsDiameter: number;
  kind: InspectorEntityKind;
  directionRad: number | null;
  speedTilesPerSec: number | null;
  targetSpeedTilesPerSec: number | null;
  targetPaceLabel?:
    | 'standingStill'
    | 'walking'
    | 'running'
    | 'walkSlow'
    | 'runFast'
    | 'unknown';
  inCollidedCooldown: boolean;
  collidedTicksRemaining: number;
  zLiftTiles: number;
  isAirborne: boolean;
}

export interface InspectorFollowLink {
  followerEid: number;
  targetEid: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface InspectorPathfindingPath {
  eid: number;
  points: Array<{ x: number; y: number }>;
  checkpoints?: Array<{ x: number; y: number }>;
  style?: 'ordered' | 'wander';
}

export interface InspectorFrame {
  tiles: InspectorTile[];
  entities: InspectorEntity[];
  followLinks: InspectorFollowLink[];
  pathfindingPaths: InspectorPathfindingPath[];
  collisionEntityCount: number;
  collisionTileCount: number;
  followLinkCount: number;
  pathfindingPathCount: number;
  unknownCount: number;
}

/**
 * Builds immutable render primitives from the inspector ECS world.
 *
 * @param world - Render world populated by stream packets.
 * @returns Frame primitives for SVG/React rendering.
 */
export function buildInspectorFrame(world: World): InspectorFrame {
  const eids = query(world, [Observed, Position]);
  const tiles: InspectorTile[] = [];
  const entities: InspectorEntity[] = [];
  const followLinks: InspectorFollowLink[] = [];
  const pathfindingPaths: InspectorPathfindingPath[] = [];
  let unknownCount = 0;
  let collisionEntityCount = 0;
  let collisionTileCount = 0;

  function paceLabelFromValue(
    value: number
  ): 'standingStill' | 'walking' | 'running' | 'walkSlow' | 'runFast' | 'unknown' {
    if (value === TARGET_PACE_STANDING_STILL) return 'standingStill';
    if (value === TARGET_PACE_WALKING) return 'walking';
    if (value === TARGET_PACE_RUNNING) return 'running';
    if (value === TARGET_PACE_WALKING_SLOW) return 'walkSlow';
    if (value === TARGET_PACE_RUNNING_FAST) return 'runFast';
    return 'unknown';
  }

  function shortPrefabName(value: string): string {
    if (!value) return 'unknown';
    const trimmed = value.trim();
    if (!trimmed) return 'unknown';
    const parts = trimmed.split('.');
    const last = parts[parts.length - 1];
    return last && last.length > 0 ? last : trimmed;
  }

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    if (hasComponent(world, eid, FloorTile)) {
      const size = hasComponent(world, eid, Size) ? (Size.diameter[eid] ?? 1) : 1;
      const kind: InspectorTileKind = hasComponent(world, eid, Obstacle) ? 'wall' : 'floor';
      const collidedTicksRemaining = hasComponent(world, eid, Collided)
        ? (Collided.ticksRemaining[eid] ?? 0)
        : 0;
      const inCollidedCooldown = collidedTicksRemaining > 0;
      if (inCollidedCooldown) {
        collisionTileCount += 1;
      }
      tiles.push({
        eid,
        x,
        y,
        size,
        kind,
        inCollidedCooldown,
        collidedTicksRemaining,
      });
      continue;
    }

    const diameter = hasComponent(world, eid, VisualSize)
      ? (VisualSize.diameter[eid] ?? 1)
      : hasComponent(world, eid, Size)
        ? (Size.diameter[eid] ?? 1)
        : 1;

    const physicsShape: 'circle' | 'box' = hasComponent(world, eid, Food)
      ? 'box'
      : 'circle';
    const physicsDiameter = hasComponent(world, eid, Food)
      ? Math.max(0.2, Size.diameter[eid] || 0.5) * 0.5
      : hasComponent(world, eid, ObstacleSize)
        ? Math.max(0.3, ObstacleSize.diameter[eid] || 0.6)
        : hasComponent(world, eid, Size)
          ? (Size.diameter[eid] ?? diameter)
          : diameter;

    let kind: InspectorEntityKind = 'unknown';
    if (hasComponent(world, eid, Hero)) {
      kind = 'hero';
    } else if (hasComponent(world, eid, Food)) {
      kind = 'food';
    } else if (!hasComponent(world, eid, FloorTile)) {
      kind = 'bot';
    }
    if (kind === 'unknown') unknownCount += 1;
    const directionRad = hasComponent(world, eid, Direction) ? (Direction.angle[eid] ?? 0) : null;
    const defaultSpriteKey = hasComponent(world, eid, DefaultSpriteKey)
      ? (DefaultSpriteKey.value[eid] ?? '')
      : '';
    const variantSpriteKey = hasComponent(world, eid, VariantSpriteKey)
      ? (VariantSpriteKey.value[eid] ?? '')
      : '';
    const prefabName =
      variantSpriteKey && variantSpriteKey.length > 0
        ? shortPrefabName(variantSpriteKey)
        : shortPrefabName(defaultSpriteKey);
    const speedTilesPerSec = hasComponent(world, eid, ActualSpeed)
      ? (ActualSpeed.tilesPerSec[eid] ?? 0)
      : hasComponent(world, eid, Speed)
        ? (Speed.tilesPerSec[eid] ?? 0)
        : null;
    const targetPaceValue = hasComponent(world, eid, TargetPace)
      ? (TargetPace.value[eid] ?? TARGET_PACE_STANDING_STILL)
      : TARGET_PACE_STANDING_STILL;
    const targetSpeedTilesPerSec =
      kind === 'bot'
        ? targetPaceValue === TARGET_PACE_RUNNING
          ? Math.max(0, RunningSpeed.tilesPerSec[eid] ?? 0)
          : targetPaceValue === TARGET_PACE_RUNNING_FAST
            ? Math.max(0, (WalkingSpeed.tilesPerSec[eid] ?? 0) * 2)
            : targetPaceValue === TARGET_PACE_WALKING
              ? Math.max(0, WalkingSpeed.tilesPerSec[eid] ?? 0)
              : targetPaceValue === TARGET_PACE_WALKING_SLOW
                ? Math.max(0, (WalkingSpeed.tilesPerSec[eid] ?? 0) * 0.5)
                : 0
        : null;
    const targetPaceLabel =
      kind === 'bot' && hasComponent(world, eid, TargetPace)
        ? paceLabelFromValue(targetPaceValue)
        : undefined;
    const collidedTicksRemaining = hasComponent(world, eid, Collided)
      ? (Collided.ticksRemaining[eid] ?? 0)
      : 0;
    const inCollidedCooldown = collidedTicksRemaining > 0;
    if (inCollidedCooldown) {
      collisionEntityCount += 1;
    }
    const z = hasComponent(world, eid, PositionZ) ? (PositionZ.z[eid] ?? 0) : 0;
    const baseHeight =
      hasComponent(world, eid, ObstacleSize)
        ? Math.max(0, (ObstacleSize.diameter[eid] ?? 0) * 0.5)
        : hasComponent(world, eid, Size)
          ? Math.max(0, (Size.diameter[eid] ?? 0) * 0.5)
          : 0;
    const zLiftTiles = Math.max(0, z - baseHeight);
    const grounded = hasComponent(world, eid, Grounded) ? (Grounded.value[eid] ?? 1) : 1;
    const isAirborne = grounded <= 0 || zLiftTiles > 0.01;

    entities.push({
      eid,
      prefabName,
      x,
      y,
      diameter,
      physicsShape,
      physicsDiameter,
      kind,
      directionRad,
      speedTilesPerSec,
      targetSpeedTilesPerSec,
      targetPaceLabel,
      inCollidedCooldown,
      collidedTicksRemaining,
      zLiftTiles,
      isAirborne,
    });
  }

  const followers = query(world, [Observed, Position, Follow, FollowTarget]);
  for (let i = 0; i < followers.length; i++) {
    const followerEid = followers[i];
    const targetEid = FollowTarget.eid[followerEid];
    if (!Number.isFinite(targetEid) || targetEid < 0) continue;
    if (!hasComponent(world, targetEid, Position)) continue;

    followLinks.push({
      followerEid,
      targetEid,
      fromX: Position.x[followerEid],
      fromY: Position.y[followerEid],
      toX: Position.x[targetEid],
      toY: Position.y[targetEid],
    });
  }

  return {
    tiles,
    entities,
    followLinks,
    pathfindingPaths,
    collisionEntityCount,
    collisionTileCount,
    followLinkCount: followLinks.length,
    pathfindingPathCount: pathfindingPaths.length,
    unknownCount,
  };
}
