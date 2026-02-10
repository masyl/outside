import { describe, expect, it } from 'vitest';
import {
  FloorTile,
  getComponent,
  getEntityPath,
  getViewportFollowTarget,
  orderEntityToTile,
  Position,
  query,
  runTics,
  TargetPace,
  Walkable,
  createWorld,
} from '@outside/simulator';
import { spawnDungeonWithFoodAndHero } from './spawnCloud';

describe('hero path-follow movement in dungeon setup', () => {
  it('moves hero after ordering a distant floor destination', () => {
    const world = createWorld({ seed: 4, ticDurationMs: 1000 / 30 });
    spawnDungeonWithFoodAndHero(world, 4, 10, {
      botCount: 10,
      foodCount: 10,
      dogCount: 10,
      catCount: 10,
    });

    const heroEid = getViewportFollowTarget(world);
    expect(heroEid).toBeGreaterThan(0);

    const heroPos = getComponent(world, heroEid, Position);
    const floorWalkable = query(world, [Position, FloorTile, Walkable]);
    const target = floorWalkable
      .map((eid) => ({
        x: Math.floor(Position.x[eid]),
        y: Math.floor(Position.y[eid]),
        d: Math.hypot(Position.x[eid] - heroPos.x, Position.y[eid] - heroPos.y),
      }))
      .filter((cell) => cell.d >= 10)
      .sort((a, b) => b.d - a.d)[0];

    expect(target).toBeDefined();
    orderEntityToTile(world, heroEid, target!.x, target!.y);

    const initialPath = getEntityPath(world, heroEid);
    expect(initialPath.length).toBeGreaterThan(0);

    const start = { x: heroPos.x, y: heroPos.y };
    let sawNonStandingPace = false;
    for (let i = 0; i < 180; i++) {
      runTics(world, 1);
      const pace = TargetPace.value[heroEid];
      if (pace === 1 || pace === 2) {
        sawNonStandingPace = true;
      }
    }

    const end = getComponent(world, heroEid, Position);
    const remainingPath = getEntityPath(world, heroEid);
    const moved = Math.hypot(end.x - start.x, end.y - start.y);
    expect(sawNonStandingPace).toBe(true);
    expect(moved).toBeGreaterThan(0.5);
    expect(remainingPath.length).toBeLessThan(initialPath.length);
  });
});
