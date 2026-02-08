import {
  FloorTile,
  Food,
  Hero,
  Obstacle,
  Position,
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
}

export interface InspectorEntity {
  eid: number;
  x: number;
  y: number;
  diameter: number;
  kind: InspectorEntityKind;
}

export interface InspectorFrame {
  tiles: InspectorTile[];
  entities: InspectorEntity[];
  unknownCount: number;
}

/**
 * Builds immutable render primitives from the inspector ECS world.
 *
 * @param world - Render world populated by stream packets.
 * @returns Frame primitives for SVG/React rendering.
 */
export function buildInspectorFrame(world: World): InspectorFrame {
  const eids = query(world, [Position]);
  const tiles: InspectorTile[] = [];
  const entities: InspectorEntity[] = [];
  let unknownCount = 0;

  for (let i = 0; i < eids.length; i++) {
    const eid = eids[i];
    const x = Position.x[eid];
    const y = Position.y[eid];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

    if (hasComponent(world, eid, FloorTile)) {
      const size = hasComponent(world, eid, Size) ? (Size.diameter[eid] ?? 1) : 1;
      const kind: InspectorTileKind = hasComponent(world, eid, Obstacle) ? 'wall' : 'floor';
      tiles.push({ eid, x, y, size, kind });
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

    entities.push({ eid, x, y, diameter, kind });
  }

  return { tiles, entities, unknownCount };
}
