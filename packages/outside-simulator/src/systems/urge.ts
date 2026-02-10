/**
 * Urge system: sets direction and target pace from Wait, Wander, or Follow urges.
 * Speed is derived centrally by paceSystem.
 * @packageDocumentation
 */

import { addComponent, getComponent, hasComponent, query, removeComponent, setComponent } from 'bitecs';
import {
  DestinationDeadline,
  Direction,
  Follow,
  FollowTarget,
  FollowTightness,
  Hero,
  Position,
  RunningSpeed,
  TargetPace,
  Wait,
  WalkingSpeed,
  Wander,
  WanderPersistence,
} from '../components';
import { findPath, getPassableTiles } from '../pathfinding';
import {
  TARGET_PACE_RUNNING,
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  type TargetPaceValue,
} from '../pace';
import type { SimulatorWorld } from '../world';

const CLOSE_ENOUGH = 2;
const SPEED_UP_THRESHOLD = 3;
const WANDER_SPEED_TICS_MIN = 10;
const WANDER_SPEED_TICS_MAX = 30;
const WANDER_ANGLE_DELTA_MAX = (15 * Math.PI) / 180;
const WANDER_TARGET_RADIUS = 25;
const WANDER_TARGET_MIN_DISTANCE = 15;
const WANDER_TARGET_MAX_DISTANCE = 25;
const WANDER_RUN_CHANCE = 0.55;
const DESTINATION_RETRY_TICS = 8;
const DEADLINE_MIN_BUFFER_SEC = 0.8;
const DEADLINE_BUFFER_RATIO = 0.35;

function angleToward(x: number, y: number, toX: number, toY: number): number {
  return Math.atan2(toY - y, toX - x);
}

function normalizeAngleDiff(rad: number): number {
  let r = rad;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

function randomSpeedIntervalTics(rng: SimulatorWorld['random']): number {
  return (
    WANDER_SPEED_TICS_MIN +
    Math.floor(rng.nextFloat() * (WANDER_SPEED_TICS_MAX - WANDER_SPEED_TICS_MIN + 1))
  );
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function resolveNavigablePathStart(
  passable: Set<string>,
  fromX: number,
  fromY: number
): { x: number; y: number } | null {
  const sx = Math.floor(fromX);
  const sy = Math.floor(fromY);
  if (passable.has(key(sx, sy))) {
    return { x: fromX, y: fromY };
  }

  let best: { x: number; y: number; d: number } | null = null;
  const SEARCH_RADIUS = 3;
  for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
      const tx = sx + dx;
      const ty = sy + dy;
      if (!passable.has(key(tx, ty))) continue;
      const d = Math.hypot(dx, dy);
      if (best == null || d < best.d) {
        best = { x: tx, y: ty, d };
      }
    }
  }

  if (best == null) return null;
  return { x: best.x + 0.5, y: best.y + 0.5 };
}

function setTargetPace(world: SimulatorWorld, eid: number, pace: TargetPaceValue): void {
  if (!hasComponent(world, eid, TargetPace)) {
    addComponent(world, eid, TargetPace);
  }
  setComponent(world, eid, TargetPace, { value: pace });
}

function chooseWanderPace(
  rng: SimulatorWorld['random'],
  heroSet: Set<number>,
  eid: number
): TargetPaceValue {
  if (heroSet.has(eid)) {
    return TARGET_PACE_RUNNING;
  }
  return rng.nextFloat() < WANDER_RUN_CHANCE ? TARGET_PACE_RUNNING : TARGET_PACE_WALKING;
}

function computeDestinationDeadlineTics(
  world: SimulatorWorld,
  eid: number,
  pathTileCount: number
): number {
  const ticsPerSecond = 1000 / Math.max(1, world.ticDurationMs);
  const walkingSpeed = Math.max(0.5, WalkingSpeed.tilesPerSec[eid] ?? 0);
  const runningSpeed = Math.max(0, RunningSpeed.tilesPerSec[eid] ?? 0);
  // Use a conservative cruise estimate so short stalls/collisions do not force early retarget.
  const cruiseSpeed = Math.max(0.5, Math.min(walkingSpeed * 1.2, Math.max(walkingSpeed, runningSpeed * 0.6)));
  const travelSec = Math.max(0, pathTileCount) / cruiseSpeed;
  const bufferSec = Math.max(DEADLINE_MIN_BUFFER_SEC, travelSec * DEADLINE_BUFFER_RATIO);
  return Math.max(1, Math.ceil((travelSec + bufferSec) * ticsPerSecond));
}

