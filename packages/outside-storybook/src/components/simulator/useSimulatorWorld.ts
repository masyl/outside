import { useRef, useState, useEffect, useCallback } from 'react';
import {
  createWorld,
  runTics,
  query,
  drainEventQueue,
  Position,
  VisualSize,
  Direction,
  Speed,
  type CollisionEvent,
} from '@outside/simulator';
import { spawnScatteredWithLeaders } from './spawnCloud';

export type SpawnFn = (
  world: ReturnType<typeof createWorld>,
  seed: number,
  entityCount: number,
  spawnOptions?: {
    botCount?: number;
    foodCount?: number;
    dogCount?: number;
    catCount?: number;
  }
) => void;

export interface UseSimulatorWorldResult {
  world: ReturnType<typeof createWorld> | null;
  entityIds: number[];
  collisionEids: Set<number>;
  seed: number;
  ticDurationMs: number;
  /** Call after mutating world or pointer state to force re-render. */
  invalidate: () => void;
}

export function useSimulatorWorld(
  seed: number,
  entityCount: number,
  ticsPerSecond: number,
  spawnFn: SpawnFn = spawnScatteredWithLeaders
): UseSimulatorWorldResult {
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const [state, setState] = useState<{
    entityIds: number[];
    seed: number;
    ticDurationMs: number;
  } | null>(null);
  const [collisionEids, setCollisionEids] = useState<Set<number>>(new Set());
  const [, setVersion] = useState(0);
  const invalidate = useCallback(() => setVersion((v) => v + 1), []);

  const initWorld = useCallback(() => {
    const world = createWorld({ seed, ticDurationMs: 50 });
    spawnFn(world, seed, entityCount);
    worldRef.current = world;
    setState({
      entityIds: [...query(world, [Position, VisualSize, Direction, Speed])],
      seed: world.seed,
      ticDurationMs: world.ticDurationMs,
    });
    setCollisionEids(new Set());
  }, [seed, entityCount, spawnFn]);

  useEffect(() => {
    initWorld();
  }, [initWorld]);

  useEffect(() => {
    if (!worldRef.current) return;
    const ticDurationMs = worldRef.current.ticDurationMs;
    const intervalMs = 1000 / ticsPerSecond;
    let accumulatedMs = 0;
    const interval = setInterval(() => {
      const world = worldRef.current!;
      accumulatedMs += intervalMs;
      let ticsToRun = 0;
      while (accumulatedMs >= ticDurationMs) {
        accumulatedMs -= ticDurationMs;
        ticsToRun += 1;
      }
      if (ticsToRun > 0) {
        runTics(world, ticsToRun);
      }
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
        entityIds: [...query(world, [Position, VisualSize, Direction, Speed])],
        seed: world.seed,
        ticDurationMs: world.ticDurationMs,
      });
    }, intervalMs);
    return () => clearInterval(interval);
  }, [ticsPerSecond]);

  return {
    world: worldRef.current,
    entityIds: state?.entityIds ?? [],
    collisionEids,
    seed: state?.seed ?? seed,
    ticDurationMs: state?.ticDurationMs ?? 50,
    invalidate,
  };
}
