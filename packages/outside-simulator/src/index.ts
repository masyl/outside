/**
 * Outside Simulator - Headless ECS simulation core
 *
 * Fixed-tic API: parent runs N tics, drains event queue between calls.
 * Systems run in order: urge → movement → collision.
 *
 * @packageDocumentation
 */

export const VERSION = '0.1.13';

export { createWorld, DEFAULT_TIC_DURATION_MS } from './world';
export type { SimulatorWorld, CreateWorldOptions } from './world';
export {
  addDefaultGrids,
  addViewEntity,
  addPointerEntity,
  FLOOR_TILES_RESOLUTION,
  SUB_POSITION_SNAP_RESOLUTION,
} from './world-defaults';

export { runTics } from './run';

export { registerPipelineObservers, registerComponentForPipelineObserver } from './observers';

export { query } from './state';

export {
  addEntity,
  getComponent,
  setComponent,
  set,
  addComponent,
  removeComponent,
  removeEntity,
} from 'bitecs';

export { spawnBot, getOrCreateBotPrefab } from './prefabs/bot';
export type { SpawnBotOptions } from './prefabs/bot';
export { spawnHero, getOrCreateHeroPrefab } from './prefabs/hero';
export type { SpawnHeroOptions } from './prefabs/hero';
export { spawnFloorTile, spawnFloorRect, spawnWall } from './prefabs/floor';
export { spawnFood } from './prefabs/food';
export type { SpawnFoodOptions } from './prefabs/food';
export { spawnSoccerBall } from './prefabs/soccer-ball';
export type { SpawnSoccerBallOptions } from './prefabs/soccer-ball';
export { FOOD_VARIANTS, spawnFoodVariant, spawnFoodByVariant } from './prefabs/food-variants';
export type { SpawnFoodVariantOptions } from './prefabs/food-variants';
export {
  orderEntityToTile,
  getEntityPath,
  clearEntityPath,
  pathFollowingSystem,
} from './path-following';
export { findPath, getPassableTiles, simplifyPath } from './pathfinding';
export {
  getOrderedPathDebug,
  getWanderPathDebug,
  getPathfindingDebugPaths,
} from './pathfinding-debug';
export type { PathfindingDebugPath } from './pathfinding-debug';
export {
  TARGET_PACE_STANDING_STILL,
  TARGET_PACE_WALKING,
  TARGET_PACE_RUNNING,
  TARGET_PACE_WALKING_SLOW,
  TARGET_PACE_RUNNING_FAST,
} from './pace';
export type { TargetPaceValue } from './pace';

export {
  setPointerTile,
  setPointerWorld,
  getPointerTile,
  getPointerWorld,
  setPointerSpriteKey,
  getPointerSpriteKey,
  clearPointerTile,
  resolveEntityAt,
  getViewportFollowTarget,
  setViewportFollowTarget,
} from './pointer';
export type { ResolveEntityKind, ResolveEntityResult } from './pointer';

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

export { RENDER_COMPONENTS, RENDER_SNAPSHOT_COMPONENTS } from './render-schema';
export { createRenderObserverSerializer } from './render-stream';

export { getEventQueue, drainEventQueue } from './events-api';

export { configureTicDurationMs } from './configure';
export {
  debugJumpPulse,
  configurePhysics3dTuning,
  DEFAULT_PHYSICS3D_TUNING,
} from './systems/physics3d';
export type { Physics3dTuning } from './systems/physics3d';
export { paceSystem } from './systems/pace';
export { pointerSystem } from './systems/pointer';

export type { SimulatorEvent, CollisionEvent, ConsumedEvent } from './events';

export * from './components';
