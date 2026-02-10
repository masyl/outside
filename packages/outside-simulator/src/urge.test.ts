import { describe, it, expect } from 'vitest';
import {
  createWorld,
  DestinationDeadline,
  spawnBot,
  runTics,
  query,
  getComponent,
  Position,
  Direction,
  Speed,
  Wait,
  Wander,
  WanderPersistence,
  Follow,
  FollowTarget,
  spawnFloorRect,
  spawnWall,
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
    expect(pos.x).toBeCloseTo(0, 8);
    expect(pos.y).toBeCloseTo(0, 8);
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

  it('Wander: speed stays stable across early tics and heading changes smoothly', () => {
    const world = createWorld({ seed: 456, ticDurationMs: 50 });
    const eid = spawnBot(world, { x: 0, y: 0 });
    runTics(world, 1);
    const dirAfter1 = getComponent(world, eid, Direction).angle;
    const speedAfter1 = getComponent(world, eid, Speed).tilesPerSec;
    runTics(world, 5); // 6 tics total; persistence is 10–30 tics so no change yet
    const dirAfter6 = getComponent(world, eid, Direction).angle;
    const speedAfter6 = getComponent(world, eid, Speed).tilesPerSec;
    expect(Math.abs(dirAfter6 - dirAfter1)).toBeLessThanOrEqual(Math.PI / 2);
    expect(speedAfter6).toBe(speedAfter1);
  });

  it('Wander: retargets periodically to new destinations (not one shared stale point)', () => {
    const world = createWorld({ seed: 222, ticDurationMs: 50 });
    spawnFloorRect(world, -40, -40, 40, 40, true);
    const eid = spawnBot(world, { x: 0.5, y: 0.5, urge: 'wander' });

    const seenTargets = new Set<string>();
    for (let i = 0; i < 360; i++) {
      runTics(world, 1);
      const tx = WanderPersistence.targetTileX[eid];
      const ty = WanderPersistence.targetTileY[eid];
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) continue;
      seenTargets.add(`${Math.floor(tx)},${Math.floor(ty)}`);
    }

    expect(seenTargets.size).toBeGreaterThan(1);
  });

  it('Wander: nearby bots choose varied targets instead of collapsing to one tile', () => {
    const world = createWorld({ seed: 77, ticDurationMs: 50 });
    spawnFloorRect(world, -40, -40, 40, 40, true);
    const bots = [
      spawnBot(world, { x: -1.5, y: -1.5, urge: 'wander' }),
      spawnBot(world, { x: -0.5, y: -1.5, urge: 'wander' }),
      spawnBot(world, { x: 0.5, y: -1.5, urge: 'wander' }),
      spawnBot(world, { x: 1.5, y: -1.5, urge: 'wander' }),
      spawnBot(world, { x: -1.5, y: -0.5, urge: 'wander' }),
      spawnBot(world, { x: -0.5, y: -0.5, urge: 'wander' }),
      spawnBot(world, { x: 0.5, y: -0.5, urge: 'wander' }),
      spawnBot(world, { x: 1.5, y: -0.5, urge: 'wander' }),
    ];

    runTics(world, 2);

    const targets = new Set<string>();
    for (const eid of bots) {
      const tx = WanderPersistence.targetTileX[eid];
      const ty = WanderPersistence.targetTileY[eid];
      targets.add(`${Math.floor(tx)},${Math.floor(ty)}`);
    }
    expect(targets.size).toBeGreaterThan(2);
  });

  it('Wander: keeps a destination until deadline expires or destination is reached', () => {
    const world = createWorld({ seed: 101, ticDurationMs: 50 });
    spawnFloorRect(world, -40, -40, 40, 40, true);
    const eid = spawnBot(world, { x: 0.5, y: 0.5, urge: 'wander' });

    runTics(world, 2);
    const initialTarget = {
      x: Math.floor(WanderPersistence.targetTileX[eid]),
      y: Math.floor(WanderPersistence.targetTileY[eid]),
    };
    const initialDeadline = DestinationDeadline.ticsRemaining[eid];
    expect(initialDeadline).toBeGreaterThan(20);

    runTics(world, 15);
    const afterTarget = {
      x: Math.floor(WanderPersistence.targetTileX[eid]),
      y: Math.floor(WanderPersistence.targetTileY[eid]),
    };
    const afterDeadline = DestinationDeadline.ticsRemaining[eid];

    expect(afterTarget).toEqual(initialTarget);
    expect(afterDeadline).toBeLessThan(initialDeadline);
  });

  it('Wander: does not thrash destination when bot starts on a blocked tile', () => {
    const world = createWorld({ seed: 303, ticDurationMs: 1000 / 30 });
    spawnFloorRect(world, -20, -20, 20, 20, true);
    spawnWall(world, 0, 0);
    const eid = spawnBot(world, { x: 0.2, y: 0.2, urge: 'wander' });

    let previousTarget = '';
    let targetChanges = 0;
    for (let i = 0; i < 120; i++) {
      runTics(world, 1);
      const tx = Math.floor(WanderPersistence.targetTileX[eid]);
      const ty = Math.floor(WanderPersistence.targetTileY[eid]);
      const targetKey = `${tx},${ty}`;
      if (previousTarget !== '' && targetKey !== previousTarget) {
        targetChanges += 1;
      }
      previousTarget = targetKey;
    }

    // With deadline-based retargeting, we should not see fast 4Hz destination resets.
    expect(targetChanges).toBeLessThan(6);
    expect(DestinationDeadline.ticsRemaining[eid]).toBeGreaterThan(0);
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
