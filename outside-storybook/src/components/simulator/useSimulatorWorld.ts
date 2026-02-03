import { useRef, useState, useEffect, useCallback } from 'react';
import {
  createWorld,
  runTics,
  query,
  drainEventQueue,
  Position,
  Size,
  Direction,
  Speed,
  type CollisionEvent,
} from '@outside/simulator';
import { spawnBotsInWorld } from './spawnCloud';

export interface UseSimulatorWorldResult {
  world: ReturnType<typeof createWorld> | null;
  entityIds: number[];
  collisionEids: Set<number>;
  seed: number;
  ticDurationMs: number;
}

export function useSimulatorWorld(
  seed: number,
  entityCount: number,
  ticsPerSecond: number
): UseSimulatorWorldResult {
  const worldRef = useRef<ReturnType<typeof createWorld> | null>(null);
  const [state, setState] = useState<{
    entityIds: number[];
    seed: number;
    ticDurationMs: number;
  } | null>(null);
  const [collisionEids, setCollisionEids] = useState<Set<number>>(new Set());

  const initWorld = useCallback(() => {
    const world = createWorld({ seed, ticDurationMs: 50 });
    spawnBotsInWorld(world, seed, entityCount);
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

  return {
    world: worldRef.current,
    entityIds: state?.entityIds ?? [],
    collisionEids,
    seed: state?.seed ?? seed,
    ticDurationMs: state?.ticDurationMs ?? 50,
  };
}
