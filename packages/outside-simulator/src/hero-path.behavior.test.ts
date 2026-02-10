import { describe, expect, it } from 'vitest';
import { hasComponent } from 'bitecs';
import {
  createWorld,
  clearEntityPath,
  getEntityPath,
  getComponent,
  Hero,
  orderEntityToTile,
  Position,
  query,
  runTics,
  spawnFloorRect,
  spawnHero,
  Wander,
  WanderPersistence,
  Wait,
} from './index';

describe('commanded path-follow behavior', () => {
  it('hero is stationary by default when no path is assigned', () => {
    const world = createWorld({ seed: 17, ticDurationMs: 1000 });
    spawnFloorRect(world, -30, -30, 30, 30, true);
    const heroEid = spawnHero(world, { x: 0.5, y: 0.5 });

    const start = query(world, [Hero, Position]);
    expect(start).toContain(heroEid);
    expect(hasComponent(world, heroEid, Wander)).toBe(false);
    expect(hasComponent(world, heroEid, Wait)).toBe(false);
    const startPos = getComponent(world, heroEid, Position);

    runTics(world, 30);

    const endPos = getComponent(world, heroEid, Position);
    expect(Math.hypot(endPos.x - startPos.x, endPos.y - startPos.y)).toBeLessThan(0.001);
  });

  it('hero follows commanded path and returns to standing still', () => {
    const world = createWorld({ seed: 9, ticDurationMs: 50 });
    spawnFloorRect(world, -6, -6, 6, 6, true);
    const heroEid = spawnHero(world, { x: 0.5, y: 0.5 });

    expect(hasComponent(world, heroEid, Wander)).toBe(false);
    expect(hasComponent(world, heroEid, Wait)).toBe(false);

    orderEntityToTile(world, heroEid, 4, 4);
    expect(hasComponent(world, heroEid, Wait)).toBe(false);
    expect(hasComponent(world, heroEid, Wander)).toBe(false);
    expect(hasComponent(world, heroEid, WanderPersistence)).toBe(true);
    expect(Number.isFinite(WanderPersistence.targetTileX[heroEid])).toBe(true);
    expect(Number.isFinite(WanderPersistence.targetTileY[heroEid])).toBe(true);

    for (let i = 0; i < 240; i++) {
      runTics(world, 1);
      if (getEntityPath(world, heroEid).length === 0) break;
    }

    expect(getEntityPath(world, heroEid).length).toBe(0);
    expect(hasComponent(world, heroEid, Wait)).toBe(false);
    expect(hasComponent(world, heroEid, Wander)).toBe(false);
  });

  it('clears commanded path immediately when requested', () => {
    const world = createWorld({ seed: 14, ticDurationMs: 50 });
    spawnFloorRect(world, -8, -8, 8, 8, true);
    const heroEid = spawnHero(world, { x: 0.5, y: 0.5 });

    orderEntityToTile(world, heroEid, 6, 6);
    expect(getEntityPath(world, heroEid).length).toBeGreaterThan(0);

    const cleared = clearEntityPath(world, heroEid);
    expect(cleared).toBe(true);
    expect(getEntityPath(world, heroEid).length).toBe(0);
  });
});
