/**
 * External system-script hook runtime for pre/post tic and core-system boundaries.
 * @packageDocumentation
 */

import { lauxlib, lua, lualib, to_luastring } from 'fengari';
import type { SimulatorWorld } from './world';
import { queueCommandScript } from './command-scripts';

export const SYSTEM_SCRIPT_HOOK_POINTS = [
  'tic:pre',
  'tic:post',
  'pointer:pre',
  'pointer:post',
  'pathFollowing:pre',
  'pathFollowing:post',
  'urge:pre',
  'urge:post',
  'pace:pre',
  'pace:post',
  'physics3d:pre',
  'physics3d:post',
  'consumption:pre',
  'consumption:post',
] as const;

export type SystemScriptHookPoint = (typeof SYSTEM_SCRIPT_HOOK_POINTS)[number];
export type CoreSystemHookTarget =
  | 'pointer'
  | 'pathFollowing'
  | 'urge'
  | 'pace'
  | 'physics3d'
  | 'consumption';
export type ExternalSystemScriptFailurePolicy = 'fail-fast' | 'continue';

export interface ExternalSystemScriptRegistration {
  id: string;
  hook: SystemScriptHookPoint;
  source: string;
  priority?: number;
}

export interface ExternalSystemScriptDescriptor {
  id: string;
  hook: SystemScriptHookPoint;
  source: string;
  priority: number;
}

export interface ExternalSystemScriptError {
  scriptId: string;
  hook: SystemScriptHookPoint;
  ticCount: number;
  message: string;
}

interface LuaStateHandle {
  lua_createtable: (L: unknown, narr: number, nrec: number) => void;
  lua_gettop: (L: unknown) => number;
  lua_newtable: (L: unknown) => void;
  lua_setglobal: (L: unknown, key: unknown) => void;
  lua_setfield: (L: unknown, idx: number, key: unknown) => void;
  lua_settop: (L: unknown, idx: number) => void;
  lua_pushjsfunction: (L: unknown, fn: (state: unknown) => number) => void;
  lua_pushnumber: (L: unknown, value: number) => void;
  lua_tonumber: (L: unknown, idx: number) => number;
  lua_tojsstring: (L: unknown, idx: number) => string | null;
  LUA_OK: number;
}

interface LuaAuxlibHandle {
  luaL_dostring: (L: unknown, source: unknown) => number;
  luaL_newstate: () => unknown;
}

interface LuaLibHandle {
  luaL_openlibs: (L: unknown) => void;
}

interface ScriptContext {
  scriptId: string;
  hook: SystemScriptHookPoint;
}

interface RegisteredScriptInternal extends ExternalSystemScriptDescriptor {
  registrationOrder: number;
}

interface ExternalSystemScriptState {
  luaState: unknown;
  nextRegistrationOrder: number;
  scriptsByHook: Record<SystemScriptHookPoint, RegisteredScriptInternal[]>;
  failurePolicy: ExternalSystemScriptFailurePolicy;
  errors: ExternalSystemScriptError[];
  trace: string[];
  activeContext?: ScriptContext;
}

const luaApi = lua as LuaStateHandle;
const lauxlibApi = lauxlib as LuaAuxlibHandle;
const lualibApi = lualib as LuaLibHandle;

const stateByWorld = new WeakMap<SimulatorWorld, ExternalSystemScriptState>();
const hookPointSet = new Set<string>(SYSTEM_SCRIPT_HOOK_POINTS);

function compareScriptOrder(
  a: RegisteredScriptInternal,
  b: RegisteredScriptInternal
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.registrationOrder - b.registrationOrder;
}

function createScriptsByHookMap(): Record<SystemScriptHookPoint, RegisteredScriptInternal[]> {
  const map = {} as Record<SystemScriptHookPoint, RegisteredScriptInternal[]>;
  for (let i = 0; i < SYSTEM_SCRIPT_HOOK_POINTS.length; i++) {
    map[SYSTEM_SCRIPT_HOOK_POINTS[i]] = [];
  }
  return map;
}

