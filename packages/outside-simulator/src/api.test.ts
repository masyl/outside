import { describe, it, expect } from 'vitest';
import {
  createWorld,
  runTics,
  query,
  getComponent,
  spawnBot,
  spawnFood,
  drainEventQueue,
  configureTicDurationMs,
  configurePhysics3dRuntimeMode,
  Position,
  VisualSize,
  Direction,
  Speed,
  Food,
} from './index';

describe('Simulator API', () => {
  it('should create world and spawn entity', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0, diameter: 1 });
    const entities = query(world, [Position, VisualSize, Direction, Speed]);
    expect(entities).toHaveLength(1);
    expect(getComponent(world, entities[0], Position).x).toBe(0);
    expect(getComponent(world, entities[0], Position).y).toBe(0);
    expect(getComponent(world, entities[0], VisualSize).diameter).toBe(1);
    expect(world.seed).toBe(42);
    expect(world.ticDurationMs).toBe(50);
    expect(world.physics3dRuntimeMode).toBe('lua');
    expect(world.physics3dRuntimeMetrics.ticCountMeasured).toBe(0);
  });

  it('should run tics and update positions', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 1000 });
    spawnBot(world, { x: 0, y: 0 }); // Wander (default) sets direction/speed each tic
    runTics(world, 1);
    const entities = query(world, [Position, VisualSize, Direction, Speed]);
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
    const ev = events[0];
    if (ev.type !== 'collision') throw new Error('expected collision');
    expect(
      (ev.entityA === a && ev.entityB === b) || (ev.entityA === b && ev.entityB === a)
    ).toBe(true);
  });

  it('should emit consumed event when bot overlaps food and remove food', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    const botEid = spawnBot(world, {
      x: 0,
      y: 0,
      diameter: 1,
      urge: 'none',
      tilesPerSec: 0,
    });
    const foodEid = spawnFood(world, { x: 0, y: 0 }); // same position => overlap
    expect(query(world, [Position, Food])).toHaveLength(1);
    runTics(world, 1);
    const events = drainEventQueue(world);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('consumed');
    const ev = events[0];
    if (ev.type !== 'consumed') throw new Error('expected consumed');
    expect(ev.entity).toBe(botEid);
    expect(ev.foodEntity).toBe(foodEid);
    expect(ev.x).toBe(0);
    expect(ev.y).toBe(0);
    expect(query(world, [Position, Food])).toHaveLength(0);
  });

  it('should drain event queue and clear it', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0, diameter: 2, urge: 'none', tilesPerSec: 0 });
    spawnBot(world, { x: 1, y: 0, diameter: 2, urge: 'none', tilesPerSec: 0 });
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
    const entities = query(world, [Position, VisualSize, Direction, Speed]);
    const pos = getComponent(world, entities[0], Position);
    expect(Math.hypot(pos.x, pos.y)).toBeGreaterThan(0); // entity moved (Wander)
  });

  it('should allow configuring physics3d runtime mode', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    expect(world.physics3dRuntimeMode).toBe('lua');
    configurePhysics3dRuntimeMode(world, 'ts');
    expect(world.physics3dRuntimeMode).toBe('ts');
  });

  it('should record runtime metrics in ts mode', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50, physics3dRuntimeMode: 'ts' });
    spawnBot(world, { x: 0, y: 0, diameter: 1.2 });
    runTics(world, 2);
    expect(world.physics3dRuntimeMetrics.ticCountMeasured).toBe(2);
    expect(world.physics3dRuntimeMetrics.lastTicTotalMs).toBeGreaterThanOrEqual(0);
    expect(world.physics3dRuntimeMetrics.totalMs).toBeGreaterThanOrEqual(
      world.physics3dRuntimeMetrics.lastTicTotalMs
    );
  });
});
