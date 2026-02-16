import { lauxlib, lua, lualib, to_luastring } from 'fengari';
import phaseOrderSource from '../core-system-scripts/physics3d/phase-order.lua?raw';
import phaseEnsureStateSource from '../core-system-scripts/physics3d/phases/ensure_state.lua?raw';
import phaseApplyContactTuningSource from '../core-system-scripts/physics3d/phases/apply_contact_tuning.lua?raw';
import phaseClearDynamicCollidedSource from '../core-system-scripts/physics3d/phases/clear_dynamic_collided.lua?raw';
import phaseRebuildBodiesSource from '../core-system-scripts/physics3d/phases/rebuild_bodies.lua?raw';
import phaseApplyDesiredVelocitySource from '../core-system-scripts/physics3d/phases/apply_desired_velocity.lua?raw';
import phaseStepWorldSource from '../core-system-scripts/physics3d/phases/step_world.lua?raw';
import phaseEmitDynamicCollisionEventsSource from '../core-system-scripts/physics3d/phases/emit_dynamic_collision_events.lua?raw';
import phaseSyncBackToEcsSource from '../core-system-scripts/physics3d/phases/sync_back_to_ecs.lua?raw';
import type { SimulatorWorld } from '../world';
import {
  addPhysics3dBodyForEntity,
  applyPhysics3dBodyImpulseXZ,
  applyPhysics3dCollisionResponsesForContact,
  canPhysics3dEntitiesCollide,
  clearPhysics3dCollisionPairSeenThisTic,
  ensurePhysics3dState,
  emitPhysics3dCollisionEvent,
  hasPhysics3dObstacleSizeComponent,
  hasPhysics3dPositionComponent,
  hasPhysics3dBodyForEntity,
  getPhysics3dBodyPositionX,
  getPhysics3dBodyPositionY,
  getPhysics3dBodyPositionZ,
  getPhysics3dBodyVelocityX,
  getPhysics3dBodyVelocityLength,
  getPhysics3dBodyVelocityY,
  getPhysics3dBodyVelocityZ,
  getPhysics3dContactEntityA,
  getPhysics3dContactEntityB,
  getPhysics3dCollidedTicks,
  getPhysics3dDirectionAngle,
  getPhysics3dObstacleRadius,
  getPhysics3dSpeedTilesPerSec,
  listPhysics3dContactIndices,
  PHYSICS3D_PHASE_IDS,
  listPhysics3dBodyEntityIds,
  listPhysics3dPositionEntityCandidates,
  listPhysics3dDesiredVelocityEntities,
  listPhysics3dCollidedEntities,
  markPhysics3dCollisionPairSeenIfNew,
  removePhysics3dBodyForEntity,
  setPhysics3dActualSpeed,
  setPhysics3dCollidedTicks,
  setPhysics3dGrounded,
  setPhysics3dPositionXY,
  setPhysics3dPositionZ,
  setPhysics3dVelocityZ,
  shouldPhysics3dEntityHaveBody,
  getPhysics3dTuningSnapshot,
  setPhysics3dContactTuning,
  stepPhysics3dWorld,
  type Physics3dPhaseId,
} from './physics3d';

interface LuaStateHandle {
  lua_createtable: (L: unknown, narr: number, nrec: number) => void;
  lua_gettop: (L: unknown) => number;
  lua_newtable: (L: unknown) => void;
  lua_pop: (L: unknown, n?: number) => void;
  lua_pushjsfunction: (L: unknown, fn: (state: unknown) => number) => void;
  lua_pushinteger: (L: unknown, value: number) => void;
  lua_pushnumber: (L: unknown, value: number) => void;
  lua_rawseti: (L: unknown, idx: number, n: number) => void;
  lua_setfield: (L: unknown, idx: number, key: unknown) => void;
  lua_setglobal: (L: unknown, key: unknown) => void;
  lua_settop: (L: unknown, idx: number) => void;
  lua_tonumber: (L: unknown, idx: number) => number;
  lua_tojsstring: (L: unknown, idx: number) => string | null;
  lua_type: (L: unknown, idx: number) => number;
  LUA_OK: number;
  LUA_TSTRING: number;
}

interface LuaAuxlibHandle {
  luaL_dostring: (L: unknown, source: unknown) => number;
  luaL_newstate: () => unknown;
}

