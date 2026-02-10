import { describe, expect, it } from 'vitest';
import {
  Hero,
  Position,
  getViewportFollowTarget,
  query,
  runTics,
  createWorld,
} from '@outside/simulator';
import { spawnDungeonWithFoodAndHero } from './spawnCloud';

describe('hero and food hero command movement', () => {
  it('hero starts idle in the HeroAndFood story setup', () => {
    const world = createWorld({ seed: 1, ticDurationMs: 1000 / 30 });
    spawnDungeonWithFoodAndHero(world, 1, 0, {
      botCount: 0,
      dogCount: 10,
      catCount: 0,
      foodCount: 0,
    });

    const heroEid = getViewportFollowTarget(world);
    expect(heroEid).toBeGreaterThan(0);
    expect(query(world, [Hero]).includes(heroEid)).toBe(true);

    const startX = Position.x[heroEid];
    const startY = Position.y[heroEid];
    runTics(world, 120);
    const endX = Position.x[heroEid];
    const endY = Position.y[heroEid];

    expect(Math.hypot(endX - startX, endY - startY)).toBeLessThan(0.001);
  });
});