function setHostFunction(
  luaState: unknown,
  key: string,
  fn: (state: unknown) => number
): void {
  luaApi.lua_pushjsfunction(luaState, fn);
  luaApi.lua_setfield(luaState, -2, to_luastring(key));
}

function createRuntimeState(world: SimulatorWorld): ExternalSystemScriptState {
  const runtimeState: ExternalSystemScriptState = {
    luaState: lauxlibApi.luaL_newstate(),
    nextRegistrationOrder: 0,
    scriptsByHook: createScriptsByHookMap(),
    failurePolicy: 'fail-fast',
    errors: [],
    trace: [],
    activeContext: undefined,
  };

  lualibApi.luaL_openlibs(runtimeState.luaState);
  luaApi.lua_newtable(runtimeState.luaState);

  setHostFunction(runtimeState.luaState, 'trace', (state) => {
    const marker = luaApi.lua_tojsstring(state, 1) ?? '';
    const context = runtimeState.activeContext;
    if (context == null) return 0;
    runtimeState.trace.push(`${context.hook}|${context.scriptId}|${marker}`);
    return 0;
  });

  setHostFunction(runtimeState.luaState, 'get_tic_count', (state) => {
    luaApi.lua_pushnumber(state, world.ticCount);
    return 1;
  });

  setHostFunction(runtimeState.luaState, 'get_tic_duration_ms', (state) => {
    luaApi.lua_pushnumber(state, world.ticDurationMs);
    return 1;
  });

  setHostFunction(runtimeState.luaState, 'queue_command', (state) => {
    const commandId = luaApi.lua_tojsstring(state, 1) ?? '';
    if (commandId.trim().length === 0) return 0;
    const args: Record<string, number> = {};
    const argc = luaApi.lua_gettop(state);
    for (let i = 2; i + 1 <= argc; i += 2) {
      const key = luaApi.lua_tojsstring(state, i);
      const value = luaApi.lua_tonumber(state, i + 1);
      if (key == null || key.trim().length === 0 || !Number.isFinite(value)) continue;
      args[key] = value;
    }
    queueCommandScript(world, {
      commandId,
      args,
    });
    return 0;
  });

  luaApi.lua_setglobal(runtimeState.luaState, to_luastring('__outside_hook_host'));
  luaApi.lua_settop(runtimeState.luaState, 0);
  return runtimeState;
}

function getOrCreateRuntimeState(world: SimulatorWorld): ExternalSystemScriptState {
  const existing = stateByWorld.get(world);
  if (existing != null) return existing;
  const created = createRuntimeState(world);
  stateByWorld.set(world, created);
  return created;
}

function runLuaChunk(luaState: unknown, source: string, label: string): void {
  luaApi.lua_settop(luaState, 0);
  const status = lauxlibApi.luaL_dostring(luaState, to_luastring(source));
  if (status !== luaApi.LUA_OK) {
    const message = luaApi.lua_tojsstring(luaState, -1) ?? 'unknown Lua error';
    luaApi.lua_settop(luaState, 0);
    throw new Error(`external system script failed (${label}): ${message}`);
  }
}

function sanitizePriority(input: number | undefined): number {
  if (!Number.isFinite(input)) return 0;
  return Math.trunc(input as number);
}

function assertValidRegistration(
  runtimeState: ExternalSystemScriptState,
  registration: ExternalSystemScriptRegistration
): void {
  const id = registration.id.trim();
  if (id.length === 0) {
    throw new Error('external system script id must not be empty');
  }
  if (!hookPointSet.has(registration.hook)) {
    throw new Error(`unknown external system script hook: ${registration.hook}`);
  }
  if (registration.source.trim().length === 0) {
    throw new Error(`external system script source must not be empty: ${registration.id}`);
  }
  const scripts = Object.values(runtimeState.scriptsByHook);
  for (let i = 0; i < scripts.length; i++) {
    for (let j = 0; j < scripts[i].length; j++) {
      if (scripts[i][j].id === id) {
        throw new Error(`external system script id already registered: ${id}`);
      }
    }
  }
}

