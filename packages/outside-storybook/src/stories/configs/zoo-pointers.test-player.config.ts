import { defineTestPlayerConfig } from '@outside/test-player';
import {
  POINTER_ZOO_DEFAULT_POINTER_SPRITE_KEY,
  spawnPointerZoo,
} from '../../components/simulator/spawnCloud';

export const ZOO_POINTERS_TEST_PLAYER_CONFIG = defineTestPlayerConfig({
  seed: 42,
  ticsPerSecond: 30,
  botCount: 1,
  spawnFn: spawnPointerZoo,
  pointerVariant: POINTER_ZOO_DEFAULT_POINTER_SPRITE_KEY,
  onClickAction: 'pick-pointer',
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
  controller: {
    enabled: true,
    pollFps: 60,
    showDeviceSelector: true,
  },
});
