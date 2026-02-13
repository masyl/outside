/**
 * Event script runtime: dispatches engine/custom events to registered Lua handlers.
 * @packageDocumentation
 */

import { lauxlib, lua, lualib, to_luastring } from 'fengari';
import { queueCommandScript } from './command-scripts';
import type { SimulatorEvent } from './events';
import type { SimulatorWorld } from './world';

export type EventScriptPayloadValue = string | number | boolean | null;
export type EventScriptPayload = Record<string, EventScriptPayloadValue>;
export type EventScriptFailurePolicy = 'fail-fast' | 'continue';

export interface EventScriptRegistration {
  id: string;
  channel: string;
  source: string;
  priority?: number;
}

export interface EventScriptDescriptor {
  id: string;
  channel: string;
  source: string;
  priority: number;
}

export interface EventScriptEmitRequest {
  channel: string;
  payload?: EventScriptPayload;
}

export interface EventScriptError {
  scriptId: string;
  channel: string;
  ticCount: number;
  message: string;
}

interface LuaStateHandle {
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

interface RegisteredEventScriptInternal extends EventScriptDescriptor {
  registrationOrder: number;
}

interface QueuedEvent {
  channel: string;
  payload: EventScriptPayload;
  order: number;
}

interface ActiveDispatchContext {
  channel: string;
  scriptId: string;
  payload: EventScriptPayload;
  eventOrder: number;
}

interface EventScriptState {
  luaState: unknown;
  scriptsByChannel: Map<string, RegisteredEventScriptInternal[]>;
  queue: QueuedEvent[];
  nextEventOrder: number;
  nextRegistrationOrder: number;
  errors: EventScriptError[];
  trace: string[];
  failurePolicy: EventScriptFailurePolicy;
  activeDispatch?: ActiveDispatchContext;
  processedEventQueueLength: number;
}

const luaApi = lua as LuaStateHandle;
const lauxlibApi = lauxlib as LuaAuxlibHandle;
const lualibApi = lualib as LuaLibHandle;

const stateByWorld = new WeakMap<SimulatorWorld, EventScriptState>();

function compareScriptOrder(
  a: RegisteredEventScriptInternal,
  b: RegisteredEventScriptInternal
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return a.registrationOrder - b.registrationOrder;
}

function sanitizePayload(payload: EventScriptPayload | undefined): EventScriptPayload {
  if (payload == null) return {};
  const out: EventScriptPayload = {};
  const entries = Object.entries(payload);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (value == null || typeof value === 'string' || typeof value === 'boolean') {
      out[key] = value;
      continue;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
    }
  }
  return out;
}

function sanitizePriority(priority: number | undefined): number {
  if (!Number.isFinite(priority)) return 0;
  return Math.trunc(priority as number);
}

function setHostFunction(
  luaState: unknown,
  key: string,
  fn: (state: unknown) => number
): void {
  luaApi.lua_pushjsfunction(luaState, fn);
  luaApi.lua_setfield(luaState, -2, to_luastring(key));
}

function createRuntimeState(world: SimulatorWorld): EventScriptState {
  const runtimeState: EventScriptState = {
    luaState: lauxlibApi.luaL_newstate(),
    scriptsByChannel: new Map<string, RegisteredEventScriptInternal[]>(),
    queue: [],
    nextEventOrder: 0,
    nextRegistrationOrder: 0,
    errors: [],
    trace: [],
    failurePolicy: 'fail-fast',
    activeDispatch: undefined,
    processedEventQueueLength: 0,
  };

  lualibApi.luaL_openlibs(runtimeState.luaState);
  luaApi.lua_newtable(runtimeState.luaState);

  setHostFunction(runtimeState.luaState, 'trace', (state) => {
    const marker = luaApi.lua_tojsstring(state, 1) ?? '';
    const active = runtimeState.activeDispatch;
    if (active == null) return 0;
    runtimeState.trace.push(`${active.channel}|${active.scriptId}|${active.eventOrder}|${marker}`);
    return 0;
  });

  setHostFunction(runtimeState.luaState, 'get_event_number', (state) => {
    const key = luaApi.lua_tojsstring(state, 1) ?? '';
    const fallback = luaApi.lua_tonumber(state, 2);
    const active = runtimeState.activeDispatch;
    const value = active?.payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      luaApi.lua_pushnumber(state, value);
      return 1;
    }
    luaApi.lua_pushnumber(state, Number.isFinite(fallback) ? fallback : 0);
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

  luaApi.lua_setglobal(runtimeState.luaState, to_luastring('__outside_event_host'));
  luaApi.lua_settop(runtimeState.luaState, 0);
  return runtimeState;
}

function getOrCreateRuntimeState(world: SimulatorWorld): EventScriptState {
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
    throw new Error(`event script failed (${label}): ${message}`);
  }
}

function enqueueEvent(
  runtimeState: EventScriptState,
  channel: string,
  payload: EventScriptPayload
): void {
  runtimeState.queue.push({
    channel,
    payload: sanitizePayload(payload),
    order: runtimeState.nextEventOrder++,
  });
}

function queueEngineEvents(world: SimulatorWorld, runtimeState: EventScriptState): void {
  const eventQueue = world.eventQueue;
  if (runtimeState.processedEventQueueLength > eventQueue.length) {
    runtimeState.processedEventQueueLength = 0;
  }
  for (let i = runtimeState.processedEventQueueLength; i < eventQueue.length; i++) {
    const event = eventQueue[i];
    enqueueEvent(runtimeState, event.type, eventToPayload(event));
  }
  runtimeState.processedEventQueueLength = eventQueue.length;
}

