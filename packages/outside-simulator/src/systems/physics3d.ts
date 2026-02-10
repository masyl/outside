import {
  Body,
  Box,
  ContactMaterial,
  Material,
  Plane,
  SAPBroadphase,
  Sphere,
  Vec3,
  World,
} from 'cannon-es';
import { addComponent, hasComponent, query, setComponent } from 'bitecs';
import type { CollisionEvent } from '../events';
import {
  ActualSpeed,
  Bounciness,
  Collided,
  Direction,
  FloorTile,
  Food,
  Grounded,
  Hero,
  JumpHeightScale,
  Kickable,
  Kicker,
  Obstacle,
  ObstacleSize,
  Position,
  PositionZ,
  SpeedBoostOnJump,
  Size,
  SoccerBall,
  Speed,
  VelocityZ,
} from '../components';
import type { SimulatorWorld } from '../world';

export interface Physics3dTuning {
  botKickBaseImpulse: number;
  botKickSpeedFactor: number;
  ballKickLiftBase: number;
  ballKickLiftBouncinessFactor: number;
  ballMaxHorizontalSpeed: number;
  ballGroundRestitution: number;
  ballActorRestitution: number;
  ballBallRestitution: number;
}

export const DEFAULT_PHYSICS3D_TUNING: Physics3dTuning = {
  botKickBaseImpulse: 0.22,
  botKickSpeedFactor: 0.06,
  ballKickLiftBase: 1.6,
  ballKickLiftBouncinessFactor: 0.8,
  ballMaxHorizontalSpeed: 9,
  ballGroundRestitution: 0.72,
  ballActorRestitution: 0.55,
  ballBallRestitution: 0.74,
};

export interface Physics3dState {
  world: World;
  bodyByEid: Map<number, Body>;
  eidByBodyId: Map<number, number>;
  collisionPairSeenThisTic: Set<string>;
  worldMaterial: Material;
  actorMaterial: Material;
  ballMaterial: Material;
  ballWorldContact: ContactMaterial;
  ballActorContact: ContactMaterial;
  ballBallContact: ContactMaterial;
}

const DEFAULT_DEBUG_JUMP_HEIGHT_TILES = 1.5;
const GRAVITY_TILES_PER_SEC2 = 25;
const MIN_DEBUG_JUMP_AIRTIME_SEC = 0.45;
const BOT_COLLISION_SHOVE_IMPULSE = 0.22;
const BALL_RECOIL_THRESHOLD_SPEED = 5;
const BALL_RECOIL_IMPULSE = 0.12;

function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function getPhysics3dTuning(world: SimulatorWorld): Physics3dTuning {
  return {
    ...DEFAULT_PHYSICS3D_TUNING,
    ...(world.physics3dTuning ?? {}),
  };
}

function applyContactTuning(state: Physics3dState, tuning: Physics3dTuning): void {
  state.ballWorldContact.restitution = Math.max(0, Math.min(1, tuning.ballGroundRestitution));
  state.ballActorContact.restitution = Math.max(0, Math.min(1, tuning.ballActorRestitution));
  state.ballBallContact.restitution = Math.max(0, Math.min(1, tuning.ballBallRestitution));
}

function createPhysicsState(world: SimulatorWorld): Physics3dState {
  const tuning = getPhysics3dTuning(world);
  const physicsWorld = new World({ gravity: new Vec3(0, -25, 0) });
  physicsWorld.broadphase = new SAPBroadphase(physicsWorld);
  physicsWorld.allowSleep = true;

  const worldMaterial = new Material('world');
  const actorMaterial = new Material('actor');
  const ballMaterial = new Material('ball');

  physicsWorld.defaultContactMaterial.friction = 0.35;
  physicsWorld.defaultContactMaterial.restitution = 0;
  const ballWorldContact = new ContactMaterial(ballMaterial, worldMaterial, {
    friction: 0.16,
    restitution: tuning.ballGroundRestitution,
  });
  const ballActorContact = new ContactMaterial(ballMaterial, actorMaterial, {
    friction: 0.2,
    restitution: tuning.ballActorRestitution,
  });
  const ballBallContact = new ContactMaterial(ballMaterial, ballMaterial, {
    friction: 0.12,
    restitution: tuning.ballBallRestitution,
  });
  physicsWorld.addContactMaterial(ballWorldContact);
  physicsWorld.addContactMaterial(ballActorContact);
  physicsWorld.addContactMaterial(ballBallContact);

  const planeBody = new Body({ mass: 0 });
  planeBody.material = worldMaterial;
  planeBody.addShape(new Plane());
  planeBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  physicsWorld.addBody(planeBody);

  const state: Physics3dState = {
    world: physicsWorld,
    bodyByEid: new Map(),
    eidByBodyId: new Map(),
    collisionPairSeenThisTic: new Set(),
    worldMaterial,
    actorMaterial,
    ballMaterial,
    ballWorldContact,
    ballActorContact,
    ballBallContact,
  };

  rebuildBodies(world, state);
  return state;
}

