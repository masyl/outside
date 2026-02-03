import { describe, it, expect } from 'vitest';
import {
  createWorld,
  runTics,
  query,
  getComponent,
  spawnBot,
  drainEventQueue,
  configureTicDurationMs,
  Position,
  Size,
  Direction,
  Speed,
} from './index';

describe('Simulator API', () => {
  it('should create world and spawn entity', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0, diameter: 1 });
    const entities = query(world, [Position, Size, Direction, Speed]);
    expect(entities).toHaveLength(1);
    expect(getComponent(world, entities[0], Position).x).toBe(0);
    expect(getComponent(world, entities[0], Position).y).toBe(0);
    expect(getComponent(world, entities[0], Size).diameter).toBe(1);
    expect(world.seed).toBe(42);
    expect(world.ticDurationMs).toBe(50);
  });

  it('should run tics and update positions', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 1000 });
    spawnBot(world, { x: 0, y: 0 }); // Wander (default) sets direction/speed each tic
    runTics(world, 1);
    const entities = query(world, [Position, Size, Direction, Speed]);
    const pos = getComponent(world, entities[0], Position);
    const dist = Math.hypot(pos.x, pos.y);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThanOrEqual(2.1); // max ~2 tps * 1 sec
  });

  it('should emit collision events when entities overlap', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    const a = spawnBot(world, { x: 0, y: 0, diameter: 2 });
    const b = spawnBot(world, { x: 1, y: 0, diameter: 2 }); // distance 1, radii 1+1=2 => overlap
    runTics(world, 1);
    const events = drainEventQueue(world);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('collision');
    expect(
      (events[0].entityA === a && events[0].entityB === b) ||
        (events[0].entityA === b && events[0].entityB === a)
    ).toBe(true);
  });

  it('should drain event queue and clear it', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0, diameter: 2 });
    spawnBot(world, { x: 1, y: 0, diameter: 2 });
    runTics(world, 1);
    const first = drainEventQueue(world);
    expect(first).toHaveLength(1);
    const second = drainEventQueue(world);
    expect(second).toHaveLength(0);
  });

  it('should respect configureTicDurationMs', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 1000 });
    configureTicDurationMs(world, 500);
    expect(world.ticDurationMs).toBe(500);
    spawnBot(world, { x: 0, y: 0 });
    runTics(world, 1);
    const entities = query(world, [Position, Size, Direction, Speed]);
    const pos = getComponent(world, entities[0], Position);
    expect(Math.hypot(pos.x, pos.y)).toBeGreaterThan(0); // entity moved (Wander)
  });
});
