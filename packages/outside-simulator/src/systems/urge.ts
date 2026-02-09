/**
 * Urge system: drives direction and speed from Wait, Wander, or Follow urges.
 * Runs before movement. Semantics from urge-system delivery (close-enough 2 tiles,
 * speed-up beyond 3 tiles, max velocity 2 tps).
 * @packageDocumentation
 */

import { query, getComponent, setComponent, addComponent, removeComponent } from 'bitecs';
import {
  Position,
  Direction,
  Speed,
  Wait,
  Wander,
  WanderPersistence,
  Follow,
  FollowTarget,
  FollowTightness,
  MaxSpeed,
} from '../components';
import type { SimulatorWorld } from '../world';

/** Close enough to target to stop (tiles). From urge-system delivery. */
const CLOSE_ENOUGH = 2;
/** Beyond this distance, follower speeds up (tiles). */
const SPEED_UP_THRESHOLD = 3;
/** Max velocity in tiles per second (2× original for snappier demo). */
const MAX_VELOCITY_TPS = 4;
/** Wander speed range (tiles per second). */
const WANDER_SPEED_MIN = 1;
const WANDER_SPEED_MAX = 4;
/** Wander: tics between direction changes (shorter to keep trajectory organic). */
const WANDER_DIRECTION_TICS_MIN = 4;
const WANDER_DIRECTION_TICS_MAX = 16;
/** Wander: tics between speed changes. */
const WANDER_SPEED_TICS_MIN = 10;
const WANDER_SPEED_TICS_MAX = 30;
/** Wander: max direction change per step (radians). */
const WANDER_ANGLE_DELTA_MAX = (15 * Math.PI) / 180;

function angleToward(x: number, y: number, toX: number, toY: number): number {
  return Math.atan2(toY - y, toX - x);
}

function normalizeAngleDiff(rad: number): number {
  let r = rad;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

function randomDirectionIntervalTics(rng: SimulatorWorld['random']): number {
  return (
    WANDER_DIRECTION_TICS_MIN +
    Math.floor(rng.nextFloat() * (WANDER_DIRECTION_TICS_MAX - WANDER_DIRECTION_TICS_MIN + 1))
  );
}

function randomSpeedIntervalTics(rng: SimulatorWorld['random']): number {
  return WANDER_SPEED_TICS_MIN + Math.floor(rng.nextFloat() * (WANDER_SPEED_TICS_MAX - WANDER_SPEED_TICS_MIN + 1));
}

export function urgeSystem(world: SimulatorWorld): SimulatorWorld {
  const rng = world.random;

  // Wait: set speed to 0
  const waitEnts = query(world, [Position, Direction, Speed, Wait]);
  const waitSet = new Set(waitEnts);
  for (let i = 0; i < waitEnts.length; i++) {
    setComponent(world, waitEnts[i], Speed, { tilesPerSec: 0 });
  }

  // Follow: steer toward target (runs before Wander so Follow takes precedence when entity has both)
  const followEnts = query(world, [Position, Direction, Speed, Follow, FollowTarget]);
  const followSet = new Set(followEnts);
  for (let i = 0; i < followEnts.length; i++) {
    const eid = followEnts[i];
    const targetEid = FollowTarget.eid[eid];
    const pos = getComponent(world, eid, Position);
    const curDir = getComponent(world, eid, Direction);

    const targetPos = getComponent(world, targetEid, Position);
    if (targetPos == null) {
      removeComponent(world, eid, Follow);
      removeComponent(world, eid, FollowTarget);
      removeComponent(world, eid, FollowTightness);
      addComponent(world, eid, Wander);
      const angle = rng.nextFloat() * Math.PI * 2;
      const tilesPerSec =
        WANDER_SPEED_MIN + rng.nextFloat() * (WANDER_SPEED_MAX - WANDER_SPEED_MIN);
      setComponent(world, eid, Direction, { angle });
      setComponent(world, eid, Speed, { tilesPerSec });
      continue;
    }

    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const d = Math.hypot(dx, dy);

    const targetAngle = angleToward(pos.x, pos.y, targetPos.x, targetPos.y);
    const tightnessComp = getComponent(world, eid, FollowTightness);
    const tightness = tightnessComp?.value != null ? tightnessComp.value : 0;
    const blend = 1 - Math.max(0, Math.min(1, tightness));
    const angleDiff = normalizeAngleDiff(targetAngle - curDir.angle);
    const newAngle = curDir.angle + angleDiff * blend;
    setComponent(world, eid, Direction, { angle: newAngle });

    let tilesPerSec: number;
    if (d < CLOSE_ENOUGH) {
      tilesPerSec = 0;
    } else {
      if (d <= SPEED_UP_THRESHOLD) {
        tilesPerSec = WANDER_SPEED_MIN;
      } else {
        tilesPerSec = Math.min(
          MAX_VELOCITY_TPS,
          WANDER_SPEED_MIN + (d - SPEED_UP_THRESHOLD) * 0.5
        );
      }
      const maxSpeed = getComponent(world, eid, MaxSpeed);
      if (maxSpeed && maxSpeed.tilesPerSec != null) {
        tilesPerSec = Math.min(tilesPerSec, maxSpeed.tilesPerSec);
      }
    }
    setComponent(world, eid, Speed, { tilesPerSec });
  }

  // Wander: direction and speed each have independent randomized intervals.
  // This avoids synchronized motion updates while keeping deterministic behavior for a fixed seed.
  const wanderEnts = query(world, [Position, Direction, Speed, Wander]);
  for (let i = 0; i < wanderEnts.length; i++) {
    const eid = wanderEnts[i];
    if (waitSet.has(eid) || followSet.has(eid)) continue;
    const pers = getComponent(world, eid, WanderPersistence);
    let directionTicsLeft =
      pers?.ticsUntilDirectionChange ?? pers?.ticsUntilNextChange ?? 0;
    let speedTicsLeft =
      pers?.ticsUntilSpeedChange ?? pers?.ticsUntilNextChange ?? 0;

    if (directionTicsLeft > 0) {
      directionTicsLeft -= 1;
    }
    if (speedTicsLeft > 0) {
      speedTicsLeft -= 1;
    }

    addComponent(world, eid, WanderPersistence);
    const curDir = getComponent(world, eid, Direction);

    if (directionTicsLeft <= 0) {
      const delta =
        (rng.nextFloat() * 2 - 1) * WANDER_ANGLE_DELTA_MAX;
      let angle = curDir.angle + delta;
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;
      setComponent(world, eid, Direction, { angle });
      directionTicsLeft = randomDirectionIntervalTics(rng);
    }

    if (speedTicsLeft <= 0) {
      let tilesPerSec = WANDER_SPEED_MIN + rng.nextFloat() * (WANDER_SPEED_MAX - WANDER_SPEED_MIN);
      const maxSpeed = getComponent(world, eid, MaxSpeed);
      if (maxSpeed && maxSpeed.tilesPerSec != null) {
        tilesPerSec = Math.min(tilesPerSec, maxSpeed.tilesPerSec);
      }
      setComponent(world, eid, Speed, { tilesPerSec });
      speedTicsLeft = randomSpeedIntervalTics(rng);
    }

    setComponent(world, eid, WanderPersistence, {
      ticsUntilNextChange: Math.min(directionTicsLeft, speedTicsLeft),
      ticsUntilDirectionChange: directionTicsLeft,
      ticsUntilSpeedChange: speedTicsLeft,
    });
  }

  return world;
}
