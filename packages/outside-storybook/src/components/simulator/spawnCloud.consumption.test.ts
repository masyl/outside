import { describe, expect, it } from 'vitest';
import { Food, createWorld, drainEventQueue, query, runTics } from '@outside/simulator';
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
});
