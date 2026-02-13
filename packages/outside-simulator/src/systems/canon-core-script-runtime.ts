/**
 * Canon system Lua runtime: manages loading food into canons, bot/hero shooting,
 * projectile spawning, and projectile despawning.
 * Follows the same pattern as physics3d-core-script-runtime.ts.
 * @packageDocumentation
 */

import { lauxlib, lua, lualib, to_luastring } from 'fengari';
import phaseOrderSource from '../core-system-scripts/canon/phase-order.lua?raw';
import phaseBotShootSource from '../core-system-scripts/canon/phases/bot_shoot.lua?raw';
import phaseHeroShootSource from '../core-system-scripts/canon/phases/hero_shoot.lua?raw';
import phaseDespawnProjectilesSource from '../core-system-scripts/canon/phases/despawn_projectiles.lua?raw';

import {
  addEntity,
  addComponent,
  setComponent,
  removeComponent,
  removeEntity,
  query,
  hasComponent,
  getComponent,
} from 'bitecs';
import {
  Position,
  ObstacleSize,
  Obstacle,
  PositionZ,
  VelocityZ,
  Grounded,
  Bounciness,
  Observed,
  DefaultSpriteKey,
  VariantSpriteKey,
  VisualSize,
  Size,
  Collided,
  FoodCanon,
  Faction,
  HostileToFactions,
  Projectile,
  ProjectileMass,
  ShotCount,
  ShootIntent,
  TargetDirection,
  Direction,
  Hero,
  Food,
  CanonRange,
} from '../components';
import type { SimulatorWorld } from '../world';
import { applyPhysics3dBodyImpulseXZ, addPhysics3dBodyForEntity, removePhysics3dBodyForEntity } from './physics3d';
import type { ProjectileFiredEvent } from '../events';

export const CANON_PHASE_IDS = ['bot_shoot', 'hero_shoot', 'despawn_projectiles'] as const;
export type CanonPhaseId = (typeof CANON_PHASE_IDS)[number];

interface CanonRuntimeState {
  luaState: unknown;
  phaseOrder: readonly CanonPhaseId[];
  /** Floor cells available for food respawn, set by the story/scenario. */
  floorCells: Array<{ x: number; y: number }>;
  /** Current tic counter for debug context. */
  currentTic: number;
  /** Track last few host function calls for debugging. */
  hostCallHistory: Array<{ name: string; args: unknown[]; timestamp: number }>;
}

interface LuaApiHandle {
  lua_settop: (L: unknown, n: number) => void;
  lua_pushjsfunction: (L: unknown, fn: (state: unknown) => number) => void;
  lua_setfield: (L: unknown, idx: number, key: unknown) => void;
  lua_newtable: (L: unknown) => void;
  lua_setglobal: (L: unknown, key: unknown) => void;
  lua_pushinteger: (L: unknown, v: number) => void;
  lua_pushnumber: (L: unknown, v: number) => void;
  lua_rawseti: (L: unknown, idx: number, n: number) => void;
  lua_tonumber: (L: unknown, idx: number) => number;
  lua_tojsstring: (L: unknown, idx: number) => string | null;
  LUA_OK: number;
}
interface LuaAuxHandle {
  luaL_dostring: (L: unknown, s: unknown) => number;
  luaL_newstate: () => unknown;
  luaL_traceback: (L: unknown, L1: unknown, msg: unknown, level: number) => number;
}
interface LuaLibHandle { luaL_openlibs: (L: unknown) => void; }

const luaApi = lua as LuaApiHandle;
const lauxlibApi = lauxlib as LuaAuxHandle;
const lualibApi = lualib as LuaLibHandle;

const runtimeByWorld = new WeakMap<SimulatorWorld, CanonRuntimeState>();

const phaseScriptById: Record<CanonPhaseId, string> = {
  bot_shoot: phaseBotShootSource,
  hero_shoot: phaseHeroShootSource,
  despawn_projectiles: phaseDespawnProjectilesSource,
};

