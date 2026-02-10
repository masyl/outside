import { describe, expect, it } from 'vitest';
import {
  Bounciness,
  DefaultSpriteKey,
  Kickable,
  Position,
  PositionZ,
  SoccerBall,
  createWorld,
  getComponent,
  query,
  runTics,
  spawnBot,
  spawnFloorRect,
  spawnSoccerBall,
} from './index';

describe('soccer ball prefab and kick behavior', () => {
  it('spawns a soccer ball with kickable + bounciness state', () => {
    const world = createWorld({ seed: 33, ticDurationMs: 50 });
    const ball = spawnSoccerBall(world, { x: 2, y: -3, bounciness: 0.9 });

    expect(query(world, [SoccerBall])).toContain(ball);
    expect(query(world, [Kickable])).toContain(ball);

    const pos = getComponent(world, ball, Position);
    const z = getComponent(world, ball, PositionZ);
    const bouncy = getComponent(world, ball, Bounciness);
    const spriteKey = getComponent(world, ball, DefaultSpriteKey);
    expect(pos.x).toBeCloseTo(2, 6);
    expect(pos.y).toBeCloseTo(-3, 6);
    expect(z.z).toBeGreaterThan(0);
    expect(bouncy.value).toBeCloseTo(0.9, 6);
    expect(spriteKey.value).toBe('pickup.ball.soccer');
  });

  it('bot contact kicks soccer ball and produces movement over time', () => {
    const world = createWorld({ seed: 17, ticDurationMs: 50 });
    spawnFloorRect(world, -12, -12, 12, 12, true);
    spawnBot(world, {
      x: -1.4,
      y: 0,
      directionRad: 0,
      tilesPerSec: 6,
      urge: 'none',
      obstacleDiameter: 0.8,
    });
    const ball = spawnSoccerBall(world, { x: 0, y: 0, bounciness: 0.82 });

    const start = getComponent(world, ball, Position);
    runTics(world, 120);
    const end = getComponent(world, ball, Position);

    const moved = Math.hypot(end.x - start.x, end.y - start.y);
    expect(moved).toBeGreaterThan(0.5);
  });
});
