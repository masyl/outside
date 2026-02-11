/**
 * Lua command scripts: register by ID, queue invocations, and execute deterministically per tic.
 * @packageDocumentation
 */

import { addComponent, hasComponent } from 'bitecs';
import { lauxlib, lua, lualib, to_luastring } from 'fengari';
import { Direction, Speed } from './components';
import type { SimulatorWorld } from './world';

export type CommandScriptArgValue = string | number | boolean | null;
export type CommandScriptArgs = Record<string, CommandScriptArgValue>;
export type CommandScriptFailurePolicy = 'fail-fast' | 'continue';

export interface CommandScriptRegistration {
  id: string;
  source: string;
}

export interface CommandScriptDescriptor {
  id: string;
  source: string;
}

export interface CommandScriptInvocationRequest {
  commandId: string;
  args?: CommandScriptArgs;
}

export interface CommandScriptError {
  commandId: string;
  ticCount: number;
  message: string;
}

interface LuaStateHandle {
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

interface QueuedCommandInvocation {
  commandId: string;
  args: CommandScriptArgs;
  order: number;
}

type PendingCommand =
  | { type: 'set_direction'; eid: number; angle: number }
  | { type: 'set_speed'; eid: number; tilesPerSec: number };

interface CommandScriptState {
  luaState: unknown;
  registry: Map<string, CommandScriptDescriptor>;
  queue: QueuedCommandInvocation[];
  nextOrder: number;
  failurePolicy: CommandScriptFailurePolicy;
  errors: CommandScriptError[];
  trace: string[];
  activeInvocation?: QueuedCommandInvocation;
  pendingCommands: PendingCommand[];
}

const luaApi = lua as LuaStateHandle;
const lauxlibApi = lauxlib as LuaAuxlibHandle;
const lualibApi = lualib as LuaLibHandle;

const stateByWorld = new WeakMap<SimulatorWorld, CommandScriptState>();

function setHostFunction(
  luaState: unknown,
  key: string,
  fn: (state: unknown) => number
): void {
  luaApi.lua_pushjsfunction(luaState, fn);
  luaApi.lua_setfield(luaState, -2, to_luastring(key));
}

function createRuntimeState(world: SimulatorWorld): CommandScriptState {
  const runtimeState: CommandScriptState = {
    luaState: lauxlibApi.luaL_newstate(),
    registry: new Map<string, CommandScriptDescriptor>(),
    queue: [],
    nextOrder: 0,
    failurePolicy: 'fail-fast',
    errors: [],
    trace: [],
    activeInvocation: undefined,
    pendingCommands: [],
  };

  lualibApi.luaL_openlibs(runtimeState.luaState);
  luaApi.lua_newtable(runtimeState.luaState);

  setHostFunction(runtimeState.luaState, 'trace', (state) => {
    const marker = luaApi.lua_tojsstring(state, 1) ?? '';
    const active = runtimeState.activeInvocation;
    if (active == null) return 0;
    runtimeState.trace.push(`${active.commandId}|${active.order}|${marker}`);
    return 0;
  });

  setHostFunction(runtimeState.luaState, 'get_arg_number', (state) => {
    const key = luaApi.lua_tojsstring(state, 1) ?? '';
    const fallback = luaApi.lua_tonumber(state, 2);
    const active = runtimeState.activeInvocation;
    const value = active?.args[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      luaApi.lua_pushnumber(state, value);
      return 1;
    }
    luaApi.lua_pushnumber(state, Number.isFinite(fallback) ? fallback : 0);
    return 1;
  });

  setHostFunction(runtimeState.luaState, 'queue_set_direction', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const angle = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(angle)) return 0;
    runtimeState.pendingCommands.push({
      type: 'set_direction',
      eid: Math.trunc(eid),
      angle,
    });
    return 0;
  });

  setHostFunction(runtimeState.luaState, 'queue_set_speed', (state) => {
    const eid = luaApi.lua_tonumber(state, 1);
    const tilesPerSec = luaApi.lua_tonumber(state, 2);
    if (!Number.isFinite(eid) || !Number.isFinite(tilesPerSec)) return 0;
    runtimeState.pendingCommands.push({
      type: 'set_speed',
      eid: Math.trunc(eid),
      tilesPerSec,
    });
    return 0;
  });

  luaApi.lua_setglobal(runtimeState.luaState, to_luastring('__outside_command_host'));
  luaApi.lua_settop(runtimeState.luaState, 0);
  return runtimeState;
}

function getOrCreateRuntimeState(world: SimulatorWorld): CommandScriptState {
  const existing = stateByWorld.get(world);
  if (existing != null) return existing;
  const created = createRuntimeState(world);
  stateByWorld.set(world, created);
  return created;
}

