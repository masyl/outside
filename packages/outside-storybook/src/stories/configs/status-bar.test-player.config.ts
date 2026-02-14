import { defineTestPlayerConfig } from '@outside/test-player';
import { spawnSmallDungeonWithDogAndCat } from '../../components/simulator/spawnCloud';

export const STATUS_BAR_TEST_PLAYER_CONFIG = defineTestPlayerConfig({
  seed: 42,
  ticsPerSecond: 30,
  botCount: 0,
  spawnFn: spawnSmallDungeonWithDogAndCat,
  tileSize: 32,
  waitForAssets: false,
  useCrtEffect: false,
  showInspectorOverlay: false,
  showInspectorFollowLinks: false,
  showInspectorVelocityVectors: false,
  showInspectorCollisionTint: false,
  showInspectorWallOutlines: false,
  showInspectorPathfindingPaths: false,
  showInspectorPhysicsShapes: false,
  physics3dRuntimeMode: 'lua',
  showMinimap: false,
  controller: {
    enabled: false,
  },
});
