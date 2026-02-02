import { describe, it, expect } from 'vitest';
import {
  createWorld,
  addSimEntity,
  addMovementComponents,
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
    spawnBot(world, { x: 0, y: 0, directionRad: 0, tilesPerSec: 1 });
    runTics(world, 1);
    const entities = query(world, [Position, Size, Direction, Speed]);
    expect(getComponent(world, entities[0], Position).x).toBeCloseTo(1);
    expect(getComponent(world, entities[0], Position).y).toBeCloseTo(0);
  });

  it('should emit collision events when entities overlap', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    const a = addSimEntity(world);
    addMovementComponents(world, a, 0, 0, 2, 0, 0);
    const b = addSimEntity(world);
    addMovementComponents(world, b, 1, 0, 2, 0, 0); // distance 1, radii 1+1=2 => overlap
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
    const a = addSimEntity(world);
    addMovementComponents(world, a, 0, 0, 2, 0, 0);
    const b = addSimEntity(world);
    addMovementComponents(world, b, 1, 0, 2, 0, 0);
    runTics(world, 1);
    const first = drainEventQueue(world);
    expect(first).toHaveLength(1);
    const second = drainEventQueue(world);
    expect(second).toHaveLength(0);
  });

  it('should respect configureTicDurationMs', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 1000 });
    configureTicDurationMs(world, 500);
    spawnBot(world, { tilesPerSec: 1 });
    runTics(world, 1);
    const entities = query(world, [Position, Size, Direction, Speed]);
    expect(getComponent(world, entities[0], Position).x).toBeCloseTo(0.5); // 1 tile/sec * 0.5 sec
  });
});