function pickNearbyReachableTarget(
  world: SimulatorWorld,
  passable: Set<string>,
  fromX: number,
  fromY: number,
  rng: SimulatorWorld['random']
): { x: number; y: number } | null {
  const pathStart = resolveNavigablePathStart(passable, fromX, fromY);
  if (pathStart == null) return null;
  const fx = Math.floor(fromX);
  const fy = Math.floor(fromY);
  const candidates: Array<{ x: number; y: number }> = [];

  for (let dy = -WANDER_TARGET_RADIUS; dy <= WANDER_TARGET_RADIUS; dy++) {
    for (let dx = -WANDER_TARGET_RADIUS; dx <= WANDER_TARGET_RADIUS; dx++) {
      if (dx === 0 && dy === 0) continue;
      const tx = fx + dx;
      const ty = fy + dy;
      if (!passable.has(key(tx, ty))) continue;
      const dist = Math.hypot(dx, dy);
      if (dist < WANDER_TARGET_MIN_DISTANCE || dist > WANDER_TARGET_MAX_DISTANCE) continue;
      candidates.push({ x: tx, y: ty });
    }
  }
  if (candidates.length === 0) return null;

  const maxAttempts = Math.min(20, candidates.length);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const idx = Math.floor(rng.nextFloat() * candidates.length) % candidates.length;
    const target = candidates[idx];
    const path = findPath(
      world,
      { x: pathStart.x, y: pathStart.y },
      { x: target.x + 0.5, y: target.y + 0.5 }
    );
    if (path.length > 1) return target;
  }
  return null;
}

