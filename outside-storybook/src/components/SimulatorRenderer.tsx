import {
  getComponent,
  query,
  Position,
  Size,
  Direction,
  Speed,
  Follow,
  FollowTarget,
} from '@outside/simulator';
import { useSimulatorWorld, type SpawnFn } from './simulator/useSimulatorWorld';
import { spawnScatteredWithLeaders } from './simulator/spawnCloud';
import { SimulatorViewport } from './simulator/SimulatorViewport';
import { SimulatorEntity } from './simulator/SimulatorEntity';
import { SimulatorCaption } from './simulator/SimulatorCaption';

/** Logical size of the SVG viewBox (4x zoom-out vs original 400×300) */
const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 1200;
const PIXELS_PER_TILE = 20;
/** Scale for velocity arrow length (tiles per unit speed). */
const ARROW_SCALE = 2;

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
        {/* Follow lines: follower → target */}
        {query(world, [Follow, FollowTarget]).map((eid) => {
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
        {/* Velocity arrows */}
        {entityIds.map((eid) => {
          const pos = getComponent(world, eid, Position);
          const dir = getComponent(world, eid, Direction);
          const speed = getComponent(world, eid, Speed);
          const cx = toX(pos.x);
          const cy = toY(pos.y);
          const len = speed.tilesPerSec * PIXELS_PER_TILE * ARROW_SCALE;
          const ex = cx + Math.cos(dir.angle) * len;
          const ey = cy - Math.sin(dir.angle) * len;
          return (
            <line
              key={`arrow-${eid}`}
              x1={cx}
              y1={cy}
              x2={ex}
              y2={ey}
              stroke="#fc6"
              strokeWidth={1.5}
              strokeOpacity={0.9}
            />
          );
        })}
        {entityIds.map((eid) => {
          const pos = getComponent(world, eid, Position);
          const size = getComponent(world, eid, Size);
          const inCollision = collisionEids.has(eid);
          return (
            <SimulatorEntity
              key={eid}
              cx={toX(pos.x)}
              cy={toY(pos.y)}
              r={(size.diameter / 2) * PIXELS_PER_TILE}
              fill={inCollision ? '#f44' : '#4a4'}
              stroke={inCollision ? '#f88' : '#6c6'}
            />
          );
        })}
      </SimulatorViewport>
      <SimulatorCaption seed={stateSeed} entityCount={entityIds.length} />
    </div>
  );
}
