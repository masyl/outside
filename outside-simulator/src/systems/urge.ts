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
/** Wander: tics between direction/speed changes (≈0.5–1.5 s at 50 ms/tic, twice as often). */
const WANDER_TICS_MIN = 10;
const WANDER_TICS_MAX = 30;
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

  // Wander: persist direction/speed for 1–3 s then pick new (smooth walk). Skip Wait/Follow.
  // Use getComponent/setComponent for WanderPersistence so observer path matches Direction/Speed.
  const wanderEnts = query(world, [Position, Direction, Speed, Wander]);
  for (let i = 0; i < wanderEnts.length; i++) {
    const eid = wanderEnts[i];
    if (waitSet.has(eid) || followSet.has(eid)) continue;
    const pers = getComponent(world, eid, WanderPersistence);
    const ticsLeft = pers?.ticsUntilNextChange ?? 0;
    if (ticsLeft > 0) {
      setComponent(world, eid, WanderPersistence, { ticsUntilNextChange: ticsLeft - 1 });
      continue;
    }
    addComponent(world, eid, WanderPersistence);
    const curDir = getComponent(world, eid, Direction);
    const delta =
      (rng.nextFloat() * 2 - 1) * WANDER_ANGLE_DELTA_MAX;
    let angle = curDir.angle + delta;
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    let tilesPerSec = WANDER_SPEED_MIN + rng.nextFloat() * (WANDER_SPEED_MAX - WANDER_SPEED_MIN);
    const maxSpeed = getComponent(world, eid, MaxSpeed);
    if (maxSpeed && maxSpeed.tilesPerSec != null) {
      tilesPerSec = Math.min(tilesPerSec, maxSpeed.tilesPerSec);
    }
    setComponent(world, eid, Direction, { angle });
    setComponent(world, eid, Speed, { tilesPerSec });
    const nextTics =
      WANDER_TICS_MIN + Math.floor(rng.nextFloat() * (WANDER_TICS_MAX - WANDER_TICS_MIN + 1));
    setComponent(world, eid, WanderPersistence, { ticsUntilNextChange: nextTics });
  }

  return world;
}
