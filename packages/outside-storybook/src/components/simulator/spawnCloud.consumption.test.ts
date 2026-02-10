import { describe, expect, it } from 'vitest';
import { Food, Hero, Position, createWorld, drainEventQueue, query, runTics } from '@outside/simulator';
import { spawnDungeonWithFoodAndHero } from './spawnCloud';

describe('spawnDungeonWithFoodAndHero consumption', () => {
  it('should emit consumed events and remove food over time', () => {
    const world = createWorld({ seed: 321, ticDurationMs: 50 });
    spawnDungeonWithFoodAndHero(world, 321, 3, {
      botCount: 3,
      dogCount: 3,
      catCount: 3,
      foodCount: 12,
    });

    const initialFoodCount = query(world, [Food]).length;
    expect(initialFoodCount).toBe(12);

    let consumedCount = 0;
    for (let i = 0; i < 600; i++) {
      runTics(world, 1);
      const events = drainEventQueue(world);
      consumedCount += events.filter((event) => event.type === 'consumed').length;
      if (consumedCount > 0) break;
    }

    const remainingFood = query(world, [Food]).length;
    expect(consumedCount).toBeGreaterThan(0);
    expect(remainingFood).toBeLessThan(initialFoodCount);
  });

  it('should emit consumed events for HeroAndFood story defaults', () => {
    const world = createWorld({ seed: 0, ticDurationMs: 50 });
    spawnDungeonWithFoodAndHero(world, 0, 3, {
      botCount: 3,
      dogCount: 2,
      catCount: 2,
      foodCount: 12,
    });

    let consumedCount = 0;
    for (let i = 0; i < 60; i++) {
      runTics(world, 1);
      const events = drainEventQueue(world);
      consumedCount += events.filter((event) => event.type === 'consumed').length;
      if (consumedCount > 0) break;
    }

    expect(consumedCount).toBeGreaterThan(0);
  });

  it('spawns exactly one hero and hero stays idle with zero bot/dog/cat/food counts', () => {
    const world = createWorld({ seed: 1, ticDurationMs: 50 });
    spawnDungeonWithFoodAndHero(world, 1, 0, {
      botCount: 0,
      dogCount: 0,
      catCount: 0,
      foodCount: 0,
    });

    const heroes = query(world, [Hero, Position]);
    expect(heroes).toHaveLength(1);
    const heroEid = heroes[0];
    const startX = Position.x[heroEid];
    const startY = Position.y[heroEid];

    runTics(world, 20);

    const delta = Math.hypot(Position.x[heroEid] - startX, Position.y[heroEid] - startY);
    expect(delta).toBeLessThan(0.001);
  });
});
