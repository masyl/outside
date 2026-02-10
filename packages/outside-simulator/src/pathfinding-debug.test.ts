import { describe, expect, it } from 'vitest';
import {
  createWorld,
  getPathfindingDebugPaths,
  getWanderPathDebug,
  orderEntityToTile,
  runTics,
  spawnBot,
  spawnFloorRect,
  spawnHero,
} from './index';

describe('pathfinding debug helpers', () => {
  it('returns wander path debug from simulator world state', () => {
    const world = createWorld({ seed: 33, ticDurationMs: 50 });
    spawnFloorRect(world, -20, -20, 20, 20, true);
    spawnBot(world, { x: 0.5, y: 0.5, urge: 'wander' });

    runTics(world, 2);

    const paths = getWanderPathDebug(world);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths.every((path) => path.style === 'wander')).toBe(true);
    expect(paths.every((path) => path.points.length >= 2)).toBe(true);
  });

  it('returns focused ordered path plus wander paths', () => {
    const world = createWorld({ seed: 41, ticDurationMs: 50 });
    spawnFloorRect(world, -20, -20, 20, 20, true);
    const hero = spawnHero(world, { x: 0.5, y: 0.5 });
    spawnBot(world, { x: 2.5, y: 2.5, urge: 'wander' });
    orderEntityToTile(world, hero, 10, 10);

    runTics(world, 2);

    const paths = getPathfindingDebugPaths(world, { focusedEid: hero });
    expect(paths.some((path) => path.style === 'ordered' && path.eid === hero)).toBe(true);
    expect(paths.some((path) => path.style === 'wander')).toBe(true);
  });
});
