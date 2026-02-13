import type { createWorld, Physics3dRuntimeMode, Physics3dTuning } from '@outside/simulator';

export type TestPlayerAct = 'idle' | 'wander' | 'rotate' | 'jump' | 'follow' | 'follow-mouse';

export type TestPlayerPace = 'walkSlow' | 'walk' | 'run' | 'runFast';

export type TestPlayerOnClickAction =
  | 'order-path'
  | 'jump-random'
  | 'jump-all'
  | 'jump-sequence'
  | 'pick-pointer';

export type TestPlayerMinimapShape = 'round' | 'square';
export type TestPlayerMinimapPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface TestPlayerSpawnOptions {
  botCount?: number;
  foodCount?: number;
  dogCount?: number;
  catCount?: number;
  ballCount?: number;
  ballBounciness?: number;
  actorSelection?: string;
  actorAct?: TestPlayerAct;
  actorPace?: TestPlayerPace;
  pointerVariant?: string;
}

export type TestPlayerSpawnFn = (
  world: ReturnType<typeof createWorld>,
  seed: number,
  entityCount: number,
  spawnOptions?: TestPlayerSpawnOptions
) => void;

export interface TestPlayerControllerConfig {
  enabled?: boolean;
  gamepadIndex?: number;
  pollFps?: number;
  pointerTilesPerSecond?: number;
  showDeviceSelector?: boolean;
}

export interface TestPlayerProps {
  rendererVer?: string;
  inspectorVer?: string;
  seed: number;
  ticsPerSecond: number;
  botCount: number;
  foodCount?: number;
  dogCount?: number;
  catCount?: number;
  ballCount?: number;
  ballBounciness?: number;
  kickBaseImpulse?: number;
  kickSpeedFactor?: number;
  kickLiftBase?: number;
  kickLiftBouncinessFactor?: number;
  ballMaxHorizontalSpeed?: number;
  ballGroundRestitution?: number;
  actors?: string;
  pointerVariant?: string;
  act?: TestPlayerAct;
  pace?: TestPlayerPace;
  spawnFn: TestPlayerSpawnFn;
  tileSize?: number;
  waitForAssets?: boolean;
  useCrtEffect?: boolean;
  showInspectorOverlay?: boolean;
  showInspectorFollowLinks?: boolean;
  showInspectorVelocityVectors?: boolean;
  showInspectorCollisionTint?: boolean;
  showInspectorWallOutlines?: boolean;
  showInspectorPathfindingPaths?: boolean;
  showInspectorPhysicsShapes?: boolean;
  inspector?: boolean;
  onClickAction?: TestPlayerOnClickAction;
  showMinimap?: boolean;
  minimapShape?: TestPlayerMinimapShape;
  minimapPlacement?: TestPlayerMinimapPlacement;
  minimapZoomLevel?: number;
  minimapOpacity?: number;
  minimapSnapToGrid?: boolean;
  minimapSizeRatio?: number;
  minimapPaddingXRatio?: number;
  minimapPaddingYRatio?: number;
  physics3dRuntimeMode?: Physics3dRuntimeMode;
  physics3dTuning?: Partial<Physics3dTuning>;
  controller?: TestPlayerControllerConfig;
}

export type TestPlayerConfig = TestPlayerProps;
