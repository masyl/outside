import { describe, expect, it } from 'vitest';
import {
  createWorld,
  drainEventQueue,
  getComponent,
  Position,
  PositionZ,
  query,
  runTics,
  spawnBot,
  spawnSoccerBall,
  Speed,
  VelocityZ,
  Grounded,
  ActualSpeed,
  type Physics3dRuntimeMode,
} from './index';

function createScenario(runtimeMode: Physics3dRuntimeMode) {
  const world = createWorld({
    seed: 777,
    ticDurationMs: 50,
    physics3dRuntimeMode: runtimeMode,
  });
  const botA = spawnBot(world, {
    x: 0,
    y: 0,
    diameter: 2,
    urge: 'none',
    tilesPerSec: 0,
    directionRad: 0,
  });
  const botB = spawnBot(world, {
    x: 1,
    y: 0,
    diameter: 2,
    urge: 'none',
    tilesPerSec: 0,
    directionRad: Math.PI,
  });
  return { world, botA, botB };
}

function expectClose(a: number, b: number, digits = 6): void {
  expect(a).toBeCloseTo(b, digits);
}

type EntitySnapshot = {
  position: { x: number; y: number };
  positionZ: { z: number };
  velocityZ: { z: number };
  actualSpeed: { tilesPerSec: number };
  grounded: { value: number };
};

describe('physics3d runtime parity', () => {
  it('should keep lua and ts runtime state aligned on collision scenario', () => {
    const ts = createScenario('ts');
    runTics(ts.world, 12);
    const tsEvents = drainEventQueue(ts.world);
    const tsEnts = query(ts.world, [Position, PositionZ, VelocityZ, ActualSpeed, Grounded, Speed]);
    const tsSnapshot: EntitySnapshot[] = Array.from(tsEnts).map((eid) => ({
      position: getComponent(ts.world, eid, Position),
      positionZ: getComponent(ts.world, eid, PositionZ),
      velocityZ: getComponent(ts.world, eid, VelocityZ),
      actualSpeed: getComponent(ts.world, eid, ActualSpeed),
      grounded: getComponent(ts.world, eid, Grounded),
    }));

    const lua = createScenario('lua');
    runTics(lua.world, 12);
    const luaEvents = drainEventQueue(lua.world);
    expect(luaEvents).toEqual(tsEvents);

    const luaEnts = query(lua.world, [Position, PositionZ, VelocityZ, ActualSpeed, Grounded, Speed]);
    expect(luaEnts).toHaveLength(tsEnts.length);

    for (let i = 0; i < luaEnts.length; i++) {
      const luaEid = luaEnts[i];
      const luaPos = getComponent(lua.world, luaEid, Position);
      const luaPosZ = getComponent(lua.world, luaEid, PositionZ);
      const luaVelZ = getComponent(lua.world, luaEid, VelocityZ);
      const luaSpeed = getComponent(lua.world, luaEid, ActualSpeed);
      const luaGrounded = getComponent(lua.world, luaEid, Grounded);

      const tsState = tsSnapshot[i];
      expectClose(luaPos.x, tsState.position.x);
      expectClose(luaPos.y, tsState.position.y);
      expectClose(luaPosZ.z, tsState.positionZ.z);
      expectClose(luaVelZ.z, tsState.velocityZ.z);
      expectClose(luaSpeed.tilesPerSec, tsState.actualSpeed.tilesPerSec);
      expect(luaGrounded.value).toBe(tsState.grounded.value);
    }
  });

  it('should keep lua and ts runtime state aligned on soccer-ball kick scenario', () => {
    const tsWorld = createWorld({
      seed: 190,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'ts',
    });
    const tsBot = spawnBot(tsWorld, {
      x: 0,
      y: 0,
      urge: 'none',
      directionRad: 0,
      tilesPerSec: 2.2,
      diameter: 0.9,
    });
    const tsBall = spawnSoccerBall(tsWorld, {
      x: 0.9,
      y: 0,
      visualDiameter: 0.7,
      obstacleDiameter: 0.7,
      bounciness: 0.8,
    });
    runTics(tsWorld, 80);
    const tsEvents = drainEventQueue(tsWorld);
    const tsSnapshot = {
      botPos: getComponent(tsWorld, tsBot, Position),
      ballPos: getComponent(tsWorld, tsBall, Position),
      ballPosZ: getComponent(tsWorld, tsBall, PositionZ),
      ballVelZ: getComponent(tsWorld, tsBall, VelocityZ),
    };

    const luaWorld = createWorld({
      seed: 190,
      ticDurationMs: 50,
      physics3dRuntimeMode: 'lua',
    });
    const luaBot = spawnBot(luaWorld, {
      x: 0,
      y: 0,
      urge: 'none',
      directionRad: 0,
      tilesPerSec: 2.2,
      diameter: 0.9,
    });
    const luaBall = spawnSoccerBall(luaWorld, {
      x: 0.9,
      y: 0,
      visualDiameter: 0.7,
      obstacleDiameter: 0.7,
      bounciness: 0.8,
    });
    runTics(luaWorld, 80);
    const luaEvents = drainEventQueue(luaWorld);

    expect(luaEvents).toEqual(tsEvents);

    const luaBotPos = getComponent(luaWorld, luaBot, Position);
    const luaBallPos = getComponent(luaWorld, luaBall, Position);
    const luaBallPosZ = getComponent(luaWorld, luaBall, PositionZ);
    const luaBallVelZ = getComponent(luaWorld, luaBall, VelocityZ);

    expectClose(luaBotPos.x, tsSnapshot.botPos.x, 4);
    expectClose(luaBotPos.y, tsSnapshot.botPos.y, 4);
    expectClose(luaBallPos.x, tsSnapshot.ballPos.x, 4);
    expectClose(luaBallPos.y, tsSnapshot.ballPos.y, 4);
    expectClose(luaBallPosZ.z, tsSnapshot.ballPosZ.z, 4);
    expectClose(luaBallVelZ.z, tsSnapshot.ballVelZ.z, 4);
  });
});