export function urgeSystem(world: SimulatorWorld): SimulatorWorld {
  const rng = world.random;
  const heroSet = new Set(query(world, [Hero]));
  const passable = getPassableTiles(world);

  const waitEnts = query(world, [Position, Direction, TargetPace, Wait]);
  const waitSet = new Set(waitEnts);
  for (let i = 0; i < waitEnts.length; i++) {
    setTargetPace(world, waitEnts[i], TARGET_PACE_STANDING_STILL);
  }

  const followEnts = query(world, [Position, Direction, TargetPace, Follow, FollowTarget]);
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
      setComponent(world, eid, Direction, { angle: rng.nextFloat() * Math.PI * 2 });
      setTargetPace(world, eid, TARGET_PACE_WALKING);
      continue;
    }

    const d = Math.hypot(targetPos.x - pos.x, targetPos.y - pos.y);
    const targetAngle = angleToward(pos.x, pos.y, targetPos.x, targetPos.y);
    const tightnessComp = getComponent(world, eid, FollowTightness);
    const tightness = tightnessComp?.value != null ? tightnessComp.value : 0;
    const blend = 1 - Math.max(0, Math.min(1, tightness));
    const angleDiff = normalizeAngleDiff(targetAngle - curDir.angle);
    setComponent(world, eid, Direction, { angle: curDir.angle + angleDiff * blend });

    if (d < CLOSE_ENOUGH) {
      setTargetPace(world, eid, TARGET_PACE_STANDING_STILL);
    } else if (d <= SPEED_UP_THRESHOLD) {
      setTargetPace(world, eid, TARGET_PACE_WALKING);
    } else {
      setTargetPace(world, eid, TARGET_PACE_RUNNING);
    }
  }

  const wanderEnts = query(world, [Position, Direction, TargetPace, Wander]);
  for (let i = 0; i < wanderEnts.length; i++) {
    const eid = wanderEnts[i];
    if (waitSet.has(eid) || followSet.has(eid)) continue;

    const pers = getComponent(world, eid, WanderPersistence);
    const deadline = getComponent(world, eid, DestinationDeadline);
    let speedTicsLeft = pers?.ticsUntilSpeedChange ?? pers?.ticsUntilNextChange ?? 0;
    if (speedTicsLeft > 0) {
      speedTicsLeft -= 1;
    }

    addComponent(world, eid, WanderPersistence);
    addComponent(world, eid, DestinationDeadline);
    const curDir = getComponent(world, eid, Direction);
    const curPos = getComponent(world, eid, Position);
    let deadlineTicsLeft = deadline?.ticsRemaining ?? 0;
    if (deadlineTicsLeft > 0) {
      deadlineTicsLeft -= 1;
    }

    const persistedTargetX = pers?.targetTileX;
    const persistedTargetY = pers?.targetTileY;
    let targetTileX = Number.isFinite(persistedTargetX)
      ? Math.floor(persistedTargetX)
      : Math.floor(curPos.x);
    let targetTileY = Number.isFinite(persistedTargetY)
      ? Math.floor(persistedTargetY)
      : Math.floor(curPos.y);
    const hasStoredTarget =
      Number.isFinite(persistedTargetX) &&
      Number.isFinite(persistedTargetY);
    const currentTargetDist = Math.hypot(targetTileX + 0.5 - curPos.x, targetTileY + 0.5 - curPos.y);
    const targetPassable = passable.has(key(targetTileX, targetTileY));
    const destinationExpired = deadlineTicsLeft <= 0;
    let destinationChanged = false;
    const pathStart = resolveNavigablePathStart(passable, curPos.x, curPos.y);

    if (
      !hasStoredTarget ||
      !targetPassable ||
      currentTargetDist < 0.4 ||
      destinationExpired
    ) {
      const nextTarget = pickNearbyReachableTarget(world, passable, curPos.x, curPos.y, rng);
      if (nextTarget) {
        targetTileX = nextTarget.x;
        targetTileY = nextTarget.y;
        destinationChanged = true;
      }
    }

    let pathToTarget =
      pathStart == null
        ? []
        : findPath(
            world,
            { x: pathStart.x, y: pathStart.y },
            { x: targetTileX + 0.5, y: targetTileY + 0.5 }
          );

    if (pathToTarget.length < 2) {
      const fallbackTarget = pickNearbyReachableTarget(world, passable, curPos.x, curPos.y, rng);
      if (fallbackTarget) {
        targetTileX = fallbackTarget.x;
        targetTileY = fallbackTarget.y;
        destinationChanged = true;
        const fallbackStart = resolveNavigablePathStart(passable, curPos.x, curPos.y);
        pathToTarget =
          fallbackStart == null
            ? []
            : findPath(
                world,
                { x: fallbackStart.x, y: fallbackStart.y },
                { x: targetTileX + 0.5, y: targetTileY + 0.5 }
              );
      }
    }

    const hasRoute = pathToTarget.length >= 2;
    if (hasRoute) {
      const pathTiles = Math.max(0, pathToTarget.length - 1);
      if (destinationChanged || destinationExpired || !Number.isFinite(deadline?.pathTiles ?? NaN)) {
        deadlineTicsLeft = computeDestinationDeadlineTics(world, eid, pathTiles);
      }
      setComponent(world, eid, DestinationDeadline, {
        ticsRemaining: deadlineTicsLeft,
        pathTiles,
      });
    } else {
      deadlineTicsLeft = DESTINATION_RETRY_TICS;
      setComponent(world, eid, DestinationDeadline, {
        ticsRemaining: deadlineTicsLeft,
        pathTiles: 0,
      });
    }

    if (hasRoute) {
      const nextStep = pathToTarget[1];
      const desiredAngle = angleToward(curPos.x, curPos.y, nextStep.x + 0.5, nextStep.y + 0.5);
      const angleDiff = normalizeAngleDiff(desiredAngle - curDir.angle);
      const maxTurn = WANDER_ANGLE_DELTA_MAX * 2;
      const clamped = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
      let nextAngle = curDir.angle + clamped;
      while (nextAngle > Math.PI) nextAngle -= Math.PI * 2;
      while (nextAngle < -Math.PI) nextAngle += Math.PI * 2;
      setComponent(world, eid, Direction, { angle: nextAngle });
    }

    if (speedTicsLeft <= 0) {
      if (hasRoute) {
        setTargetPace(world, eid, chooseWanderPace(rng, heroSet, eid));
      } else {
        setTargetPace(world, eid, TARGET_PACE_STANDING_STILL);
      }
      speedTicsLeft = randomSpeedIntervalTics(rng);
    } else if (!hasRoute) {
      setTargetPace(world, eid, TARGET_PACE_STANDING_STILL);
    }

    setComponent(world, eid, WanderPersistence, {
      ticsUntilNextChange: Math.min(speedTicsLeft, deadlineTicsLeft),
      ticsUntilDirectionChange: 0,
      ticsUntilSpeedChange: speedTicsLeft,
      targetTileX,
      targetTileY,
      ticsUntilRetarget: deadlineTicsLeft,
    });
  }

  return world;
}
