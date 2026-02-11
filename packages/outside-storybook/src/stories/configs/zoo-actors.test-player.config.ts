import { defineTestPlayerConfig } from '@outside/test-player';
import { ACTOR_ZOO_ALL_OPTION, spawnActorZoo } from '../../components/simulator/spawnCloud';

export const ZOO_ACTORS_TEST_PLAYER_CONFIG = defineTestPlayerConfig({
  seed: 42,
  ticsPerSecond: 30,
  botCount: 1,
  actors: ACTOR_ZOO_ALL_OPTION,
  act: 'idle',
  pace: 'walk',
  spawnFn: spawnActorZoo,
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
  onClickAction: 'jump-random',
  controller: {
    enabled: true,
    pollFps: 60,
    showDeviceSelector: true,
  },
});