function sanitizeArgs(args: CommandScriptArgs | undefined): CommandScriptArgs {
  if (args == null) return {};
  const output: CommandScriptArgs = {};
  const entries = Object.entries(args);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (value == null || typeof value === 'string' || typeof value === 'boolean') {
      output[key] = value;
      continue;
    }
    if (typeof value === 'number') {
      if (Number.isFinite(value)) output[key] = value;
      continue;
    }
  }
  return output;
}

function runLuaChunk(luaState: unknown, source: string, label: string): void {
  luaApi.lua_settop(luaState, 0);
  const status = lauxlibApi.luaL_dostring(luaState, to_luastring(source));
  if (status !== luaApi.LUA_OK) {
    const message = luaApi.lua_tojsstring(luaState, -1) ?? 'unknown Lua error';
    luaApi.lua_settop(luaState, 0);
    throw new Error(`command script failed (${label}): ${message}`);
  }
}

function applyPendingCommands(world: SimulatorWorld, commands: PendingCommand[]): void {
  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (command.type === 'set_direction') {
      if (!hasComponent(world, command.eid, Direction)) {
        addComponent(world, command.eid, Direction);
      }
      Direction.angle[command.eid] = command.angle;
      continue;
    }
    if (!hasComponent(world, command.eid, Speed)) {
      addComponent(world, command.eid, Speed);
    }
    Speed.tilesPerSec[command.eid] = Math.max(0, command.tilesPerSec);
  }
}

/**
 * Registers a command script by ID.
 */
export function registerCommandScript(
  world: SimulatorWorld,
  registration: CommandScriptRegistration
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  const id = registration.id.trim();
  if (id.length === 0) {
    throw new Error('command script id must not be empty');
  }
  if (registration.source.trim().length === 0) {
    throw new Error(`command script source must not be empty: ${id}`);
  }
  if (runtimeState.registry.has(id)) {
    throw new Error(`command script id already registered: ${id}`);
  }
  runtimeState.registry.set(id, {
    id,
    source: registration.source,
  });
}

/**
 * Unregisters a command script by ID.
 */
export function unregisterCommandScript(world: SimulatorWorld, commandId: string): boolean {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return false;
  return runtimeState.registry.delete(commandId);
}

/**
 * Removes all command scripts and queued invocations.
 */
export function clearCommandScripts(world: SimulatorWorld): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return;
  runtimeState.registry.clear();
  runtimeState.queue = [];
  runtimeState.pendingCommands = [];
}

/**
 * Lists currently registered command scripts.
 */
export function listCommandScripts(world: SimulatorWorld): CommandScriptDescriptor[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  return Array.from(runtimeState.registry.values()).sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Queues a command-script invocation for deterministic execution in the current/next tic.
 */
export function queueCommandScript(
  world: SimulatorWorld,
  request: CommandScriptInvocationRequest
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  runtimeState.queue.push({
    commandId: request.commandId,
    args: sanitizeArgs(request.args),
    order: runtimeState.nextOrder++,
  });
}

/**
 * Configures failure policy for command-script invocation execution.
 */
export function setCommandScriptFailurePolicy(
  world: SimulatorWorld,
  policy: CommandScriptFailurePolicy
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  runtimeState.failurePolicy = policy;
}

/**
 * Returns and clears command-script execution errors.
 */
export function drainCommandScriptErrors(world: SimulatorWorld): CommandScriptError[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const errors = runtimeState.errors;
  runtimeState.errors = [];
  return errors;
}

/**
 * Returns and clears command-script trace entries.
 */
export function drainCommandScriptTrace(world: SimulatorWorld): string[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const trace = runtimeState.trace;
  runtimeState.trace = [];
  return trace;
}

/**
 * Runs and drains queued command-script invocations in queue order.
 */
export function runQueuedCommandScripts(world: SimulatorWorld): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null || runtimeState.queue.length === 0) return;

  const pendingQueue = runtimeState.queue;
  runtimeState.queue = [];

  for (let i = 0; i < pendingQueue.length; i++) {
    const invocation = pendingQueue[i];
    const script = runtimeState.registry.get(invocation.commandId);
    if (script == null) {
      const message = `unknown command script id: ${invocation.commandId}`;
      if (runtimeState.failurePolicy === 'continue') {
        runtimeState.errors.push({
          commandId: invocation.commandId,
          ticCount: world.ticCount,
          message,
        });
        continue;
      }
      throw new Error(message);
    }

    runtimeState.activeInvocation = invocation;
    runtimeState.pendingCommands = [];
    try {
      runLuaChunk(runtimeState.luaState, script.source, invocation.commandId);
      applyPendingCommands(world, runtimeState.pendingCommands);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (runtimeState.failurePolicy === 'continue') {
        runtimeState.errors.push({
          commandId: invocation.commandId,
          ticCount: world.ticCount,
          message,
        });
        continue;
      }
      throw error;
    } finally {
      runtimeState.activeInvocation = undefined;
      runtimeState.pendingCommands = [];
      luaApi.lua_settop(runtimeState.luaState, 0);
    }
  }
}

