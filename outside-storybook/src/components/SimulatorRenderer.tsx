import { getComponent, Position, Size } from '@outside/simulator';
import { useSimulatorWorld } from './simulator/useSimulatorWorld';
import { SimulatorViewport } from './simulator/SimulatorViewport';
import { SimulatorEntity } from './simulator/SimulatorEntity';
import { SimulatorCaption } from './simulator/SimulatorCaption';

/** Logical size of the SVG viewBox (4x zoom-out vs original 400×300) */
const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 1200;
const PIXELS_PER_TILE = 20;

interface SimulatorRendererProps {
  seed?: number;
  ticsPerSecond?: number;
  /** Number of random-walk entities to spawn */
  entityCount?: number;
}

/**
 * React + SVG renderer for the headless ECS simulator.
 * Composes useSimulatorWorld (tick loop, state) with presentational Viewport, Entity, and Caption.
 */
export function SimulatorRenderer({
  seed = 42,
  ticsPerSecond = 10,
  entityCount = 5,
}: SimulatorRendererProps) {
  const { world, entityIds, collisionEids, seed: stateSeed } = useSimulatorWorld(
    seed,
    entityCount,
    ticsPerSecond
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
