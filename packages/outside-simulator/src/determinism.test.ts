import { describe, it, expect } from 'vitest';
import {
  createWorld,
  runTics,
  query,
  getComponent,
  spawnBot,
  drainEventQueue,
  Position,
  VisualSize,
  Direction,
  Speed,
} from './index';

describe('Determinism', () => {
  it('should produce identical state for same seed and tic count', () => {
    const world1 = createWorld({ seed: 12345, ticDurationMs: 50 });
    const world2 = createWorld({ seed: 12345, ticDurationMs: 50 });

    spawnBot(world1, { x: 0, y: 0, diameter: 1, directionRad: 0, tilesPerSec: 1 });
    spawnBot(world2, { x: 0, y: 0, diameter: 1, directionRad: 0, tilesPerSec: 1 });

    runTics(world1, 10);
    runTics(world2, 10);

    const ents1 = query(world1, [Position, VisualSize, Direction, Speed]);
    const ents2 = query(world2, [Position, VisualSize, Direction, Speed]);

    expect(ents1).toHaveLength(1);
    expect(ents2).toHaveLength(1);
    const pos1 = getComponent(world1, ents1[0], Position);
    const pos2 = getComponent(world2, ents2[0], Position);
    const dir1 = getComponent(world1, ents1[0], Direction);
    const dir2 = getComponent(world2, ents2[0], Direction);
    const speed1 = getComponent(world1, ents1[0], Speed);
    const speed2 = getComponent(world2, ents2[0], Speed);
    expect(pos1.x).toBe(pos2.x);
    expect(pos1.y).toBe(pos2.y);
    expect(dir1.angle).toBe(dir2.angle);
    expect(speed1.tilesPerSec).toBe(speed2.tilesPerSec);
  });

  it('should produce identical event sequence for same seed and tic count when collisions occur', () => {
    const world1 = createWorld({ seed: 999, ticDurationMs: 50 });
    const world2 = createWorld({ seed: 999, ticDurationMs: 50 });

    for (const world of [world1, world2]) {
      spawnBot(world, {
        x: 0,
        y: 0,
        diameter: 2,
        directionRad: 0,
        tilesPerSec: 0.5,
        urge: 'none',
      });
      spawnBot(world, {
        x: 5,
        y: 0,
        diameter: 2,
        directionRad: Math.PI,
        tilesPerSec: 0.5,
        urge: 'none',
      });
    }

    runTics(world1, 20);
    runTics(world2, 20);

    const events1 = drainEventQueue(world1);
    const events2 = drainEventQueue(world2);

    expect(events1.length).toBe(events2.length);
    for (let i = 0; i < events1.length; i++) {
      const e1 = events1[i];
      const e2 = events2[i];
      expect(e1.type).toBe(e2.type);
      if (e1.type === 'collision' && e2.type === 'collision') {
        expect(e1.entityA).toBe(e2.entityA);
        expect(e1.entityB).toBe(e2.entityB);
      }
    }
  });
});
