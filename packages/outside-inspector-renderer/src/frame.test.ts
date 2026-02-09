import { describe, expect, it } from 'vitest';
import { addComponent, addEntity, createWorld } from 'bitecs';
import {
  Collided,
  Direction,
  Follow,
  FollowTarget,
  FloorTile,
  Food,
  Observed,
  Obstacle,
  Position,
  Speed,
  Size,
} from '@outside/simulator';
import { buildInspectorFrame } from './frame';

describe('buildInspectorFrame', () => {
  it('classifies floor, wall, and entity primitives', () => {
    const world = createWorld();

    const floor = addEntity(world);
    addComponent(world, floor, Observed);
    addComponent(world, floor, Position);
    Position.x[floor] = 0;
    Position.y[floor] = 0;
    addComponent(world, floor, Size);
    Size.diameter[floor] = 1;
    addComponent(world, floor, FloorTile);

    const wall = addEntity(world);
    addComponent(world, wall, Observed);
    addComponent(world, wall, Position);
    Position.x[wall] = 1;
    Position.y[wall] = 0;
    addComponent(world, wall, Size);
    Size.diameter[wall] = 1;
    addComponent(world, wall, FloorTile);
    addComponent(world, wall, Obstacle);
    addComponent(world, wall, Collided);
    Collided.ticksRemaining[wall] = 1;

    const food = addEntity(world);
    addComponent(world, food, Observed);
    addComponent(world, food, Position);
    Position.x[food] = 2;
    Position.y[food] = 2;
    addComponent(world, food, Size);
    Size.diameter[food] = 0.5;
    addComponent(world, food, Food);

    const frame = buildInspectorFrame(world);
    expect(frame.tiles.some((tile) => tile.kind === 'floor')).toBe(true);
    expect(frame.tiles.some((tile) => tile.kind === 'wall')).toBe(true);
    expect(frame.tiles.some((tile) => tile.inCollidedCooldown)).toBe(true);
    expect(frame.entities.some((entity) => entity.kind === 'food')).toBe(true);
    expect(frame.collisionTileCount).toBe(1);
  });

  it('classifies non-tile entities as bots and includes vectors/follow links/collision metadata', () => {
    const world = createWorld();
    const leader = addEntity(world);
    addComponent(world, leader, Observed);
    addComponent(world, leader, Position);
    Position.x[leader] = 3;
    Position.y[leader] = 3;

    const follower = addEntity(world);
    addComponent(world, follower, Observed);
    addComponent(world, follower, Position);
    Position.x[follower] = 1;
    Position.y[follower] = 2;
    addComponent(world, follower, Direction);
    Direction.angle[follower] = Math.PI / 2;
    addComponent(world, follower, Speed);
    Speed.tilesPerSec[follower] = 1.5;
    addComponent(world, follower, Follow);
    addComponent(world, follower, FollowTarget);
    FollowTarget.eid[follower] = leader;
    addComponent(world, follower, Collided);
    Collided.ticksRemaining[follower] = 2;

    const frame = buildInspectorFrame(world);
    const bot = frame.entities.find((entity) => entity.eid === follower);
    expect(bot?.kind).toBe('bot');
    expect(bot?.directionRad).toBe(Math.PI / 2);
    expect(bot?.speedTilesPerSec).toBe(1.5);
    expect(bot?.inCollidedCooldown).toBe(true);
    expect(frame.followLinks).toEqual([
      {
        followerEid: follower,
        targetEid: leader,
        fromX: 1,
        fromY: 2,
        toX: 3,
        toY: 3,
      },
    ]);
    expect(frame.followLinkCount).toBe(1);
    expect(frame.collisionEntityCount).toBe(1);
    expect(frame.unknownCount).toBe(0);
  });
});
