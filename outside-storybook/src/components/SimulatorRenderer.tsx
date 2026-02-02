import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  createWorld,
  spawnBot,
  runTics,
  query,
  getComponent,
  drainEventQueue,
  Position,
  Size,
  Direction,
  Speed,
  type CollisionEvent,
} from '@outside/simulator';

const SVG_WIDTH = 400;
const SVG_HEIGHT = 300;
const PIXELS_PER_TILE = 20;

interface SimulatorRendererProps {
  seed?: number;
  ticsPerSecond?: number;
  /** Number of random-walk entities to spawn */
  entityCount?: number;
}

/**
 * React + SVG renderer for the headless ECS simulator.
 * Runs tics on a timer, renders entities as circles, and highlights entities on collision (color change).
 */
export function SimulatorRenderer({
  seed = 42,
  ticsPerSecond = 10,
  entityCount = 5,
}: SimulatorRendererProps) {
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const [state, setState] = useState<{
    entityIds: number[];
    seed: number;
    ticDurationMs: number;
  } | null>(null);
  const [collisionEids, setCollisionEids] = useState<Set<number>>(new Set());

  const initWorld = useCallback(() => {
    const world = createWorld({ seed, ticDurationMs: 50 });
    for (let i = 0; i < entityCount; i++) {
      spawnBot(world, {
        x: (i - entityCount / 2) * 3,
        y: (i % 2) * 2 - 1,
        diameter: 1.5,
        directionRad: (i / entityCount) * Math.PI * 2,
        tilesPerSec: 0.5 + (i % 3) * 0.3,
      });
    }
    worldRef.current = world;
    setState({
      entityIds: [...query(world, [Position, Size, Direction, Speed])],
      seed: world.seed,
      ticDurationMs: world.ticDurationMs,
    });
    setCollisionEids(new Set());
  }, [seed, entityCount]);

  useEffect(() => {
    initWorld();
  }, [initWorld]);

  useEffect(() => {
    if (!worldRef.current) return;
    const interval = setInterval(() => {
      const world = worldRef.current!;
      runTics(world, 1);
      const events = drainEventQueue(world);
      const eids = new Set<number>();
      events.forEach((ev: CollisionEvent) => {
        if (ev.type === 'collision') {
          eids.add(ev.entityA);
          eids.add(ev.entityB);
        }
      });
      setCollisionEids(eids);
      setState({
        entityIds: [...query(world, [Position, Size, Direction, Speed])],
        seed: world.seed,
        ticDurationMs: world.ticDurationMs,
      });
    }, 1000 / ticsPerSecond);
    return () => clearInterval(interval);
  }, [ticsPerSecond]);

  if (!state) return <div>Loading...</div>;

  const toX = (x: number) => SVG_WIDTH / 2 + x * PIXELS_PER_TILE;
  const toY = (y: number) => SVG_HEIGHT / 2 - y * PIXELS_PER_TILE;

  return (
    <div>
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        style={{ border: '1px solid #333', background: '#1a1a1a' }}
      >
        {worldRef.current &&
          state.entityIds.map((eid) => {
            const world = worldRef.current!;
            const pos = getComponent(world, eid, Position);
            const size = getComponent(world, eid, Size);
            const inCollision = collisionEids.has(eid);
            return (
              <circle
                key={eid}
                cx={toX(pos.x)}
                cy={toY(pos.y)}
                r={(size.diameter / 2) * PIXELS_PER_TILE}
                fill={inCollision ? '#f44' : '#4a4'}
                stroke={inCollision ? '#f88' : '#6c6'}
                strokeWidth={2}
              />
            );
          })}
      </svg>
      <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
        Seed: {state.seed} · Entities: {state.entityIds.length} · Green = normal,
        Red = just collided
      </p>
    </div>
  );
}
