/**
 * Outside Simulator - Headless ECS simulation core
 *
 * Fixed-tic API: parent runs N tics, drains event queue between calls.
 * Systems run in order: urge → movement → collision.
 *
 * @packageDocumentation
 */

export const VERSION = '0.1.0';

export { createWorld, DEFAULT_TIC_DURATION_MS } from './world';
export type { SimulatorWorld, CreateWorldOptions } from './world';
export {
  addDefaultGrids,
  FLOOR_TILES_RESOLUTION,
  SUB_POSITION_SNAP_RESOLUTION,
} from './world-defaults';

export { runTics } from './run';

export { registerPipelineObservers, registerComponentForPipelineObserver } from './observers';

export { query } from './state';

export { getComponent, setComponent, set } from 'bitecs';

export { spawnBot, getOrCreateBotPrefab } from './prefabs/bot';
export type { SpawnBotOptions } from './prefabs/bot';
export { spawnFloorTile, spawnFloorRect, spawnWall } from './prefabs/floor';
export { spawnFood } from './prefabs/food';
export type { SpawnFoodOptions } from './prefabs/food';

export {
  createSoASerializer,
  createSoADeserializer,
  createSnapshotSerializer,
  createSnapshotDeserializer,
  createObserverSerializer,
  createObserverDeserializer,
  f32,
  f64,
  u8,
  i8,
  u16,
  i16,
  u32,
  i32,
  str,
  array,
  ref,
  $i8,
  $u16,
  $i16,
  $u32,
  $i32,
  $f32,
  $f64,
  $u8,
  $str,
  $ref,
} from './serialization';
export type {
  ObserverSerializerOptions,
  ObserverDeserializerOptions,
  AoSSerializerOptions,
  AoSDeserializerOptions,
  PrimitiveBrand,
} from './serialization';

export { getEventQueue, drainEventQueue } from './events-api';

export { configureTicDurationMs } from './configure';

export type { SimulatorEvent, CollisionEvent, ConsumedEvent } from './events';

export * from './components';