const phaseIdSet = new Set<string>(CANON_PHASE_IDS);

/** Default bot fire rate: one shot every N tics. Stored per-entity in a plain Map. */
const fireCooldownByEid = new WeakMap<SimulatorWorld, Map<number, number>>();

const BOT_FIRE_COOLDOWN_TICS = 20; // ~1 second at 50ms/tic
const HERO_FIRE_COOLDOWN_TICS = 10;
const MAX_ANGULAR_ERROR_RAD = 0.25; // ±~14 degrees

function setHostFunction(
  luaState: unknown,
  key: string,
  fn: (state: unknown) => number,
  runtime?: CanonRuntimeState
): void {
  const trackedFn = (state: unknown) => {
    if (runtime) {
      runtime.hostCallHistory.push({
        name: key,
        args: [], // Could extract args from stack if needed
        timestamp: Date.now(),
      });
    }
    return fn(state);
  };
  luaApi.lua_pushjsfunction(luaState, trackedFn);
  luaApi.lua_setfield(luaState, -2, to_luastring(key));
}

function pushIntArray(luaState: unknown, arr: number[]): void {
  luaApi.lua_newtable(luaState);
  for (let i = 0; i < arr.length; i++) {
    luaApi.lua_pushinteger(luaState, arr[i]);
    luaApi.lua_rawseti(luaState, -2, i + 1);
  }
}

function extractLuaTraceback(luaState: unknown): string {
  try {
    luaApi.lua_settop(luaState, 0);
    // Get the error message from the top of stack
    const errMsg = luaApi.lua_tojsstring(luaState, -1) ?? 'unknown error';
    // Generate traceback
    lauxlibApi.luaL_traceback(luaState, luaState, to_luastring(errMsg), 1);
    const traceback = luaApi.lua_tojsstring(luaState, -1) ?? errMsg;
    return traceback;
  } catch {
    return 'traceback extraction failed';
  }
}

function snapshotECSState(world: SimulatorWorld): Record<string, unknown> {
  const counts: Record<string, number | string> = {};

  // Manually count entities with specific components
  try {
    // Check Position entities - use x property which all should have
    if (Position && Position.x) {
      const posKeys = Object.keys(Position.x);
      counts['Position'] = posKeys.length;
    }

    // Check FoodCanon
    if (FoodCanon && FoodCanon.loadedFoodEid) {
      const fcKeys = Object.keys(FoodCanon.loadedFoodEid);
      counts['FoodCanon'] = fcKeys.length;
    }

    // Check Projectile - bitecs stores eid as Uint32Array
    if (Projectile) {
      const pEid = (Projectile as any).eid;
      if (pEid instanceof Uint32Array) {
        let projCount = 0;
        for (let i = 0; i < pEid.length; i++) {
          if (pEid[i] > 0) projCount++;
        }
        counts['Projectile'] = projCount;
      }
    }

    // Check Hero
    if (Hero) {
      const hEid = (Hero as any).eid;
      if (hEid instanceof Uint32Array) {
        let heroCount = 0;
        for (let i = 0; i < hEid.length; i++) {
          if (hEid[i] > 0) heroCount++;
        }
        counts['Hero'] = heroCount;
      }
    }

    // Check Collided - with breakdown
    if (Collided && Collided.ticksRemaining) {
      const cKeys = Object.keys(Collided.ticksRemaining);
      const collidedTotal = cKeys.length;
      counts['Collided_total'] = collidedTotal;

      // Count how many Collided entities are actually Projectiles
      let collidedProjectiles = 0;
      if (Projectile && (Projectile as any).eid instanceof Uint32Array) {
        const projEid = (Projectile as any).eid as Uint32Array;
        for (const key of cKeys) {
          const eid = parseInt(key, 10);
          if (projEid[eid] > 0) collidedProjectiles++;
        }
      }
      counts['Collided_are_Projectiles'] = collidedProjectiles;
      counts['Collided_not_Projectiles'] = collidedTotal - collidedProjectiles;
    }

    // Check Food
    if (Food) {
      const fEid = (Food as any).eid;
      if (fEid instanceof Uint32Array) {
        let foodCount = 0;
        for (let i = 0; i < fEid.length; i++) {
          if (fEid[i] > 0) foodCount++;
        }
        counts['Food'] = foodCount;
      }
    }
  } catch (err) {
    counts['_snapshot_error'] = err instanceof Error ? err.message : String(err);
  }

  return {
    componentCounts: counts,
    timestamp: Date.now(),
  };
}

