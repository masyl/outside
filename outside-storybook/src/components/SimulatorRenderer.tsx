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

/** Logical size of the SVG viewBox (4x zoom-out vs original 400×300) */
const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 1200;
const PIXELS_PER_TILE = 20;

/** Deterministic 0..1 from seed; same seed + index gives same cloud. */
function seededUnit(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

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
    const maxRadius = entityCount <= 1 ? 0 : 2 + Math.sqrt(entityCount) * 2;
    for (let i = 0; i < entityCount; i++) {
      const t = entityCount <= 1 ? 0 : i / (entityCount - 1);
      const angle = seededUnit(seed, i * 2) * Math.PI * 2;
      const r = Math.sqrt(seededUnit(seed, i * 2 + 1));
      const radius = (0.15 + 0.85 * t) * maxRadius * r;
      spawnBot(world, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        diameter: 1.5,
        directionRad: seededUnit(seed, i * 3) * Math.PI * 2,
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
        entityIds: [
          ...query(world, [
            components.Position,
            components.Size,
            components.Direction,
            components.Speed,
          ]),
        ],
        seed: world.seed,
        ticDurationMs: world.ticDurationMs,
      });
    }, 1000 / ticsPerSecond);
    return () => clearInterval(interval);
  }, [ticsPerSecond]);

  if (!state) return <div>Loading...</div>;

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
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          border: '1px solid #333',
          background: '#1a1a1a',
        }}
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
      <p
        style={{
          margin: 0,
          padding: 8,
          fontSize: 12,
          color: '#888',
          flexShrink: 0,
        }}
      >
        Seed: {state.seed} · Entities: {state.entityIds.length} · Green = normal,
        Red = just collided
      </p>
    </div>
  );
}