function clearDynamicCollided(world: SimulatorWorld): void {
  const collided = query(world, [Collided]);
  for (let i = 0; i < collided.length; i++) {
    const eid = collided[i];
    const ticks = Collided.ticksRemaining[eid] ?? 0;
    if (ticks > 0) {
      setComponent(world, eid, Collided, { ticksRemaining: ticks - 1 });
    }
  }
}

function bodyShapeFromEntity(world: SimulatorWorld, state: Physics3dState, eid: number): Body {
  if (hasComponent(world, eid, FloorTile) && hasComponent(world, eid, Obstacle)) {
    const body = new Body({ mass: 0 });
    body.material = state.worldMaterial;
    body.addShape(new Box(new Vec3(0.5, 0.5, 0.5)));
    body.position.set(Position.x[eid] + 0.5, 0.5, Position.y[eid] + 0.5);
    return body;
  }

  if (hasComponent(world, eid, Food)) {
    const diameter = Math.max(0.2, Size.diameter[eid] || 0.5);
    const half = diameter * 0.25;
    const body = new Body({ mass: 0 });
    body.material = state.worldMaterial;
    body.collisionResponse = false;
    body.addShape(new Box(new Vec3(half, half, half)));
    body.position.set(Position.x[eid], half, Position.y[eid]);
    return body;
  }

  if (hasComponent(world, eid, SoccerBall)) {
    const radius = Math.max(0.15, (ObstacleSize.diameter[eid] || 0.6) * 0.5);
    const bounciness = Math.max(0, Math.min(1, Bounciness.value[eid] ?? 0.78));
    const body = new Body({
      mass: 0.45,
      linearDamping: 0.22 - bounciness * 0.16,
      angularDamping: 0.45 - bounciness * 0.28,
    });
    body.material = state.ballMaterial;
    body.addShape(new Sphere(radius));
    const z = Number.isFinite(PositionZ.z[eid]) ? PositionZ.z[eid] : radius;
    body.position.set(Position.x[eid], Math.max(radius, z), Position.y[eid]);
    body.sleepSpeedLimit = 0.05;
    body.sleepTimeLimit = 0.35;
    return body;
  }

  const radius = Math.max(0.15, (ObstacleSize.diameter[eid] || 0.6) * 0.5);
  const body = new Body({ mass: 1, linearDamping: 0.25, angularDamping: 0.9 });
  body.material = state.actorMaterial;
  body.addShape(new Sphere(radius));
  const z = Number.isFinite(PositionZ.z[eid]) ? PositionZ.z[eid] : radius;
  body.position.set(Position.x[eid], Math.max(radius, z), Position.y[eid]);
  return body;
}

function shouldHaveBody(world: SimulatorWorld, eid: number): boolean {
  if (!hasComponent(world, eid, Position)) return false;
  if (hasComponent(world, eid, FloorTile) && hasComponent(world, eid, Obstacle)) return true;
  if (hasComponent(world, eid, Food)) return true;
  if (hasComponent(world, eid, ObstacleSize)) return true;
  return false;
}

function rebuildBodies(world: SimulatorWorld, state: Physics3dState): void {
  const candidates = query(world, [Position]);
  const seen = new Set<number>();

  for (let i = 0; i < candidates.length; i++) {
    const eid = candidates[i];
    if (!shouldHaveBody(world, eid)) continue;
    seen.add(eid);
    if (state.bodyByEid.has(eid)) continue;

    const body = bodyShapeFromEntity(world, state, eid);
    state.world.addBody(body);
    state.bodyByEid.set(eid, body);
    state.eidByBodyId.set(body.id, eid);
  }

  for (const [eid, body] of state.bodyByEid.entries()) {
    if (seen.has(eid)) continue;
    state.world.removeBody(body);
    state.bodyByEid.delete(eid);
    state.eidByBodyId.delete(body.id);
  }
}

