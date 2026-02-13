import { describe, expect, it } from 'vitest';
import { hasComponent } from 'bitecs';
import {
  createWorld,
  spawnBot,
  spawnFloorTile,
  spawnFood,
  spawnHero,
  spawnWall,
  MinimapPixel,
} from './index';

describe('MinimapPixel prefab defaults', () => {
  it('adds minimap colors to floor, wall, bot, and hero', () => {
    const world = createWorld({ seed: 7, ticDurationMs: 50 });

    const floor = spawnFloorTile(world, 0, 0, true);
    const wall = spawnWall(world, 1, 0);
    const bot = spawnBot(world, { x: 2.5, y: 0.5, urge: 'none' });
    const hero = spawnHero(world, { x: 3.5, y: 0.5 });

    expect(hasComponent(world, floor, MinimapPixel)).toBe(true);
    expect(hasComponent(world, wall, MinimapPixel)).toBe(true);
    expect(hasComponent(world, bot, MinimapPixel)).toBe(true);
    expect(hasComponent(world, hero, MinimapPixel)).toBe(true);

    expect(MinimapPixel.r[floor]).toBe(44);
    expect(MinimapPixel.g[floor]).toBe(44);
    expect(MinimapPixel.b[floor]).toBe(52);

    expect(MinimapPixel.r[hero]).toBe(255);
    expect(MinimapPixel.g[hero]).toBe(255);
    expect(MinimapPixel.b[hero]).toBe(255);
  });

  it('does not add minimap pixels to food by default', () => {
    const world = createWorld({ seed: 9, ticDurationMs: 50 });
    const food = spawnFood(world, { x: 0.5, y: 0.5 });
    expect(hasComponent(world, food, MinimapPixel)).toBe(false);
  });
});
