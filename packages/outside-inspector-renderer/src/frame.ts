import {
  Collided,
  Direction,
  FloorTile,
  Follow,
  FollowTarget,
  Food,
  Hero,
  Observed,
  Obstacle,
  Position,
  Speed,
  Size,
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
  x: number;
  y: number;
  diameter: number;
  kind: InspectorEntityKind;
  directionRad: number | null;
  speedTilesPerSec: number | null;
  inCollidedCooldown: boolean;
  collidedTicksRemaining: number;
}

export interface InspectorFollowLink {
  followerEid: number;
  targetEid: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface InspectorFrame {
  tiles: InspectorTile[];
  entities: InspectorEntity[];
  followLinks: InspectorFollowLink[];
  collisionEntityCount: number;
  collisionTileCount: number;
  followLinkCount: number;
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
  let unknownCount = 0;
  let collisionEntityCount = 0;
  let collisionTileCount = 0;

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
    const speedTilesPerSec = hasComponent(world, eid, Speed) ? (Speed.tilesPerSec[eid] ?? 0) : null;
    const collidedTicksRemaining = hasComponent(world, eid, Collided)
      ? (Collided.ticksRemaining[eid] ?? 0)
      : 0;
    const inCollidedCooldown = collidedTicksRemaining > 0;
    if (inCollidedCooldown) {
      collisionEntityCount += 1;
    }

    entities.push({
      eid,
      x,
      y,
      diameter,
      kind,
      directionRad,
      speedTilesPerSec,
      inCollidedCooldown,
      collidedTicksRemaining,
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
    collisionEntityCount,
    collisionTileCount,
    followLinkCount: followLinks.length,
    unknownCount,
  };
}
