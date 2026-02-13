import { defineTestPlayerConfig } from '@outside/test-player';
import { spawnMinimalArena } from '../../components/simulator/spawnCloud';

export const MINIMAL_ARENA_TEST_PLAYER_CONFIG = defineTestPlayerConfig({
  seed: 77,
  ticsPerSecond: 30,
  spawnFn: spawnMinimalArena,
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