interface LuaLibHandle {
  luaL_openlibs: (L: unknown) => void;
}

interface Physics3dCoreRuntimeState {
  luaState: unknown;
  phaseOrder: readonly Physics3dPhaseId[];
}

const luaApi = lua as LuaStateHandle;
const lauxlibApi = lauxlib as LuaAuxlibHandle;
const lualibApi = lualib as LuaLibHandle;

const runtimeByWorld = new WeakMap<SimulatorWorld, Physics3dCoreRuntimeState>();
const scriptOverridesByWorld = new WeakMap<
  SimulatorWorld,
  Partial<Record<Physics3dPhaseId, string>>
>();
const phaseIdSet = new Set<string>(PHYSICS3D_PHASE_IDS);

const phaseScriptSourceById: Record<Physics3dPhaseId, string> = {
  ensure_state: phaseEnsureStateSource,
  apply_contact_tuning: phaseApplyContactTuningSource,
  clear_dynamic_collided: phaseClearDynamicCollidedSource,
  rebuild_bodies: phaseRebuildBodiesSource,
  apply_desired_velocity: phaseApplyDesiredVelocitySource,
  step_world: phaseStepWorldSource,
  emit_dynamic_collision_events: phaseEmitDynamicCollisionEventsSource,
  sync_back_to_ecs: phaseSyncBackToEcsSource,
};

function nowMs(): number {
  return Date.now();
}

function getPhaseScriptSource(
  world: SimulatorWorld,
  phaseId: Physics3dPhaseId
): string {
  const overrides = scriptOverridesByWorld.get(world);
  const overrideSource = overrides?.[phaseId];
  if (typeof overrideSource === 'string') return overrideSource;
  return phaseScriptSourceById[phaseId];
}

function parsePhaseOrder(raw: string): readonly Physics3dPhaseId[] {
  const parsed = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (parsed.length === 0) {
    throw new Error('physics3d core script returned an empty phase order');
  }
  const invalid = parsed.filter((phase) => !phaseIdSet.has(phase));
  if (invalid.length > 0) {
    throw new Error(`physics3d core script returned unknown phase ids: ${invalid.join(', ')}`);
  }
  return parsed as Physics3dPhaseId[];
}

function runLuaChunk(luaState: unknown, source: string, label: string): void {
  luaApi.lua_settop(luaState, 0);
  const status = lauxlibApi.luaL_dostring(luaState, to_luastring(source));
  if (status !== luaApi.LUA_OK) {
    const message = luaApi.lua_tojsstring(luaState, -1) ?? 'unknown Lua error';
    luaApi.lua_settop(luaState, 0);
    throw new Error(`physics3d core script failed (${label}): ${message}`);
  }
}

function setHostFunction(
  luaState: unknown,
  key: string,
  fn: (state: unknown) => number
): void {
  luaApi.lua_pushjsfunction(luaState, fn);
  luaApi.lua_setfield(luaState, -2, to_luastring(key));
}