/**
 * Registers an external system script into a deterministic hook slot.
 */
export function registerExternalSystemScript(
  world: SimulatorWorld,
  registration: ExternalSystemScriptRegistration
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  assertValidRegistration(runtimeState, registration);
  const hook = registration.hook;
  const script: RegisteredScriptInternal = {
    id: registration.id.trim(),
    hook,
    source: registration.source,
    priority: sanitizePriority(registration.priority),
    registrationOrder: runtimeState.nextRegistrationOrder++,
  };
  const list = runtimeState.scriptsByHook[hook];
  list.push(script);
  list.sort(compareScriptOrder);
}

/**
 * Unregisters a previously registered external system script by ID.
 */
export function unregisterExternalSystemScript(world: SimulatorWorld, scriptId: string): boolean {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return false;
  for (let i = 0; i < SYSTEM_SCRIPT_HOOK_POINTS.length; i++) {
    const hook = SYSTEM_SCRIPT_HOOK_POINTS[i];
    const scripts = runtimeState.scriptsByHook[hook];
    const index = scripts.findIndex((script) => script.id === scriptId);
    if (index >= 0) {
      scripts.splice(index, 1);
      return true;
    }
  }
  return false;
}

/**
 * Removes all registered external system scripts from the world runtime.
 */
export function clearExternalSystemScripts(world: SimulatorWorld): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return;
  for (let i = 0; i < SYSTEM_SCRIPT_HOOK_POINTS.length; i++) {
    runtimeState.scriptsByHook[SYSTEM_SCRIPT_HOOK_POINTS[i]] = [];
  }
}

/**
 * Lists registered external system scripts in deterministic execution order.
 */
export function listExternalSystemScripts(world: SimulatorWorld): ExternalSystemScriptDescriptor[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const result: ExternalSystemScriptDescriptor[] = [];
  for (let i = 0; i < SYSTEM_SCRIPT_HOOK_POINTS.length; i++) {
    const hook = SYSTEM_SCRIPT_HOOK_POINTS[i];
    const scripts = runtimeState.scriptsByHook[hook];
    for (let j = 0; j < scripts.length; j++) {
      result.push({
        id: scripts[j].id,
        hook: scripts[j].hook,
        source: scripts[j].source,
        priority: scripts[j].priority,
      });
    }
  }
  return result;
}

/**
 * Configures failure handling policy for external system scripts.
 */
export function setExternalSystemScriptFailurePolicy(
  world: SimulatorWorld,
  policy: ExternalSystemScriptFailurePolicy
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  runtimeState.failurePolicy = policy;
}

/**
 * Returns and clears script runtime errors captured under `continue` failure policy.
 */
export function drainExternalSystemScriptErrors(world: SimulatorWorld): ExternalSystemScriptError[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const errors = runtimeState.errors;
  runtimeState.errors = [];
  return errors;
}

/**
 * Returns and clears hook trace entries emitted by scripts through `__outside_hook_host.trace`.
 */
export function drainExternalSystemScriptTrace(world: SimulatorWorld): string[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const trace = runtimeState.trace;
  runtimeState.trace = [];
  return trace;
}

/**
 * Executes all scripts registered for a specific hook point.
 */
export function runExternalSystemHook(world: SimulatorWorld, hook: SystemScriptHookPoint): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return;
  const scripts = runtimeState.scriptsByHook[hook];
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    runtimeState.activeContext = {
      scriptId: script.id,
      hook,
    };
    try {
      runLuaChunk(runtimeState.luaState, script.source, `${hook}:${script.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (runtimeState.failurePolicy === 'continue') {
        runtimeState.errors.push({
          scriptId: script.id,
          hook,
          ticCount: world.ticCount,
          message,
        });
        continue;
      }
      throw error;
    } finally {
      runtimeState.activeContext = undefined;
      luaApi.lua_settop(runtimeState.luaState, 0);
    }
  }
}
