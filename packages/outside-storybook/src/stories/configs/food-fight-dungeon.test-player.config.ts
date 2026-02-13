import { defineTestPlayerConfig } from '@outside/test-player';
import { spawnFoodFightDungeon } from '../../components/simulator/spawnCloud';

export const FOOD_FIGHT_DUNGEON_TEST_PLAYER_CONFIG = defineTestPlayerConfig({
  seed: 77,
  ticsPerSecond: 30,
  spawnFn: spawnFoodFightDungeon,
  tileSize: 16,
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
  controller: {
    enabled: true,
    pollFps: 60,
    showDeviceSelector: true,
  },
});