function createHostApi(luaState: unknown, world: SimulatorWorld): void {
  luaApi.lua_newtable(luaState);

  setHostFunction(luaState, 'ensure_state', () => {
    ensurePhysics3dState(world);
    return 0;
  });

  setHostFunction(luaState, 'get_collided_entities', (state) => {
    const ids = listPhysics3dCollidedEntities(world);
    luaApi.lua_createtable(state, ids.length, 0);
    for (let i = 0; i < ids.length; i++) {
      luaApi.lua_pushinteger(state, ids[i]);
      luaApi.lua_rawseti(state, -2, i + 1);
    }
    return 1;
  });

  setHostFunction(luaState, 'get_collided_ticks', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dCollidedTicks(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'set_collided_ticks', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const ticks = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(ticks)) return 0;
    setPhysics3dCollidedTicks(world, Math.trunc(eid), Math.trunc(ticks));
    return 0;
  });

  setHostFunction(luaState, 'list_position_entity_candidates', (state) => {
    const ids = listPhysics3dPositionEntityCandidates(world);
    luaApi.lua_createtable(state, ids.length, 0);
    for (let i = 0; i < ids.length; i++) {
      luaApi.lua_pushinteger(state, ids[i]);
      luaApi.lua_rawseti(state, -2, i + 1);
    }
    return 1;
  });

  setHostFunction(luaState, 'should_have_body', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const shouldHave = shouldPhysics3dEntityHaveBody(
      world,
      Number.isFinite(eid) ? Math.trunc(eid) : -1
    );
    luaApi.lua_pushinteger(state, shouldHave ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'has_body', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const hasBody = hasPhysics3dBodyForEntity(world, Number.isFinite(eid) ? Math.trunc(eid) : -1);
    luaApi.lua_pushinteger(state, hasBody ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'add_body_for_entity', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    if (!Number.isFinite(eid)) return 0;
    addPhysics3dBodyForEntity(world, Math.trunc(eid));
    return 0;
  });

  setHostFunction(luaState, 'list_body_entity_ids', (state) => {
    const ids = listPhysics3dBodyEntityIds(world);
    luaApi.lua_createtable(state, ids.length, 0);
    for (let i = 0; i < ids.length; i++) {
      luaApi.lua_pushinteger(state, ids[i]);
      luaApi.lua_rawseti(state, -2, i + 1);
    }
    return 1;
  });

  setHostFunction(luaState, 'remove_body_for_entity', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    if (!Number.isFinite(eid)) return 0;
    removePhysics3dBodyForEntity(world, Math.trunc(eid));
    return 0;
  });

  setHostFunction(luaState, 'list_desired_velocity_entities', (state) => {
    const ids = listPhysics3dDesiredVelocityEntities(world);
    luaApi.lua_createtable(state, ids.length, 0);
    for (let i = 0; i < ids.length; i++) {
      luaApi.lua_pushinteger(state, ids[i]);
      luaApi.lua_rawseti(state, -2, i + 1);
    }
    return 1;
  });

  setHostFunction(luaState, 'get_direction_angle', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dDirectionAngle(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_speed_tiles_per_sec', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dSpeedTilesPerSec(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_velocity_x', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyVelocityX(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_velocity_z', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyVelocityZ(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'apply_body_impulse_xz', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const impulseX = luaApi.lua_tonumber(state, 2);
    const impulseZ = luaApi.lua_tonumber(state, 3);
    if (!Number.isFinite(eid) || !Number.isFinite(impulseX) || !Number.isFinite(impulseZ)) {
      return 0;
    }
    applyPhysics3dBodyImpulseXZ(
      world,
      Math.trunc(eid),
      Number.isFinite(impulseX) ? impulseX : 0,
      Number.isFinite(impulseZ) ? impulseZ : 0
    );
    return 0;
  });

  setHostFunction(luaState, 'has_position_component', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const hasPosition = hasPhysics3dPositionComponent(
      world,
      Number.isFinite(eid) ? Math.trunc(eid) : -1
    );
    luaApi.lua_pushinteger(state, hasPosition ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'has_obstacle_size_component', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const hasObstacle = hasPhysics3dObstacleSizeComponent(
      world,
      Number.isFinite(eid) ? Math.trunc(eid) : -1
    );
    luaApi.lua_pushinteger(state, hasObstacle ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'get_body_position_x', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyPositionX(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_position_y', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyPositionY(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_position_z', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyPositionZ(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_velocity_y', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyVelocityY(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'get_body_velocity_length', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dBodyVelocityLength(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'set_position_xy', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const x = luaApi.lua_tonumber(state, 2);
    const y = luaApi.lua_tonumber(state, 3);
    if (!Number.isFinite(eid) || !Number.isFinite(x) || !Number.isFinite(y)) return 0;
    setPhysics3dPositionXY(world, Math.trunc(eid), x, y);
    return 0;
  });

  setHostFunction(luaState, 'set_position_z', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const z = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(z)) return 0;
    setPhysics3dPositionZ(world, Math.trunc(eid), z);
    return 0;
  });

  setHostFunction(luaState, 'set_velocity_z', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const z = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(z)) return 0;
    setPhysics3dVelocityZ(world, Math.trunc(eid), z);
    return 0;
  });

  setHostFunction(luaState, 'get_obstacle_radius', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    luaApi.lua_pushnumber(
      state,
      getPhysics3dObstacleRadius(world, Number.isFinite(eid) ? Math.trunc(eid) : -1)
    );
    return 1;
  });

  setHostFunction(luaState, 'set_grounded', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const value = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(value)) return 0;
    setPhysics3dGrounded(world, Math.trunc(eid), value > 0 ? 1 : 0);
    return 0;
  });

  setHostFunction(luaState, 'set_actual_speed', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const speed = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(speed)) return 0;
    setPhysics3dActualSpeed(world, Math.trunc(eid), Number.isFinite(speed) ? speed : 0);
    return 0;
  });

  setHostFunction(luaState, 'clear_collision_pair_seen', () => {
    clearPhysics3dCollisionPairSeenThisTic(world);
    return 0;
  });

  setHostFunction(luaState, 'list_contact_indices', (state) => {
    const indices = listPhysics3dContactIndices(world);
    luaApi.lua_createtable(state, indices.length, 0);
    for (let i = 0; i < indices.length; i++) {
      luaApi.lua_pushinteger(state, indices[i]);
      luaApi.lua_rawseti(state, -2, i + 1);
    }
    return 1;
  });

  setHostFunction(luaState, 'get_contact_entity_a', (state) => {
    const contactIndex = luaApi.lua_tonumber(state, 1);
    const eid = getPhysics3dContactEntityA(
      world,
      Number.isFinite(contactIndex) ? Math.trunc(contactIndex) : -1
    );
    luaApi.lua_pushinteger(state, eid);
    return 1;
  });

  setHostFunction(luaState, 'get_contact_entity_b', (state) => {
    const contactIndex = luaApi.lua_tonumber(state, 1);
    const eid = getPhysics3dContactEntityB(
      world,
      Number.isFinite(contactIndex) ? Math.trunc(contactIndex) : -1
    );
    luaApi.lua_pushinteger(state, eid);
    return 1;
  });

  setHostFunction(luaState, 'can_entities_collide', (state) => {
    const eidA = luaApi.lua_tonumber(state, 1);
    const eidB = luaApi.lua_tonumber(state, 2);
    const canCollide = canPhysics3dEntitiesCollide(
      world,
      Number.isFinite(eidA) ? Math.trunc(eidA) : -1,
      Number.isFinite(eidB) ? Math.trunc(eidB) : -1
    );
    luaApi.lua_pushinteger(state, canCollide ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'mark_collision_pair_if_new', (state) => {
    const eidA = luaApi.lua_tonumber(state, 1);
    const eidB = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eidA) || !Number.isFinite(eidB)) {
      luaApi.lua_pushinteger(state, 0);
      return 1;
    }
    const isNew = markPhysics3dCollisionPairSeenIfNew(world, Math.trunc(eidA), Math.trunc(eidB));
    luaApi.lua_pushinteger(state, isNew ? 1 : 0);
    return 1;
  });

  setHostFunction(luaState, 'emit_collision_event', (state) => {
    const eidA = luaApi.lua_tonumber(state, 1);
    const eidB = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eidA) || !Number.isFinite(eidB)) return 0;
    emitPhysics3dCollisionEvent(world, Math.trunc(eidA), Math.trunc(eidB));
    return 0;
  });

  setHostFunction(luaState, 'apply_collision_responses_for_contact', (state) => {
    const contactIndex = luaApi.lua_tonumber(state, 1);
    const eidA = luaApi.lua_tonumber(state, 2);
    const eidB = luaApi.lua_tonumber(state, 3);
    if (!Number.isFinite(contactIndex) || !Number.isFinite(eidA) || !Number.isFinite(eidB)) {
      return 0;
    }
    applyPhysics3dCollisionResponsesForContact(
      world,
      Math.trunc(contactIndex),
      Math.trunc(eidA),
      Math.trunc(eidB)
    );
    return 0;
  });

  setHostFunction(luaState, 'get_tic_duration_ms', (state) => {
    luaApi.lua_pushnumber(state, world.ticDurationMs);
    return 1;
  });

  setHostFunction(luaState, 'step_world_seconds', (state) => {
    const dtSec = luaApi.lua_tonumber(state, 1);
    stepPhysics3dWorld(world, Number.isFinite(dtSec) ? dtSec : 0);
    return 0;
  });

  setHostFunction(luaState, 'get_physics3d_tuning', (state) => {
    const tuning = getPhysics3dTuningSnapshot(world);
    luaApi.lua_newtable(state);
    luaApi.lua_pushnumber(state, tuning.ballGroundRestitution);
    luaApi.lua_setfield(state, -2, to_luastring('ballGroundRestitution'));
    luaApi.lua_pushnumber(state, tuning.ballActorRestitution);
    luaApi.lua_setfield(state, -2, to_luastring('ballActorRestitution'));
    luaApi.lua_pushnumber(state, tuning.ballBallRestitution);
    luaApi.lua_setfield(state, -2, to_luastring('ballBallRestitution'));
    return 1;
  });

  setHostFunction(luaState, 'set_contact_tuning', (state) => {
    const ground = luaApi.lua_tonumber(state, 1);
    const actor = luaApi.lua_tonumber(state, 2);
    const ball = luaApi.lua_tonumber(state, 3);
    setPhysics3dContactTuning(
      world,
      Number.isFinite(ground) ? ground : 0,
      Number.isFinite(actor) ? actor : 0,
      Number.isFinite(ball) ? ball : 0
    );
    return 0;
  });

  luaApi.lua_setglobal(luaState, to_luastring('__physics3d_host'));
  if (luaApi.lua_gettop(luaState) !== 0) {
    luaApi.lua_settop(luaState, 0);
  }
}

