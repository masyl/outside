import {
  getComponent,
  query,
  Position,
  VisualSize,
  Direction,
  Speed,
  Follow,
  FollowTarget,
  Collided,
} from '@outside/simulator';
import { useSimulatorWorld, type SpawnFn } from './simulator/useSimulatorWorld';
import { spawnScatteredWithLeaders } from './simulator/spawnCloud';
import { SimulatorViewport } from './simulator/SimulatorViewport';
import { SimulatorEntity } from './simulator/SimulatorEntity';
import { SimulatorCaption } from './simulator/SimulatorCaption';
import { FloorTilesLayer } from './simulator/FloorTilesLayer';
import { GridOverlay } from './simulator/GridOverlay';

/** Logical size of the SVG viewBox (4x zoom-out vs original 400×300) */
const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 1200;
const PIXELS_PER_TILE = 20;
/** Scale for velocity arrow length (tiles per unit speed). */
const ARROW_SCALE = 1;
/** Arrowhead length and half-width in pixels. */
const ARROW_HEAD_LEN = 8;
const ARROW_HEAD_HALF_W = 4;
/** Max Collided cooldown tics (matches obstacle check interval) for fade. */
const COLLIDED_COOLDOWN_MAX = 2;

/** Viewport bounds in world coordinates (for grid/floor clipping) */
const VIEW_WORLD = {
  xMin: -VIEWBOX_WIDTH / 2 / PIXELS_PER_TILE,
  xMax: VIEWBOX_WIDTH / 2 / PIXELS_PER_TILE,
  yMin: -VIEWBOX_HEIGHT / 2 / PIXELS_PER_TILE,
  yMax: VIEWBOX_HEIGHT / 2 / PIXELS_PER_TILE,
};

interface SimulatorRendererProps {
  seed?: number;
  ticsPerSecond?: number;
  /** Number of entities to spawn */
  entityCount?: number;
  /** Optional custom spawn function (e.g. spawnFollowChain for follow-chain demo). */
  spawnFn?: SpawnFn;
}

/**
 * React + SVG renderer for the headless ECS simulator.
 * Composes useSimulatorWorld (tick loop, state) with presentational Viewport, Entity, and Caption.
 * Draws follow lines (blue) and velocity arrows (orange) when applicable.
 */
export function SimulatorRenderer({
  seed = 42,
  ticsPerSecond = 10,
  entityCount = 5,
  spawnFn,
}: SimulatorRendererProps) {
  const { world, entityIds, collisionEids, seed: stateSeed } = useSimulatorWorld(
    seed,
    entityCount,
    ticsPerSecond,
    spawnFn ?? spawnScatteredWithLeaders
  );

  if (!world) {
    return <div>Loading...</div>;
  }

  const toX = (x: number) => VIEWBOX_WIDTH / 2 + x * PIXELS_PER_TILE;
  const toY = (y: number) => VIEWBOX_HEIGHT / 2 - y * PIXELS_PER_TILE;
  const transform = { toX, toY };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SimulatorViewport viewBoxWidth={VIEWBOX_WIDTH} viewBoxHeight={VIEWBOX_HEIGHT}>
        {/* Floor tiles (dark grey squares, under grid and entities) */}
        <FloorTilesLayer
          world={world}
          transform={transform}
          pixelsPerTile={PIXELS_PER_TILE}
        />
        {/* Grid lines (viewport-clipped; floorTiles 30% white solid, subPositionSnap 10% dotted) */}
        <GridOverlay world={world} bounds={VIEW_WORLD} transform={transform} />
        {/* Follow lines: follower → target */}
        {Array.from(query(world, [Follow, FollowTarget])).map((eid) => {
          const pos = getComponent(world, eid, Position);
          const targetEid = getComponent(world, eid, FollowTarget).eid;
          const targetPos = getComponent(world, targetEid, Position);
          if (targetPos == null) return null;
          return (
            <line
              key={`follow-${eid}`}
              x1={toX(pos.x)}
              y1={toY(pos.y)}
              x2={toX(targetPos.x)}
              y2={toY(targetPos.y)}
              stroke="#6af"
              strokeWidth={1}
              strokeOpacity={0.8}
            />
          );
        })}
        {/* Velocity arrows (line + pointy arrowhead at tip) */}
        {entityIds.map((eid) => {
          const pos = getComponent(world, eid, Position);
          const dir = getComponent(world, eid, Direction);
          const speed = getComponent(world, eid, Speed);
          const cx = toX(pos.x);
          const cy = toY(pos.y);
          const len = speed.tilesPerSec * PIXELS_PER_TILE * ARROW_SCALE;
          const cos = Math.cos(dir.angle);
          const sin = Math.sin(dir.angle);
          const ex = cx + cos * len;
          const ey = cy - sin * len;
          const tipX = ex;
          const tipY = ey;
          const backX = ex - cos * ARROW_HEAD_LEN;
          const backY = ey + sin * ARROW_HEAD_LEN;
          const leftX = backX + sin * ARROW_HEAD_HALF_W;
          const leftY = backY + cos * ARROW_HEAD_HALF_W;
          const rightX = backX - sin * ARROW_HEAD_HALF_W;
          const rightY = backY - cos * ARROW_HEAD_HALF_W;
          const arrowPoints = `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
          return (
            <g key={`arrow-${eid}`}>
              <line
                x1={cx}
                y1={cy}
                x2={backX}
                y2={backY}
                stroke="#fc6"
                strokeWidth={1.5}
                strokeOpacity={0.9}
              />
              <polygon
                points={arrowPoints}
                fill="#fc6"
                fillOpacity={0.9}
                stroke="none"
              />
            </g>
          );
        })}
        {entityIds.map((eid) => {
          const pos = getComponent(world, eid, Position);
          const visualSize = getComponent(world, eid, VisualSize);
          const inCollision = collisionEids.has(eid);
          const collidedComp = getComponent(world, eid, Collided);
          const collidedTicks = collidedComp?.ticksRemaining ?? 0;
          const inCollidedCooldown = collidedTicks > 0;
          const collidedOpacity =
            inCollidedCooldown ? collidedTicks / COLLIDED_COOLDOWN_MAX : 0;
          const fill =
            inCollidedCooldown
              ? '#44f'
              : inCollision
                ? '#f44'
                : '#4a4';
          const stroke =
            inCollidedCooldown
              ? '#88f'
              : inCollision
                ? '#f88'
                : '#6c6';
          return (
            <SimulatorEntity
              key={eid}
              cx={toX(pos.x)}
              cy={toY(pos.y)}
              r={(visualSize.diameter / 2) * PIXELS_PER_TILE}
              fill={fill}
              fillOpacity={inCollidedCooldown ? collidedOpacity : 1}
              stroke={stroke}
              strokeOpacity={inCollidedCooldown ? collidedOpacity : 1}
            />
          );
        })}
      </SimulatorViewport>
      <SimulatorCaption seed={stateSeed} entityCount={entityIds.length} />
    </div>
  );
}
