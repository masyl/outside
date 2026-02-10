/**
 * Default bot entity prefab: movable entity with Position, Size, Direction, Speed, MaxSpeed.
 * Wander/WanderPersistence are added per-entity in spawnBot so urge state is not shared via prefab.
 * Use spawnBot to create instances that inherit prefab defaults; override with options.
 *
 * @packageDocumentation
 */

import {
  addPrefab,
  addEntity,
  addComponent,
  set,
  IsA,
  setComponent,
} from 'bitecs';
import {
  Position,
  PositionZ,
  VelocityZ,
  Grounded,
  VisualSize,
  ObstacleSize,
  Size,
  Obstacle,
  Direction,
  Speed,
  WalkingSpeed,
  RunningSpeed,
  TargetPace,
  Acceleration,
  Deceleration,
  DestinationDeadline,
  Wander,
  WanderPersistence,
  Wait,
  Follow,
  FollowTarget,
  FollowTightness,
  Kicker,
  JumpHeightScale,
  MaxSpeed,
  PointerTarget,
  Observed,
  SpeedBoostOnJump,
  DefaultSpriteKey,
  VariantSpriteKey,
} from '../components';
import {
  TARGET_PACE_RUNNING,
  TARGET_PACE_RUNNING_FAST,
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  TARGET_PACE_WALKING_SLOW,
} from '../pace';
import type { SimulatorWorld } from '../world';

const prefabByWorld = new WeakMap<SimulatorWorld, number>();

/** Default bot values (overridable at spawn). */
const DEFAULTS = {
  x: 0,
  y: 0,
  visualDiameter: 1.2,
  obstacleDiameter: 0.8,
  directionRad: 0,
  tilesPerSec: 0,
  walkingSpeedTps: 3,
  runningSpeedTps: 9,
  accelerationTps2: 20,
  decelerationTps2: 24,
  maxSpeedTps: 12,
} as const;

/**
 * Returns the bot prefab entity id for the world, creating it on first call.
 *
 * @param world - Simulator world
 * @returns Prefab entity id
 */