function createLuaRuntimeState(world: SimulatorWorld): Physics3dCoreRuntimeState {
  const luaState = lauxlibApi.luaL_newstate();
  lualibApi.luaL_openlibs(luaState);
  createHostApi(luaState, world);

  runLuaChunk(luaState, phaseOrderSource, 'phase_order');
  if (luaApi.lua_gettop(luaState) < 1 || luaApi.lua_type(luaState, -1) !== luaApi.LUA_TSTRING) {
    throw new Error(
      'physics3d core script must return a newline-delimited string of phase ids'
    );
  }
  const rawPhaseOrder = luaApi.lua_tojsstring(luaState, -1) ?? '';
  luaApi.lua_settop(luaState, 0);

  const phaseOrder = parsePhaseOrder(rawPhaseOrder);
  for (let i = 0; i < phaseOrder.length; i++) {
    const phaseId = phaseOrder[i];
    const source = getPhaseScriptSource(world, phaseId);
    if (source == null || source.trim().length === 0) {
      throw new Error(`missing physics3d phase script source for phase: ${phaseId}`);
    }
  }

  return {
    luaState,
    phaseOrder,
  };
}

function getOrCreateRuntimeState(world: SimulatorWorld): Physics3dCoreRuntimeState {
  const existing = runtimeByWorld.get(world);
  if (existing) return existing;
  const created = createLuaRuntimeState(world);
  runtimeByWorld.set(world, created);
  return created;
}