function applyDesiredVelocity(world: SimulatorWorld, state: Physics3dState): void {
  for (const [eid, body] of state.bodyByEid.entries()) {
    if (!hasComponent(world, eid, ObstacleSize)) continue;
    if (!hasComponent(world, eid, Direction)) continue;
    if (!hasComponent(world, eid, Speed)) continue;

    const angle = Direction.angle[eid] ?? 0;
    const speed = Math.max(0, Speed.tilesPerSec[eid] ?? 0);
    const desiredX = Math.cos(angle) * speed;
    const desiredZ = Math.sin(angle) * speed;
    const impulseX = (desiredX - body.velocity.x) * 0.08;
    const impulseZ = (desiredZ - body.velocity.z) * 0.08;
    body.applyImpulse(new Vec3(impulseX, 0, impulseZ));
  }
}

function syncBackToEcs(world: SimulatorWorld, state: Physics3dState): void {
  for (const [eid, body] of state.bodyByEid.entries()) {
    // Only dynamic mover entities should write back transformed positions.
    // Static wall tiles keep bottom-left tile coordinates for renderer alignment.
    if (!hasComponent(world, eid, Position)) continue;
    if (!hasComponent(world, eid, ObstacleSize)) continue;

    setComponent(world, eid, Position, {
      x: body.position.x,
      y: body.position.z,
    });

    if (!hasComponent(world, eid, PositionZ)) {
      addComponent(world, eid, PositionZ);
    }
    setComponent(world, eid, PositionZ, {
      z: body.position.y,
    });

    if (!hasComponent(world, eid, VelocityZ)) {
      addComponent(world, eid, VelocityZ);
    }
    setComponent(world, eid, VelocityZ, {
      z: body.velocity.y,
    });

    const radius = hasComponent(world, eid, ObstacleSize)
      ? Math.max(0.15, (ObstacleSize.diameter[eid] || 0.6) * 0.5)
      : 0;
    const grounded = radius > 0 && body.position.y <= radius + 0.03 ? 1 : 0;
    if (!hasComponent(world, eid, Grounded)) {
      addComponent(world, eid, Grounded);
    }
    setComponent(world, eid, Grounded, { value: grounded });

    if (!hasComponent(world, eid, ActualSpeed)) {
      addComponent(world, eid, ActualSpeed);
    }
    const linearSpeed = body.velocity.length();
    setComponent(world, eid, ActualSpeed, {
      // Pull scalar speed from Cannon directly so inspector reflects physics state.
      tilesPerSec: Number.isFinite(linearSpeed) ? linearSpeed : 0,
    });
  }
}

function emitDynamicCollisionEvents(world: SimulatorWorld, state: Physics3dState): void {
  state.collisionPairSeenThisTic.clear();

  for (let i = 0; i < state.world.contacts.length; i++) {
    const contact = state.world.contacts[i];
    const eidA = state.eidByBodyId.get(contact.bi.id);
    const eidB = state.eidByBodyId.get(contact.bj.id);
    if (eidA == null || eidB == null) continue;

    if (!hasComponent(world, eidA, ObstacleSize) || !hasComponent(world, eidB, ObstacleSize)) {
      continue;
    }

    const key = pairKey(eidA, eidB);
    if (state.collisionPairSeenThisTic.has(key)) continue;
    state.collisionPairSeenThisTic.add(key);

    world.eventQueue.push({
      type: 'collision',
      entityA: eidA,
      entityB: eidB,
    } satisfies CollisionEvent);

    setComponent(world, eidA, Collided, { ticksRemaining: 2 });
    setComponent(world, eidB, Collided, { ticksRemaining: 2 });
    applyKickImpulseForPair(world, eidA, eidB, contact.bi, contact.bj);
    applyBallRecoilForPair(world, eidA, eidB, contact.bi, contact.bj);
    applyBotCollisionShove(world, eidA, eidB, contact.bi, contact.bj);
  }
}

function isShovableBot(world: SimulatorWorld, eid: number): boolean {
  if (!hasComponent(world, eid, ObstacleSize)) return false;
  if (hasComponent(world, eid, FloorTile)) return false;
  if (hasComponent(world, eid, Food)) return false;
  if (hasComponent(world, eid, Hero)) return false;
  return true;
}

function isKickerEntity(world: SimulatorWorld, eid: number): boolean {
  return hasComponent(world, eid, Kicker) && hasComponent(world, eid, ObstacleSize);
}

