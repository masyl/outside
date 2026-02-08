import {
  query,
  getComponent,
  Position,
  Size,
  FloorTile,
  Obstacle,
  Collided,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';

export interface ViewTransform {
  toX: (x: number) => number;
  toY: (y: number) => number;
}

export interface FloorTilesLayerProps {
  world: SimulatorWorld;
  transform: ViewTransform;
  /** Pixels per world unit (tile); must match SimulatorRenderer PIXELS_PER_TILE */
  pixelsPerTile: number;
}

const FLOOR_FILL = '#2a2a2a';
const WALL_FILL = '#888';
/** Wall fill when recently hit by a bot (fades over cooldown). */
const WALL_COLLIDED_FILL = '#6af';
const COLLIDED_COOLDOWN_MAX = 2;

/**
 * Renders floor tiles as squares (Position = bottom-left, Size = cell).
 * Walls (FloorTile + Obstacle) = light grey; floor only = dark grey.
 * Walls with Collided cooldown = blue tint, opacity fades 100% to 0%.
 * Draw under grid lines and entities (call first in SVG order).
 */
export function FloorTilesLayer({
  world,
  transform,
  pixelsPerTile,
}: FloorTilesLayerProps) {
  const tiles = query(world, [Position, Size, FloorTile]);
  const obstacleSet = new Set(query(world, [Obstacle]));
  return (
    <g aria-hidden="true">
      {Array.from(tiles).map((eid) => {
        const pos = getComponent(world, eid, Position);
        const size = getComponent(world, eid, Size);
        const w = size.diameter;
        const h = size.diameter;
        const left = transform.toX(pos.x);
        const top = transform.toY(pos.y + h);
        const widthPx = w * pixelsPerTile;
        const heightPx = h * pixelsPerTile;
        const isWall = obstacleSet.has(eid);
        const collidedComp = getComponent(world, eid, Collided);
        const collidedTicks = collidedComp?.ticksRemaining ?? 0;
        const inCollidedCooldown = collidedTicks > 0;
        const baseFill = isWall ? WALL_FILL : FLOOR_FILL;
        const fill = inCollidedCooldown && isWall ? WALL_COLLIDED_FILL : baseFill;
        const fillOpacity =
          inCollidedCooldown && isWall
            ? collidedTicks / COLLIDED_COOLDOWN_MAX
            : 1;
        return (
          <rect
            key={eid}
            x={left}
            y={top}
            width={widthPx}
            height={heightPx}
            fill={fill}
            fillOpacity={fillOpacity}
            stroke="none"
          />
        );
      })}
    </g>
  );
}
