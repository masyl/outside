import { describe, expect, it } from 'vitest';
import {
  createWorld,
  getComponent,
  runTics,
  spawnBot,
  spawnFloorRect,
  spawnWall,
  Direction,
  Speed,
  ActualSpeed,
  Position,
  PositionZ,
  Grounded,
  VelocityZ,
  FloorTile,
  Obstacle,
  query,
  debugJumpPulse,
  setComponent,
} from './index';

function setupCorridorWorld() {
  const world = createWorld({ seed: 42, ticDurationMs: 50 });
  spawnFloorRect(world, -1, -1, 6, 1, true);

  for (let y = -1; y <= 1; y++) {
    spawnWall(world, 3, y);
  }

  const eid = spawnBot(world, {
    x: 1.4,
    y: 0,
    directionRad: 0,
    tilesPerSec: 5,
    urge: 'none',
    obstacleDiameter: 0.8,
  });
  return { world, eid };
}

describe('physics3d simulator mode', () => {
  it('should preserve wall tile positions for renderer alignment', () => {
    const world = createWorld({ seed: 42, ticDurationMs: 50 });
    spawnFloorRect(world, -1, -1, 6, 1, true);
    spawnWall(world, 3, 0);

    const wallEid = queryWall(world);
    const before = getComponent(world, wallEid, Position);
    runTics(world, 5);
    const after = getComponent(world, wallEid, Position);

    expect(after.x).toBe(before.x);
    expect(after.y).toBe(before.y);
  });

  it('should keep moving bot from clipping through blocking walls', () => {
    const { world, eid } = setupCorridorWorld();

    let maxX = -Infinity;
    runTics(world, 220);
    const pos = getComponent(world, eid, Position);
    maxX = Math.max(maxX, pos.x);

    // Wall at x=3 occupies [3,4]; bot radius 0.4 should keep center < ~2.6.
    expect(maxX).toBeLessThan(2.75);
  });

  it('should update vertical state components in physics mode', () => {
    const { world, eid } = setupCorridorWorld();

    runTics(world, 2);

    const posZ = getComponent(world, eid, PositionZ);
    const grounded = getComponent(world, eid, Grounded);

    expect(Number.isFinite(posZ.z)).toBe(true);
    expect(grounded.value === 0 || grounded.value === 1).toBe(true);
  });

  it('should remain deterministic for same seed and setup', () => {
    const a = setupCorridorWorld();
    const b = setupCorridorWorld();

    runTics(a.world, 120);
    runTics(b.world, 120);

    const posA = getComponent(a.world, a.eid, Position);
    const posB = getComponent(b.world, b.eid, Position);
    const zA = getComponent(a.world, a.eid, PositionZ);
    const zB = getComponent(b.world, b.eid, PositionZ);
    const dirA = getComponent(a.world, a.eid, Direction);
    const dirB = getComponent(b.world, b.eid, Direction);

    expect(posA.x).toBeCloseTo(posB.x, 6);
    expect(posA.y).toBeCloseTo(posB.y, 6);
    expect(zA.z).toBeCloseTo(zB.z, 6);
    expect(dirA.angle).toBeCloseTo(dirB.angle, 6);
  });

  it('wander should retarget and avoid constant wall pushing in physics mode', () => {
    const world = createWorld({ seed: 11, ticDurationMs: 50 });
    spawnFloorRect(world, -30, -30, 30, 30, true);
    for (let y = -2; y <= 2; y++) {
      spawnWall(world, 3, y);
    }
    const eid = spawnBot(world, {
      x: 1.2,
      y: 0,
      directionRad: 0,
      tilesPerSec: 3,
      urge: 'wander',
      obstacleDiameter: 0.8,
    });

    let minY = Infinity;
    let maxY = -Infinity;
    let maxX = -Infinity;
    let maxSpeed = 0;
    for (let i = 0; i < 220; i++) {
      runTics(world, 1);
      const pos = getComponent(world, eid, Position);
      const speed = getComponent(world, eid, Speed);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxSpeed = Math.max(maxSpeed, speed.tilesPerSec);
    }

    // Not clipped through wall.
    expect(maxX).toBeLessThan(2.75);
    // Bot should explore laterally instead of pressing one line.
    expect(maxY - minY).toBeGreaterThan(0.8);
    // Path-follow wander runs at 3x speed budget for bots.
    expect(maxSpeed).toBeGreaterThan(4.1);
  });

  it('debugJumpPulse should affect only the targeted tracked entity', () => {
    const world = createWorld({ seed: 77, ticDurationMs: 50 });
    spawnFloorRect(world, -1, -1, 6, 1, true);
    const hero = spawnBot(world, {
      x: 0,
      y: 0,
      directionRad: 0,
      tilesPerSec: 0,
      urge: 'none',
      obstacleDiameter: 0.8,
    });
    const other = spawnBot(world, {
      x: 1,
      y: 0,
      directionRad: 0,
      tilesPerSec: 0,
      urge: 'none',
      obstacleDiameter: 0.8,
    });

    runTics(world, 2);
    const applied = debugJumpPulse(world, 0.8, hero);
    expect(applied).toBe(1);
    runTics(world, 1);

    const heroVz = getComponent(world, hero, VelocityZ).z;
    const otherVz = getComponent(world, other, VelocityZ).z;
    expect(heroVz).toBeGreaterThan(otherVz);
  });

  it('should report actual physics speed from body velocity while turning', () => {
    const world = createWorld({ seed: 91, ticDurationMs: 50 });
    spawnFloorRect(world, -20, -20, 20, 20, true);
    const eid = spawnBot(world, {
      x: 0,
      y: 0,
      directionRad: 0,
      tilesPerSec: 5,
      urge: 'none',
      obstacleDiameter: 0.8,
    });

    const samples: number[] = [];
    for (let tic = 0; tic < 80; tic++) {
      if (tic === 20) setComponent(world, eid, Direction, { angle: Math.PI / 2 });
      if (tic === 40) setComponent(world, eid, Direction, { angle: Math.PI });
      if (tic === 60) setComponent(world, eid, Direction, { angle: (3 * Math.PI) / 2 });
      runTics(world, 1);
      const measured = getComponent(world, eid, ActualSpeed)?.tilesPerSec ?? 0;
      samples.push(measured);
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    expect(max).toBeGreaterThan(0.1);
    expect(max - min).toBeGreaterThan(0.02);
  });

  it('bot collision shoves one bot laterally out of the way', () => {
    const world = createWorld({ seed: 19, ticDurationMs: 50 });
    spawnFloorRect(world, -20, -20, 20, 20, true);

    const left = spawnBot(world, {
      x: -2,
      y: 0,
      directionRad: 0,
      tilesPerSec: 4,
      urge: 'none',
      obstacleDiameter: 0.8,
    });
    const right = spawnBot(world, {
      x: 2,
      y: 0,
      directionRad: Math.PI,
      tilesPerSec: 4,
      urge: 'none',
      obstacleDiameter: 0.8,
    });

    let maxLateralOffset = 0;
    for (let i = 0; i < 180; i++) {
      runTics(world, 1);
      const leftPos = getComponent(world, left, Position);
      const rightPos = getComponent(world, right, Position);
      maxLateralOffset = Math.max(
        maxLateralOffset,
        Math.abs(leftPos.y),
        Math.abs(rightPos.y)
      );
    }

    expect(maxLateralOffset).toBeGreaterThan(0.1);
  });
});

function queryWall(world: ReturnType<typeof createWorld>): number {
  const wallEids = query(world, [Position, FloorTile, Obstacle]);
  const eid = wallEids[0];
  if (eid == null) throw new Error('expected at least one wall');
  return eid;
}