function isKickableEntity(world: SimulatorWorld, eid: number): boolean {
  return hasComponent(world, eid, Kickable) && hasComponent(world, eid, SoccerBall);
}

function clampHorizontalSpeed(body: Body, maxSpeed: number): void {
  const vx = body.velocity.x;
  const vz = body.velocity.z;
  const speed = Math.hypot(vx, vz);
  if (!Number.isFinite(speed) || speed <= maxSpeed || speed <= 1e-6) return;
  const scale = maxSpeed / speed;
  body.velocity.x *= scale;
  body.velocity.z *= scale;
}

function applyKickImpulseForPair(
  world: SimulatorWorld,
  eidA: number,
  eidB: number,
  bodyA: Body,
  bodyB: Body
): void {
  const aKickerBKickable = isKickerEntity(world, eidA) && isKickableEntity(world, eidB);
  const bKickerAKickable = isKickerEntity(world, eidB) && isKickableEntity(world, eidA);
  if (!aKickerBKickable && !bKickerAKickable) return;

  const kickerBody = aKickerBKickable ? bodyA : bodyB;
  const ballBody = aKickerBKickable ? bodyB : bodyA;
  const ballEid = aKickerBKickable ? eidB : eidA;

  let dx = ballBody.position.x - kickerBody.position.x;
  let dz = ballBody.position.z - kickerBody.position.z;
  const len = Math.hypot(dx, dz);
  if (len <= 1e-6) return;
  dx /= len;
  dz /= len;

  const kickerSpeed = Math.hypot(kickerBody.velocity.x, kickerBody.velocity.z);
  const tuning = getPhysics3dTuning(world);
  const impulse = tuning.botKickBaseImpulse + kickerSpeed * tuning.botKickSpeedFactor;
  ballBody.applyImpulse(new Vec3(dx * impulse, 0, dz * impulse));

  const bounciness = Math.max(0, Math.min(1, Bounciness.value[ballEid] ?? 0.78));
  const lift = tuning.ballKickLiftBase + bounciness * tuning.ballKickLiftBouncinessFactor;
  if (ballBody.velocity.y < lift) {
    ballBody.velocity.y = lift;
  }

  clampHorizontalSpeed(ballBody, tuning.ballMaxHorizontalSpeed);
  kickerBody.applyImpulse(new Vec3(-dx * impulse * 0.12, 0, -dz * impulse * 0.12));
}

function isRecoilTarget(world: SimulatorWorld, eid: number): boolean {
  if (!hasComponent(world, eid, ObstacleSize)) return false;
  if (hasComponent(world, eid, FloorTile)) return false;
  if (hasComponent(world, eid, Food)) return false;
  return true;
}

function applyBallRecoilForPair(
  world: SimulatorWorld,
  eidA: number,
  eidB: number,
  bodyA: Body,
  bodyB: Body
): void {
  const aBall = hasComponent(world, eidA, SoccerBall);
  const bBall = hasComponent(world, eidB, SoccerBall);
  if (aBall === bBall) return;

  const ballBody = aBall ? bodyA : bodyB;
  const targetEid = aBall ? eidB : eidA;
  const targetBody = aBall ? bodyB : bodyA;
  if (!isRecoilTarget(world, targetEid)) return;

  const ballSpeed = Math.hypot(ballBody.velocity.x, ballBody.velocity.z);
  if (ballSpeed < BALL_RECOIL_THRESHOLD_SPEED) return;

  const nx = ballBody.velocity.x / Math.max(1e-6, ballSpeed);
  const nz = ballBody.velocity.z / Math.max(1e-6, ballSpeed);
  const power = Math.min(2, ballSpeed / BALL_RECOIL_THRESHOLD_SPEED);
  targetBody.applyImpulse(
    new Vec3(nx * BALL_RECOIL_IMPULSE * power, 0, nz * BALL_RECOIL_IMPULSE * power)
  );
}

