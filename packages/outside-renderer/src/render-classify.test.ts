import { describe, it, expect } from 'vitest';
import { addEntity, addComponent, setComponent } from 'bitecs';
import { FloorTile, Obstacle, Food, Hero, Size } from '@outside/simulator';
import { createRenderWorld } from './render-world';
import { classifyRenderKind } from './render-classify';

function makeWorld() {
  return createRenderWorld().world;
}

describe('classifyRenderKind', () => {
  it('classifies floor and wall tags', () => {
    const world = makeWorld();
    const floor = addEntity(world);
    addComponent(world, floor, FloorTile);
    expect(classifyRenderKind(world, floor)).toBe('floor');

    const wall = addEntity(world);
    addComponent(world, wall, FloorTile);
    addComponent(world, wall, Obstacle);
    expect(classifyRenderKind(world, wall)).toBe('wall');
  });

  it('classifies hero and food tags', () => {
    const world = makeWorld();
    const hero = addEntity(world);
    addComponent(world, hero, Hero);
    expect(classifyRenderKind(world, hero)).toBe('hero');

    const food = addEntity(world);
    addComponent(world, food, Food);
    expect(classifyRenderKind(world, food)).toBe('food');
  });

  it('infers tiles from size when tags are missing', () => {
    const world = makeWorld();
    const tile = addEntity(world);
    addComponent(world, tile, Size);
    setComponent(world, tile, Size, { diameter: 1 });
    expect(classifyRenderKind(world, tile)).toBe('floor');

    const wall = addEntity(world);
    addComponent(world, wall, Size);
    addComponent(world, wall, Obstacle);
    setComponent(world, wall, Size, { diameter: 1 });
    expect(classifyRenderKind(world, wall)).toBe('wall');
  });
});