interface DebugSnapshot {
  system: string;
  phase: string;
  tic: number;
  timestamp: number;
  luaError: string;
  luaTraceback: string;
  ecsState: Record<string, unknown>;
  hostCallHistory: Array<{ name: string; args: unknown[]; timestamp: number }>;
}

function runLuaChunk(
  luaState: unknown,
  source: string,
  label: string,
  runtime?: CanonRuntimeState,
  world?: SimulatorWorld
): void {
  try {
    luaApi.lua_settop(luaState, 0);
    const status = lauxlibApi.luaL_dostring(luaState, to_luastring(source));
    if (status !== luaApi.LUA_OK) {
      const message = luaApi.lua_tojsstring(luaState, -1) ?? 'unknown Lua error';
      luaApi.lua_settop(luaState, 0);
      throw new Error(`canon core script failed (${label}): ${message}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const traceback = extractLuaTraceback(luaState);
    const ecsState = world ? snapshotECSState(world) : { error: 'no world context' };

    const debugSnapshot: DebugSnapshot = {
      system: 'canon-core-script-runtime',
      phase: label,
      tic: runtime?.currentTic ?? -1,
      timestamp: Date.now(),
      luaError: msg,
      luaTraceback: traceback,
      ecsState,
      hostCallHistory: runtime?.hostCallHistory.slice(-10) ?? [], // Last 10 calls
    };

    // Log to console so user can copy/paste
    (globalThis as any).console?.error(
      '%c=== CANON SYSTEM FAILURE ===',
      'font-size: 14px; font-weight: bold; color: red;'
    );
    (globalThis as any).console?.error(
      '%cCopy the object below and paste into issue/debug:',
      'font-size: 12px; color: #ff6b00;'
    );
    (globalThis as any).console?.error(debugSnapshot);

    // Store error globally for UI access (storybook crash reporter)
    const globalObj = globalThis as any;
    if (globalObj && typeof globalObj === 'object') {
      globalObj.__luaError = debugSnapshot;
    }

    const details = [
      `Canon Phase: ${label}`,
      `System: canon-core-script-runtime`,
      `Tic: ${debugSnapshot.tic}`,
      `Lua execution failed`,
      `Error: ${msg}`,
      `Traceback:\n${traceback}`,
    ];
    throw new Error(details.join('\n'));
  }
}

function parsePhaseOrder(raw: string): readonly CanonPhaseId[] {
  const parsed = raw.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  const invalid = parsed.filter(p => !phaseIdSet.has(p));
  if (invalid.length > 0) throw new Error(`canon: unknown phase ids: ${invalid.join(', ')}`);
  return parsed as CanonPhaseId[];
}

/** Seed-derived deterministic float in [-1,1] for angular error. */
function seededAngularError(world: SimulatorWorld, eid: number): number {
  // Use world.random if available, otherwise Math.random (storybook only).
  const rng = (world as unknown as { random?: { float: () => number } }).random;
  const r = rng ? rng.float() : Math.random();
  return (r * 2 - 1) * MAX_ANGULAR_ERROR_RAD;
}

function spawnProjectile(
  world: SimulatorWorld,
  shooterEid: number,
  fireAngle: number
): number | null {
  try {
    // Count existing projectiles to prevent accumulation
    const existingProjectiles = query(world, [Projectile]);
    if (existingProjectiles.length > 50) {
      return null; // Too many projectiles, abort spawn silently
    }

    const foodEid = FoodCanon.loadedFoodEid[shooterEid];
    if (foodEid === 0) return null;
    if (!hasComponent(world, shooterEid, Position)) return null;

    const sx = Position.x[shooterEid];
    const sy = Position.y[shooterEid];
    const mass = hasComponent(world, foodEid, ProjectileMass) ? ProjectileMass.value[foodEid] : 0.2;
    const bounciness = hasComponent(world, foodEid, Bounciness) ? Bounciness.value[foodEid] : 0.4;
    const defaultSpriteKey = hasComponent(world, foodEid, DefaultSpriteKey) ? DefaultSpriteKey.value[foodEid] : '';
    const variantSpriteKey = hasComponent(world, foodEid, VariantSpriteKey) ? VariantSpriteKey.value[foodEid] : '';

    // Determine launch speed from ProjectileMass (lighter = faster), clamped.
    const launchSpeed = Math.max(6, Math.min(20, 14 / Math.max(0.05, mass)));
    const obstacleRadius = 0.25;

    const pEid = addEntity(world);

    addComponent(world, pEid, Observed);
    addComponent(world, pEid, Position);
    setComponent(world, pEid, Position, { x: sx, y: sy });
    addComponent(world, pEid, PositionZ);
    setComponent(world, pEid, PositionZ, { z: obstacleRadius + 0.3 });
    addComponent(world, pEid, VelocityZ);
    setComponent(world, pEid, VelocityZ, { z: 0 });
    addComponent(world, pEid, Grounded);
    setComponent(world, pEid, Grounded, { value: 0 });
    addComponent(world, pEid, ObstacleSize);
    setComponent(world, pEid, ObstacleSize, { diameter: obstacleRadius * 2 });
    addComponent(world, pEid, Obstacle);
    addComponent(world, pEid, Bounciness);
    setComponent(world, pEid, Bounciness, { value: bounciness });
    addComponent(world, pEid, DefaultSpriteKey);
    setComponent(world, pEid, DefaultSpriteKey, { value: defaultSpriteKey });
    addComponent(world, pEid, VariantSpriteKey);
    setComponent(world, pEid, VariantSpriteKey, { value: variantSpriteKey });
    addComponent(world, pEid, VisualSize);
    setComponent(world, pEid, VisualSize, { diameter: obstacleRadius * 2 });
    addComponent(world, pEid, Projectile);
    // NOTE: Do NOT pre-add Collided component. The physics3d system will add it
    // with ticksRemaining > 0 when a collision is detected.

    // Register a physics body for this projectile and apply initial impulse.
    addPhysics3dBodyForEntity(world, pEid);
    const impulseX = Math.cos(fireAngle) * launchSpeed * mass;
    const impulseZ = Math.sin(fireAngle) * launchSpeed * mass;
    applyPhysics3dBodyImpulseXZ(world, pEid, impulseX, impulseZ);

    // Decrement ammo; if depleted, respawn the food entity somewhere on the floor.
    FoodCanon.ammoRemaining[shooterEid] -= 1;
    if (FoodCanon.ammoRemaining[shooterEid] <= 0) {
      respawnFoodInDungeon(world, foodEid, shooterEid);
    }

    world.eventQueue.push({
      type: 'projectile_fired',
      shooterEntity: shooterEid,
      projectileEntity: pEid,
      foodEntity: foodEid,
    } satisfies ProjectileFiredEvent);

    return pEid;
  } catch (err) {
    throw err;
  }
}

/** Respawn a depleted food entity at a random floor cell. */
function respawnFoodInDungeon(world: SimulatorWorld, foodEid: number, canonEid: number): void {
  const runtime = runtimeByWorld.get(world);
  const cells = runtime?.floorCells ?? [];

  FoodCanon.loadedFoodEid[canonEid] = 0;
  FoodCanon.ammoRemaining[canonEid] = 0;

  if (cells.length === 0) return;

  const rng = (world as unknown as { random?: { int: (n: number) => number } }).random;
  const idx = rng ? rng.int(cells.length) : Math.floor(Math.random() * cells.length);
  const cell = cells[idx % cells.length];

  // Restore the food entity as a visible pickup.
  addComponent(world, foodEid, Position);
  setComponent(world, foodEid, Position, { x: cell.x, y: cell.y });
  addComponent(world, foodEid, Size);
  setComponent(world, foodEid, Size, { diameter: 1 });
  addComponent(world, foodEid, Observed);

  const shotMax = ShotCount.max[foodEid] ?? 1;
  ShotCount.remaining[foodEid] = shotMax;
}

function createRuntimeState(world: SimulatorWorld): CanonRuntimeState {
  const luaState = lauxlibApi.luaL_newstate();
  lualibApi.luaL_openlibs(luaState);

  let cooldowns = fireCooldownByEid.get(world);
  if (!cooldowns) { cooldowns = new Map(); fireCooldownByEid.set(world, cooldowns); }

  luaApi.lua_newtable(luaState);

  // Create a partial runtime object for host call tracking
  const hostCallHistory: Array<{ name: string; args: unknown[]; timestamp: number }> = [];
  const partialRuntime: CanonRuntimeState = {
    luaState,
    phaseOrder: [],
    floorCells: [],
    currentTic: 0,
    hostCallHistory,
  };

  // Helper to set host functions with call tracking
  const setTrackedHostFunction = (key: string, fn: (state: unknown) => number) => {
    setHostFunction(luaState, key, fn, partialRuntime);
  };

  setTrackedHostFunction('list_armed_bots', (state) => {
    const result: number[] = [];
    const armed = query(world, [FoodCanon, Position, ObstacleSize, Faction]);
    for (let i = 0; i < armed.length; i++) {
      const eid = armed[i];
      if (hasComponent(world, eid, Hero)) continue; // handled by hero_shoot
      if (FoodCanon.loadedFoodEid[eid] === 0) continue;
      if (FoodCanon.ammoRemaining[eid] <= 0) continue;
      const cd = cooldowns!.get(eid) ?? 0;
      if (cd > 0) { cooldowns!.set(eid, cd - 1); continue; }
      result.push(eid);
    }
    pushIntArray(state, result);
    return 1;
  });

  setTrackedHostFunction('list_armed_heroes', (state) => {
    const result: number[] = [];
    const heroes = query(world, [Hero, FoodCanon, Position]);
    for (let i = 0; i < heroes.length; i++) {
      const eid = heroes[i];
      if (FoodCanon.loadedFoodEid[eid] === 0) continue;
      if (FoodCanon.ammoRemaining[eid] <= 0) continue;
      const cd = cooldowns!.get(eid) ?? 0;
      if (cd > 0) { cooldowns!.set(eid, cd - 1); continue; }
      result.push(eid);
    }
    pushIntArray(state, result);
    return 1;
  });

  setTrackedHostFunction('list_projectiles', (state) => {
    const projectiles = query(world, [Projectile]);
    const projectileArray = Array.from(projectiles);

    // Log first few projectiles to verify they have Projectile component
    if (projectileArray.length > 0) {
      const sample = projectileArray.slice(0, Math.min(3, projectileArray.length));
      sample.forEach(eid => {
        const hasProj = hasComponent(world, eid, Projectile);
        const hasPos = hasComponent(world, eid, Position);
        const hasCollided = hasComponent(world, eid, Collided);
        (globalThis as any).console?.log(`[list_projectiles] eid=${eid} Projectile=${hasProj} Position=${hasPos} Collided=${hasCollided}`);
      });
    }

    pushIntArray(state, projectileArray);
    return 1;
  });

  setTrackedHostFunction('get_position_x', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, Position.x[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_position_y', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, Position.y[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_direction_angle', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, Direction.angle[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_hostile_mask', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushinteger(state, HostileToFactions.mask[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_canon_range', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    const range = hasComponent(world, eid, CanonRange) ? CanonRange.tiles[eid] : 8;
    luaApi.lua_pushnumber(state, range ?? 8);
    return 1;
  });

  setTrackedHostFunction('find_nearest_hostile', (state) => {
    const shooterEid = Math.trunc(luaApi.lua_tonumber(state, 1));
    const mask = Math.trunc(luaApi.lua_tonumber(state, 2));
    const sx = luaApi.lua_tonumber(state, 3);
    const sy = luaApi.lua_tonumber(state, 4);
    const range = luaApi.lua_tonumber(state, 5);

    const candidates = query(world, [Position, ObstacleSize, Faction]);
    let bestEid = 0;
    let bestDist = range * range + 1;
    for (let i = 0; i < candidates.length; i++) {
      const eid = candidates[i];
      if (eid === shooterEid) continue;
      const factionVal = Faction.value[eid] ?? 0;
      if ((mask & (1 << factionVal)) === 0) continue;
      const dx = Position.x[eid] - sx;
      const dy = Position.y[eid] - sy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < bestDist) { bestDist = dist2; bestEid = eid; }
    }
    luaApi.lua_pushinteger(state, bestEid);
    return 1;
  });

  setTrackedHostFunction('random_angular_error', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, seededAngularError(world, eid));
    return 1;
  });

  setTrackedHostFunction('fire_projectile', (state) => {
    const shooterEid = Math.trunc(luaApi.lua_tonumber(state, 1));
    const angle = luaApi.lua_tonumber(state, 2);

    try {
      // Validate inputs
      if (!Number.isFinite(shooterEid)) {
        throw new Error(`invalid shooter eid: ${shooterEid}`);
      }
      if (!Number.isFinite(angle)) {
        throw new Error(`invalid angle: ${angle}`);
      }
      if (!hasComponent(world, shooterEid, FoodCanon)) {
        throw new Error(`shooter ${shooterEid} has no FoodCanon component`);
      }

      const result = spawnProjectile(world, shooterEid, angle);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      (globalThis as any).console?.error(`[fire_projectile] ERROR: eid=${shooterEid}, angle=${angle}, error=${msg}`);
      throw new Error(`fire_projectile(eid=${shooterEid}, angle=${angle}): ${msg}`);
    }

    try {
      const isHero = hasComponent(world, shooterEid, Hero);
      cooldowns!.set(shooterEid, isHero ? HERO_FIRE_COOLDOWN_TICS : BOT_FIRE_COOLDOWN_TICS);
    } catch (cooldownErr) {
      (globalThis as any).console?.error(`[fire_projectile] cooldown error:`, cooldownErr);
      throw cooldownErr;
    }

    return 0;
  });

  setTrackedHostFunction('get_shoot_intent', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushinteger(state, ShootIntent.value[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('clear_shoot_intent', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    ShootIntent.value[eid] = 0;
    return 0;
  });

  setTrackedHostFunction('get_target_direction_x', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, TargetDirection.x[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_target_direction_y', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, TargetDirection.y[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('get_target_direction_magnitude', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    luaApi.lua_pushnumber(state, TargetDirection.magnitude[eid] ?? 0);
    return 1;
  });

  setTrackedHostFunction('has_collided', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    const ticks = hasComponent(world, eid, Collided) ? Collided.ticksRemaining[eid] : 0;
    luaApi.lua_pushinteger(state, ticks > 0 ? 1 : 0);
    return 1;
  });

  setTrackedHostFunction('despawn_projectile', (state) => {
    const eid = Math.trunc(luaApi.lua_tonumber(state, 1));
    removePhysics3dBodyForEntity(world, eid);
    removeComponent(world, eid, Observed);
    removeComponent(world, eid, Position);
    removeComponent(world, eid, ObstacleSize);
    removeComponent(world, eid, Obstacle);
    removeComponent(world, eid, Projectile);
    removeEntity(world, eid);
    return 0;
  });

  setTrackedHostFunction('log_projectile_count', (state) => {
    const count = Math.trunc(luaApi.lua_tonumber(state, 1));
    const allEntitiesWithCollided = query(world, [Collided]);
    const actualProjectiles = query(world, [Projectile]);
    (globalThis as any).console?.log(
      `[despawn_projectiles] Projectiles found: ${count}, ` +
      `Actual Projectile components: ${actualProjectiles.length}, ` +
      `All Collided components: ${allEntitiesWithCollided.length}`
    );
    return 0;
  });

  setTrackedHostFunction('log_despawn_summary', (state) => {
    const despawnedCount = Math.trunc(luaApi.lua_tonumber(state, 1));
    const collidedCount = Math.trunc(luaApi.lua_tonumber(state, 2));
    (globalThis as any).console?.log(
      `[despawn_projectiles] Despawned: ${despawnedCount}, Were collided: ${collidedCount}`
    );
    return 0;
  });

  setTrackedHostFunction('debug_projectile_state', (state) => {
    const projectiles = query(world, [Projectile]);
    let collidedCount = 0;
    let notCollidedCount = 0;
    for (let i = 0; i < projectiles.length; i++) {
      const eid = projectiles[i];
      const ticks = hasComponent(world, eid, Collided) ? Collided.ticksRemaining[eid] : 0;
      if (ticks > 0) {
        collidedCount++;
      } else {
        notCollidedCount++;
      }
    }
    return 0;
  });

  luaApi.lua_setglobal(luaState, to_luastring('__canon_host'));
  luaApi.lua_settop(luaState, 0);

  // Parse phase order from Lua.
  runLuaChunk(luaState, phaseOrderSource, 'phase_order', partialRuntime, world);
  luaApi.lua_settop(luaState, 0);
  const rawPhaseOrder = (() => {
    // Re-run to capture return value properly.
    const phaseSrc = phaseOrderSource;
    const L = luaState;
    luaApi.lua_settop(L, 0);
    lauxlibApi.luaL_dostring(L, to_luastring(phaseSrc));
    const result = luaApi.lua_tojsstring(L, -1) ?? '';
    luaApi.lua_settop(L, 0);
    return result;
  })();

  partialRuntime.phaseOrder = parsePhaseOrder(rawPhaseOrder);
  return partialRuntime;
}

function getOrCreateRuntime(world: SimulatorWorld): CanonRuntimeState {
  const existing = runtimeByWorld.get(world);
  if (existing) return existing;
  const created = createRuntimeState(world);
  runtimeByWorld.set(world, created);
  return created;
}

/** Register floor cells so the canon system can respawn food there. */
export function setCanonSystemFloorCells(
  world: SimulatorWorld,
  cells: Array<{ x: number; y: number }>
): void {
  const runtime = getOrCreateRuntime(world);
  runtime.floorCells = cells;
}

/** Run one tic of the canon system. */
export function runCanonSystemFromCoreScript(world: SimulatorWorld): void {
  const runtime = getOrCreateRuntime(world);
  runtime.currentTic++;
  runtime.hostCallHistory = []; // Clear history each tic for a focused view

  // EMERGENCY: Force cleanup if projectile count is dangerously high
  const allProjectiles = query(world, [Projectile]);
  if (allProjectiles.length > 200) {
    (globalThis as any).console?.warn(
      `[EMERGENCY CLEANUP] Projectile count: ${allProjectiles.length}, forcing despawn of old projectiles`
    );
    // Despawn projectiles that don't have recent creation
    for (let i = 0; i < allProjectiles.length; i++) {
      const eid = allProjectiles[i];
      removePhysics3dBodyForEntity(world, eid);
      removeComponent(world, eid, Observed);
      removeComponent(world, eid, Position);
      removeComponent(world, eid, ObstacleSize);
      removeComponent(world, eid, Obstacle);
      removeComponent(world, eid, Projectile);
      removeEntity(world, eid);
    }
    (globalThis as any).console?.warn(`[EMERGENCY CLEANUP] Despawned ${allProjectiles.length} projectiles`);
  }

  for (const phaseId of runtime.phaseOrder) {
    runLuaChunk(runtime.luaState, phaseScriptById[phaseId], phaseId, runtime, world);
  }
}