export function resetPhysics3dCoreRuntimeState(world: SimulatorWorld): void {
  runtimeByWorld.delete(world);
}

export function setPhysics3dCoreScriptOverrides(
  world: SimulatorWorld,
  overrides: Partial<Record<Physics3dPhaseId, string>> | null
): void {
  if (overrides == null) {
    scriptOverridesByWorld.delete(world);
    resetPhysics3dCoreRuntimeState(world);
    return;
  }
  scriptOverridesByWorld.set(world, overrides);
  resetPhysics3dCoreRuntimeState(world);
}

export function runPhysics3dSystemFromCoreScript(world: SimulatorWorld): SimulatorWorld {
  const runtime = getOrCreateRuntimeState(world);
  const lastTicMsByPhase = world.physics3dRuntimeMetrics.lastTicMsByPhase;
  const totalMsByPhase = world.physics3dRuntimeMetrics.totalMsByPhase;
  for (let i = 0; i < runtime.phaseOrder.length; i++) {
    const phaseId = runtime.phaseOrder[i];
    const source = getPhaseScriptSource(world, phaseId);
    const startedAt = nowMs();
    runLuaChunk(runtime.luaState, source, phaseId);
    const elapsed = nowMs() - startedAt;
    lastTicMsByPhase[phaseId] = elapsed;
    totalMsByPhase[phaseId] = (totalMsByPhase[phaseId] ?? 0) + elapsed;
    luaApi.lua_settop(runtime.luaState, 0);
  }
  world.physics3dRuntimeMetrics.ticCountMeasured += 1;
  return world;
}