function applyBotCollisionShove(
  world: SimulatorWorld,
  eidA: number,
  eidB: number,
  bodyA: Body,
  bodyB: Body
): void {
  if (!isShovableBot(world, eidA) || !isShovableBot(world, eidB)) {
    return;
  }

  // Deterministic tie-break: lower eid gets shoved.
  const shoveEid = eidA < eidB ? eidA : eidB;
  const shovedBody = shoveEid === eidA ? bodyA : bodyB;
  const pusherBody = shoveEid === eidA ? bodyB : bodyA;

  let dx = shovedBody.position.x - pusherBody.position.x;
  let dz = shovedBody.position.z - pusherBody.position.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-5) {
    // If perfectly overlapped on horizontal plane, choose deterministic side axis.
    dx = 0;
    dz = shoveEid % 2 === 0 ? 1 : -1;
  } else {
    dx /= len;
    dz /= len;
    // Push sideways (perpendicular), not head-on, to break blocking.
    const sideSign = shoveEid % 2 === 0 ? 1 : -1;
    const sideX = -dz * sideSign;
    const sideZ = dx * sideSign;
    dx = sideX;
    dz = sideZ;
  }

  shovedBody.applyImpulse(
    new Vec3(dx * BOT_COLLISION_SHOVE_IMPULSE, 0, dz * BOT_COLLISION_SHOVE_IMPULSE)
  );
}

export function physics3dSystem(world: SimulatorWorld): SimulatorWorld {
  if (!world.physics3dState) {
    world.physics3dState = createPhysicsState(world);
  }

  const state = world.physics3dState;
  applyContactTuning(state, getPhysics3dTuning(world));
  clearDynamicCollided(world);
  rebuildBodies(world, state);
  applyDesiredVelocity(world, state);
  state.world.step(Math.max(0.001, world.ticDurationMs / 1000));
  emitDynamicCollisionEvents(world, state);
  syncBackToEcs(world, state);
  return world;
}

export function configurePhysics3dTuning(
  world: SimulatorWorld,
  patch: Partial<Physics3dTuning>
): void {
  world.physics3dTuning = {
    ...(world.physics3dTuning ?? {}),
    ...patch,
  };
  if (!world.physics3dState) return;
  applyContactTuning(world.physics3dState, getPhysics3dTuning(world));
}

/**
 * Applies an immediate jump pulse to grounded dynamic entities.
 * Includes optional per-entity takeoff speed boost via SpeedBoostOnJump.
 * Intended for debugging/visual validation in tooling.
 *
 * @returns number of bodies that received a jump impulse.
 */
export function debugJumpPulse(
  world: SimulatorWorld,
  jumpHeightTiles: number = DEFAULT_DEBUG_JUMP_HEIGHT_TILES,
  targetEid?: number
): number {
  if (!world.physics3dState) return 0;
  const height = Math.max(0, jumpHeightTiles);
  const velocityForHeight = Math.sqrt(2 * GRAVITY_TILES_PER_SEC2 * height);
  const velocityForAirtime = (GRAVITY_TILES_PER_SEC2 * MIN_DEBUG_JUMP_AIRTIME_SEC) / 2;
  const jumpVelocity = Math.max(velocityForHeight, velocityForAirtime);
  if (!Number.isFinite(jumpVelocity) || jumpVelocity <= 0) return 0;

  let applied = 0;
  for (const [eid, body] of world.physics3dState.bodyByEid.entries()) {
    if (targetEid != null && eid !== targetEid) continue;
    if (!hasComponent(world, eid, ObstacleSize)) continue;
    const grounded = hasComponent(world, eid, Grounded) ? (Grounded.value[eid] ?? 0) : 0;
    if (grounded <= 0) continue;
    const jumpScale = hasComponent(world, eid, JumpHeightScale)
      ? Math.max(0, JumpHeightScale.value[eid] ?? 1)
      : 1;
    const scaledJumpVelocity = jumpVelocity * jumpScale;
    if (body.velocity.y < scaledJumpVelocity) {
      body.velocity.y = scaledJumpVelocity;
      const boost = hasComponent(world, eid, SpeedBoostOnJump)
        ? Math.max(0, SpeedBoostOnJump.tilesPerSec[eid] ?? 0)
        : 0;
      if (boost > 0) {
        let dirX = body.velocity.x;
        let dirZ = body.velocity.z;
        const horizontalSpeed = Math.hypot(dirX, dirZ);
        if (horizontalSpeed > 1e-5) {
          dirX /= horizontalSpeed;
          dirZ /= horizontalSpeed;
        } else if (hasComponent(world, eid, Direction)) {
          const angle = Direction.angle[eid] ?? 0;
          dirX = Math.cos(angle);
          dirZ = Math.sin(angle);
        } else {
          dirX = 1;
          dirZ = 0;
        }
        body.velocity.x += dirX * boost;
        body.velocity.z += dirZ * boost;
      }
      applied += 1;
    }
  }
  return applied;
}
