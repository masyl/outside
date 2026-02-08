import { describe, expect, it } from 'vitest';
import { addComponent, addEntity, createWorld } from 'bitecs';
import {
  FloorTile,
  Food,
  Obstacle,
  Position,
  Size,
} from '@outside/simulator';
import { buildInspectorFrame } from './frame';

describe('buildInspectorFrame', () => {
  it('classifies floor, wall, and entity primitives', () => {
    const world = createWorld();

    const floor = addEntity(world);
    addComponent(world, floor, Position);
    Position.x[floor] = 0;
    Position.y[floor] = 0;
    addComponent(world, floor, Size);
    Size.diameter[floor] = 1;
    addComponent(world, floor, FloorTile);

    const wall = addEntity(world);
    addComponent(world, wall, Position);
    Position.x[wall] = 1;
    Position.y[wall] = 0;
    addComponent(world, wall, Size);
    Size.diameter[wall] = 1;
    addComponent(world, wall, FloorTile);
    addComponent(world, wall, Obstacle);

    const food = addEntity(world);
    addComponent(world, food, Position);
    Position.x[food] = 2;
    Position.y[food] = 2;
    addComponent(world, food, Size);
    Size.diameter[food] = 0.5;
    addComponent(world, food, Food);

    const frame = buildInspectorFrame(world);
    expect(frame.tiles.some((tile) => tile.kind === 'floor')).toBe(true);
    expect(frame.tiles.some((tile) => tile.kind === 'wall')).toBe(true);
    expect(frame.entities.some((entity) => entity.kind === 'food')).toBe(true);
  });

  it('classifies non-tile entities as bots by default', () => {
    const world = createWorld();
    const entity = addEntity(world);
    addComponent(world, entity, Position);
    Position.x[entity] = 3;
    Position.y[entity] = 3;

    const frame = buildInspectorFrame(world);
    expect(frame.entities[0]?.kind).toBe('bot');
    expect(frame.unknownCount).toBe(0);
  });
});