export function getOrCreateBotPrefab(world: SimulatorWorld): number {
  let prefabEid = prefabByWorld.get(world);
  if (prefabEid !== undefined) return prefabEid;

  prefabEid = addPrefab(world);
  addComponent(world, prefabEid, set(Position, { x: DEFAULTS.x, y: DEFAULTS.y }));
  addComponent(world, prefabEid, set(VisualSize, { diameter: DEFAULTS.visualDiameter }));
  addComponent(world, prefabEid, set(ObstacleSize, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, set(Size, { diameter: DEFAULTS.obstacleDiameter }));
  addComponent(world, prefabEid, Obstacle);
  addComponent(world, prefabEid, set(Direction, { angle: DEFAULTS.directionRad }));
  addComponent(world, prefabEid, set(Speed, { tilesPerSec: DEFAULTS.tilesPerSec }));
  addComponent(world, prefabEid, set(WalkingSpeed, { tilesPerSec: DEFAULTS.walkingSpeedTps }));
  addComponent(world, prefabEid, set(RunningSpeed, { tilesPerSec: DEFAULTS.runningSpeedTps }));
  addComponent(world, prefabEid, set(Acceleration, { tilesPerSec2: DEFAULTS.accelerationTps2 }));
  addComponent(world, prefabEid, set(Deceleration, { tilesPerSec2: DEFAULTS.decelerationTps2 }));
  addComponent(world, prefabEid, set(TargetPace, { value: TARGET_PACE_STANDING_STILL }));
  addComponent(world, prefabEid, set(MaxSpeed, { tilesPerSec: DEFAULTS.maxSpeedTps }));
  addComponent(world, prefabEid, set(JumpHeightScale, { value: 1 }));
  addComponent(world, prefabEid, set(SpeedBoostOnJump, { tilesPerSec: 0.7 }));
  addComponent(world, prefabEid, Kicker);
  addComponent(world, prefabEid, PointerTarget);
  addComponent(world, prefabEid, set(DefaultSpriteKey, { value: 'actor.bot' }));
  addComponent(world, prefabEid, set(VariantSpriteKey, { value: '' }));
  // Wander + WanderPersistence are added per-entity in spawnBot so each bot has its own slot (no prefab inheritance for urge state)

  prefabByWorld.set(world, prefabEid);
  return prefabEid;
}

export interface SpawnBotOptions {
  x?: number;
  y?: number;
  /** If set, overrides both visualDiameter and obstacleDiameter (for tests / backward compat). */
  diameter?: number;
  /** Visual diameter in tiles (rendering). Default 1.2. */
  visualDiameter?: number;
  /** Obstacle diameter in tiles (collision). Default 0.8. */
  obstacleDiameter?: number;
  directionRad?: number;
  walkingSpeedTps?: number;
  runningSpeedTps?: number;
  accelerationTps2?: number;
  decelerationTps2?: number;
  tilesPerSec?: number;
  /** Urge: wait (no move), wander (random walk), follow (steer toward target), or none (keep initial dir/speed). Default: wander. */
  urge?: 'wait' | 'wander' | 'follow' | 'none';
  /** Target entity id for follow urge. Required when urge === 'follow'. */
  followTargetEid?: number;
  /** Follow tightness (0 = instant, higher = slower adjustment). Optional. */
  followTightness?: number;
  /** Optional default sprite key override. */
  spriteKey?: string;
  /** Optional sprite variant key. */
  variantSpriteKey?: string;
}

/**
 * Spawns a bot entity that inherits from the bot prefab. Pass options to override defaults.
 *
 * @param world - Simulator world
 * @param options - Optional overrides for position, size, direction, speed
 * @returns New entity id
 */
export function spawnBot(
  world: SimulatorWorld,
  options?: SpawnBotOptions
): number {
  const prefabEid = getOrCreateBotPrefab(world);
  const eid = addEntity(world);
  addComponent(world, eid, IsA(prefabEid));
  addComponent(world, eid, Observed);
  // Always materialize sprite keys on instance so renderer does not depend on IsA copy behavior.
  setComponent(world, eid, DefaultSpriteKey, { value: options?.spriteKey ?? 'actor.bot' });
  setComponent(world, eid, VariantSpriteKey, { value: options?.variantSpriteKey ?? '' });

  if (options?.x !== undefined || options?.y !== undefined) {
    setComponent(world, eid, Position, {
      x: options.x ?? DEFAULTS.x,
      y: options.y ?? DEFAULTS.y,
    });
  }
  if (options?.diameter !== undefined) {
    setComponent(world, eid, VisualSize, { diameter: options.diameter });
    setComponent(world, eid, ObstacleSize, { diameter: options.diameter });
    setComponent(world, eid, Size, { diameter: options.diameter });
  } else {
    if (options?.visualDiameter !== undefined) {
      setComponent(world, eid, VisualSize, { diameter: options.visualDiameter });
    }
    if (options?.obstacleDiameter !== undefined) {
      setComponent(world, eid, ObstacleSize, { diameter: options.obstacleDiameter });
      setComponent(world, eid, Size, { diameter: options.obstacleDiameter });
    }
  }
  const obstacleDiameter =
    options?.diameter ??
    options?.obstacleDiameter ??
    DEFAULTS.obstacleDiameter;
  const radius = Math.max(0.15, obstacleDiameter * 0.5);
  setComponent(world, eid, PositionZ, { z: radius });
  setComponent(world, eid, VelocityZ, { z: 0 });
  setComponent(world, eid, Grounded, { value: 1 });
  if (options?.directionRad !== undefined) {
    setComponent(world, eid, Direction, { angle: options.directionRad });
  }
  if (options?.tilesPerSec !== undefined) {
    setComponent(world, eid, Speed, { tilesPerSec: options.tilesPerSec });
  }
  if (options?.walkingSpeedTps !== undefined) {
    setComponent(world, eid, WalkingSpeed, { tilesPerSec: options.walkingSpeedTps });
  }
  if (options?.runningSpeedTps !== undefined) {
    setComponent(world, eid, RunningSpeed, { tilesPerSec: options.runningSpeedTps });
  }
  if (options?.accelerationTps2 !== undefined) {
    setComponent(world, eid, Acceleration, { tilesPerSec2: options.accelerationTps2 });
  }
  if (options?.decelerationTps2 !== undefined) {
    setComponent(world, eid, Deceleration, { tilesPerSec2: options.decelerationTps2 });
  }

  const urge = options?.urge ?? 'wander';
  if (urge === 'follow' && options?.followTargetEid != null) {
    addComponent(world, eid, Follow);
    addComponent(world, eid, FollowTarget);
    FollowTarget.eid[eid] = options.followTargetEid;
    if (options?.followTightness != null) {
      addComponent(world, eid, FollowTightness);
      FollowTightness.value[eid] = options.followTightness;
    }
    setComponent(world, eid, TargetPace, { value: TARGET_PACE_WALKING });
  } else if (urge === 'wait') {
    addComponent(world, eid, Wait);
    setComponent(world, eid, TargetPace, { value: TARGET_PACE_STANDING_STILL });
  } else if (urge === 'none') {
    // no urge: entity keeps initial Direction/Speed (deterministic movement)
    const manualSpeed = Math.max(0, options?.tilesPerSec ?? DEFAULTS.tilesPerSec);
    const walkSlowThreshold = DEFAULTS.walkingSpeedTps * 0.5;
    const runFastThreshold = DEFAULTS.walkingSpeedTps * 2;
    setComponent(world, eid, WalkingSpeed, { tilesPerSec: manualSpeed });
    setComponent(world, eid, RunningSpeed, { tilesPerSec: manualSpeed });
    if (manualSpeed <= 0) {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_STANDING_STILL });
    } else if (manualSpeed <= walkSlowThreshold) {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_WALKING_SLOW });
    } else if (manualSpeed <= DEFAULTS.walkingSpeedTps) {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_WALKING });
    } else if (manualSpeed < runFastThreshold) {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_RUNNING });
    } else {
      setComponent(world, eid, TargetPace, { value: TARGET_PACE_RUNNING_FAST });
    }
  } else {
    // wander (default): add per-entity so each bot has its own WanderPersistence slot; urge system reads/writes array[eid]
    addComponent(world, eid, Wander);
    addComponent(world, eid, WanderPersistence);
    addComponent(world, eid, DestinationDeadline);
    const startX = options?.x ?? DEFAULTS.x;
    const startY = options?.y ?? DEFAULTS.y;
    setComponent(world, eid, WanderPersistence, {
      ticsUntilNextChange: 0,
      ticsUntilDirectionChange: 0,
      ticsUntilSpeedChange: 0,
      targetTileX: Math.floor(startX),
      targetTileY: Math.floor(startY),
      ticsUntilRetarget: 0,
    });
    setComponent(world, eid, DestinationDeadline, {
      ticsRemaining: 0,
      pathTiles: 0,
    });
    setComponent(world, eid, TargetPace, { value: TARGET_PACE_WALKING });
  }

  return eid;
}
