import { describe, it, expect } from 'vitest';
import {
  createWorld,
  spawnBot,
  runTics,
  query,
  getComponent,
  Position,
  Direction,
  Speed,
  Wait,
  Wander,
  Follow,
  FollowTarget,
} from './index';

describe('Urge system', () => {
  it('Wait: sets speed to 0 so entity does not move', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0, urge: 'wait' });
    runTics(world, 5);
    const entities = query(world, [Position, Speed, Wait]);
    expect(entities).toHaveLength(1);
    const pos = getComponent(world, entities[0], Position);
    const speed = getComponent(world, entities[0], Speed);
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0);
    expect(speed.tilesPerSec).toBe(0);
  });

  it('Wander: sets direction and speed then persists for 1–3 s (smooth walk)', () => {
    const world = createWorld({ seed: 123, ticDurationMs: 50 });
    spawnBot(world, { x: 0, y: 0 });
    runTics(world, 1);
    const entities = query(world, [Position, Direction, Speed, Wander]);
    expect(entities.length).toBeGreaterThanOrEqual(1);
    const dist = Math.hypot(
      getComponent(world, entities[0], Position).x,
      getComponent(world, entities[0], Position).y
    );
    expect(dist).toBeGreaterThan(0);
  });

  it('Wander: direction and speed stay stable across tics (no jitter)', () => {
    const world = createWorld({ seed: 456, ticDurationMs: 50 });
    const eid = spawnBot(world, { x: 0, y: 0 });
    runTics(world, 1);
    const dirAfter1 = getComponent(world, eid, Direction).angle;
    const speedAfter1 = getComponent(world, eid, Speed).tilesPerSec;
    runTics(world, 10); // 11 tics total; persistence is 20–60 tics so no change yet
    const dirAfter11 = getComponent(world, eid, Direction).angle;
    const speedAfter11 = getComponent(world, eid, Speed).tilesPerSec;
    expect(dirAfter11).toBe(dirAfter1);
    expect(speedAfter11).toBe(speedAfter1);
  });

  it('Follow: entity moves toward target when beyond close-enough', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    const leader = spawnBot(world, { x: 10, y: 0 });
    const follower = spawnBot(world, {
      x: 0,
      y: 0,
      urge: 'follow',
      followTargetEid: leader,
    });
    runTics(world, 10);
    const followerPos = getComponent(world, follower, Position);
    const leaderPos = getComponent(world, leader, Position);
    const distBefore = 10;
    const distAfter = Math.hypot(
      leaderPos.x - followerPos.x,
      leaderPos.y - followerPos.y
    );
    expect(distAfter).toBeLessThan(distBefore);
  });

  it('Follow: entity stops when close enough to target', () => {
    const world = createWorld({ seed: 99, ticDurationMs: 50 });
    const leader = spawnBot(world, { x: 1, y: 0 });
    const follower = spawnBot(world, {
      x: 0,
      y: 0,
      urge: 'follow',
      followTargetEid: leader,
    });
    runTics(world, 20);
    const followerPos = getComponent(world, follower, Position);
    const leaderPos = getComponent(world, leader, Position);
    const d = Math.hypot(leaderPos.x - followerPos.x, leaderPos.y - followerPos.y);
    expect(d).toBeLessThanOrEqual(2.5); // close-enough 2 tiles + small tolerance
  });
});
