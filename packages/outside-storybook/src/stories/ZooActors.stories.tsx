import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestPlayer } from '@outside/test-player';
import {
  ACTOR_ZOO_ALL_OPTION,
  ACTOR_ZOO_PACE_OPTIONS,
  ACTOR_ZOO_VARIANTS,
} from '../components/simulator/spawnCloud';
import { ZOO_ACTORS_TEST_PLAYER_CONFIG } from './configs/zoo-actors.test-player.config';

function FullHeightDecorator(Story: React.ComponentType) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Story />
    </div>
  );
}

const actorOptions = [ACTOR_ZOO_ALL_OPTION, ...ACTOR_ZOO_VARIANTS.map((variant) => variant.id)];
const actorLabels = {
  [ACTOR_ZOO_ALL_OPTION]: 'All',
  ...Object.fromEntries(ACTOR_ZOO_VARIANTS.map((variant) => [variant.id, variant.label])),
} as const;
const actOptions = ['idle', 'wander', 'rotate', 'jump', 'follow', 'follow-mouse'] as const;
const actLabels = {
  idle: 'Idle',
  wander: 'Wander',
  rotate: 'Rotate',
  jump: 'Jump',
  follow: 'Track Mouse',
  'follow-mouse': 'Follow Mouse',
} as const;
const paceLabels = {
  walkSlow: 'Walk Slow',
  walk: 'Walk',
  run: 'Run',
  runFast: 'Run Fast',
} as const;
const onClickOptions = ['jump-random', 'jump-all', 'jump-sequence'] as const;
const onClickLabels = {
  'jump-random': 'Jump Random',
  'jump-all': 'Jump All',
  'jump-sequence': 'Jump Sequence',
} as const;

const meta: Meta<typeof TestPlayer> = {
  title: 'Zoo/Actors',
  component: TestPlayer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dynamic actor zoo. The room is generated on load and resized to fit selected actors.',
      },
    },
  },
  argTypes: {
    spawnFn: { table: { disable: true } },
    botCount: { table: { disable: true } },
    foodCount: { table: { disable: true } },
    dogCount: { table: { disable: true } },
    catCount: { table: { disable: true } },
    ballCount: { table: { disable: true } },
    ballBounciness: { table: { disable: true } },
    kickBaseImpulse: { table: { disable: true } },
    kickSpeedFactor: { table: { disable: true } },
    kickLiftBase: { table: { disable: true } },
    kickLiftBouncinessFactor: { table: { disable: true } },
    ballMaxHorizontalSpeed: { table: { disable: true } },
    ballGroundRestitution: { table: { disable: true } },
    physics3dRuntimeMode: {
      control: { type: 'select' },
      options: ['lua', 'ts'],
      name: 'Physics Runtime',
      description: 'Select which physics3d runtime executes each tic.',
    },
    actors: {
      control: { type: 'select' },
      options: actorOptions,
      labels: actorLabels,
      name: 'Actors',
      description: 'Actor to showcase in the zoo row (`all` shows every actor).',
    },
    act: {
      control: { type: 'select' },
      options: actOptions,
      labels: actLabels,
      name: 'Act',
      description: 'Actor behavior mode.',
    },
    pace: {
      control: { type: 'select' },
      options: ACTOR_ZOO_PACE_OPTIONS,
      labels: paceLabels,
      name: 'Pace',
      description: 'Movement pace when actors are set to wander.',
    },
    seed: { table: { disable: true } },
    ticsPerSecond: { table: { disable: true } },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48, 64],
      description: 'Tile size (pixels)',
    },
    waitForAssets: { table: { disable: true } },
    useCrtEffect: { table: { disable: true } },
    showInspectorOverlay: { table: { disable: true } },
    showInspectorFollowLinks: { table: { disable: true } },
    showInspectorVelocityVectors: { table: { disable: true } },
    showInspectorCollisionTint: { table: { disable: true } },
    showInspectorWallOutlines: { table: { disable: true } },
    showInspectorPathfindingPaths: { table: { disable: true } },
    showInspectorPhysicsShapes: { table: { disable: true } },
    rendererVer: { table: { disable: true } },
    inspectorVer: { table: { disable: true } },
    inspector: {
      control: { type: 'boolean' },
      name: 'Inspector',
      description: 'Toggle inspector overlay.',
    },
    onClickAction: {
      control: { type: 'select' },
      options: onClickOptions,
      labels: onClickLabels,
      name: 'onClick',
      description: 'Mouse click action for zoo actors.',
    },
  },
};

export default meta;

export const Actors: StoryObj<typeof TestPlayer> = {
  render: (args) => {
    const shouldShowWalkDebug = args.pace === 'walk';
    const shouldShowVectorDebug =
      shouldShowWalkDebug || args.act === 'follow' || args.act === 'follow-mouse';
    return (
      <TestPlayer
        {...args}
        showInspectorOverlay={args.inspector === true}
        showInspectorFollowLinks={false}
        showInspectorCollisionTint={false}
        showInspectorWallOutlines={false}
        showInspectorPhysicsShapes={false}
        showInspectorPathfindingPaths={shouldShowWalkDebug}
        showInspectorVelocityVectors={shouldShowVectorDebug}
      />
    );
  },
  args: {
    ...ZOO_ACTORS_TEST_PLAYER_CONFIG,
    inspector: false,
    onClickAction: 'jump-random',
  },
};