function eventToPayload(event: SimulatorEvent): EventScriptPayload {
  if (event.type === 'collision') {
    return {
      entityA: event.entityA,
      entityB: event.entityB,
    };
  }
  if (event.type === 'food_loaded_in_canon') {
    return {
      canonEntity: event.canonEntity,
      foodEntity: event.foodEntity,
    };
  }
  if (event.type === 'projectile_fired') {
    return {
      shooterEntity: event.shooterEntity,
      projectileEntity: event.projectileEntity,
      foodEntity: event.foodEntity,
    };
  }
  return {
    entity: event.entity,
    foodEntity: event.foodEntity,
    x: event.x,
    y: event.y,
  };
}

/**
 * Registers an event script handler.
 */
export function registerEventScript(
  world: SimulatorWorld,
  registration: EventScriptRegistration
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  const id = registration.id.trim();
  const channel = registration.channel.trim();
  if (id.length === 0) {
    throw new Error('event script id must not be empty');
  }
  if (channel.length === 0) {
    throw new Error(`event script channel must not be empty: ${id}`);
  }
  if (registration.source.trim().length === 0) {
    throw new Error(`event script source must not be empty: ${id}`);
  }

  const list = runtimeState.scriptsByChannel.get(channel) ?? [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      throw new Error(`event script id already registered on channel ${channel}: ${id}`);
    }
  }

  list.push({
    id,
    channel,
    source: registration.source,
    priority: sanitizePriority(registration.priority),
    registrationOrder: runtimeState.nextRegistrationOrder++,
  });
  list.sort(compareScriptOrder);
  runtimeState.scriptsByChannel.set(channel, list);
}

/**
 * Unregisters an event script by ID and channel.
 */
export function unregisterEventScript(
  world: SimulatorWorld,
  channel: string,
  scriptId: string
): boolean {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return false;
  const list = runtimeState.scriptsByChannel.get(channel);
  if (list == null) return false;
  const index = list.findIndex((script) => script.id === scriptId);
  if (index < 0) return false;
  list.splice(index, 1);
  if (list.length === 0) runtimeState.scriptsByChannel.delete(channel);
  return true;
}

/**
 * Clears all event-script handlers and queued events.
 */
export function clearEventScripts(world: SimulatorWorld): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return;
  runtimeState.scriptsByChannel.clear();
  runtimeState.queue = [];
}

/**
 * Lists registered event-script handlers.
 */
export function listEventScripts(world: SimulatorWorld): EventScriptDescriptor[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const output: EventScriptDescriptor[] = [];
  const channels = Array.from(runtimeState.scriptsByChannel.keys()).sort();
  for (let i = 0; i < channels.length; i++) {
    const list = runtimeState.scriptsByChannel.get(channels[i]) ?? [];
    for (let j = 0; j < list.length; j++) {
      output.push({
        id: list[j].id,
        channel: list[j].channel,
        source: list[j].source,
        priority: list[j].priority,
      });
    }
  }
  return output;
}

/**
 * Enqueues a custom event for script dispatch.
 */
export function emitScriptEvent(world: SimulatorWorld, request: EventScriptEmitRequest): void {
  const runtimeState = getOrCreateRuntimeState(world);
  const channel = request.channel.trim();
  if (channel.length === 0) {
    throw new Error('event script channel must not be empty');
  }
  enqueueEvent(runtimeState, channel, request.payload ?? {});
}

/**
 * Configures event-script failure policy.
 */
export function setEventScriptFailurePolicy(
  world: SimulatorWorld,
  policy: EventScriptFailurePolicy
): void {
  const runtimeState = getOrCreateRuntimeState(world);
  runtimeState.failurePolicy = policy;
}

/**
 * Returns and clears event-script runtime errors.
 */
export function drainEventScriptErrors(world: SimulatorWorld): EventScriptError[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const errors = runtimeState.errors;
  runtimeState.errors = [];
  return errors;
}

/**
 * Returns and clears event-script trace entries.
 */
export function drainEventScriptTrace(world: SimulatorWorld): string[] {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return [];
  const trace = runtimeState.trace;
  runtimeState.trace = [];
  return trace;
}

/**
 * Dispatches queued engine and custom events to registered event scripts.
 */
export function runQueuedEventScripts(world: SimulatorWorld): void {
  const runtimeState = stateByWorld.get(world);
  if (runtimeState == null) return;

  queueEngineEvents(world, runtimeState);
  if (runtimeState.queue.length === 0) return;

  const pending = runtimeState.queue;
  runtimeState.queue = [];
  for (let i = 0; i < pending.length; i++) {
    const queued = pending[i];
    const handlers = runtimeState.scriptsByChannel.get(queued.channel);
    if (handlers == null || handlers.length === 0) continue;
    for (let j = 0; j < handlers.length; j++) {
      const handler = handlers[j];
      runtimeState.activeDispatch = {
        channel: queued.channel,
        scriptId: handler.id,
        payload: queued.payload,
        eventOrder: queued.order,
      };
      try {
        runLuaChunk(runtimeState.luaState, handler.source, `${queued.channel}:${handler.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (runtimeState.failurePolicy === 'continue') {
          runtimeState.errors.push({
            scriptId: handler.id,
            channel: queued.channel,
            ticCount: world.ticCount,
            message,
          });
          continue;
        }
        throw error;
      } finally {
        runtimeState.activeDispatch = undefined;
        luaApi.lua_settop(runtimeState.luaState, 0);
      }
    }
  }
}

