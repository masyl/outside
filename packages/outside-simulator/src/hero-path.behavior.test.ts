import { describe, expect, it } from 'vitest';
import { hasComponent } from 'bitecs';
import {
  createWorld,
  getComponent,
  getHeroPath,
  Hero,
  orderHeroTo,
  Position,
  query,
  runTics,
  spawnFloorRect,
  spawnHero,
  Wander,
} from './index';

describe('hero path behavior', () => {
  it('hero wanders by default when idle', () => {
    const world = createWorld({ seed: 17, ticDurationMs: 1000 });
    spawnFloorRect(world, -3, -3, 3, 3, true);
    const heroEid = spawnHero(world, { x: 0.5, y: 0.5 });

    const start = query(world, [Hero, Position]);
    expect(start).toContain(heroEid);
    const startPos = getComponent(world, heroEid, Position);

    runTics(world, 2);

    const endPos = getComponent(world, heroEid, Position);
    expect(Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y)).toBeGreaterThan(0);
  });

  it('hero switches from wander to path-follow and back to wander', () => {
    const world = createWorld({ seed: 9, ticDurationMs: 50 });
    spawnFloorRect(world, -6, -6, 6, 6, true);
    const heroEid = spawnHero(world, { x: 0.5, y: 0.5 });

    expect(hasComponent(world, heroEid, Wander)).toBe(true);

    orderHeroTo(world, heroEid, 4, 4);
    expect(hasComponent(world, heroEid, Wander)).toBe(false);

    for (let i = 0; i < 240; i++) {
      runTics(world, 1);
      if (getHeroPath(world, heroEid).length === 0) break;
    }

    expect(getHeroPath(world, heroEid).length).toBe(0);
    expect(hasComponent(world, heroEid, Wander)).toBe(true);
  });
});
