import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestPlayer } from '@outside/test-player';
import { LuaCrashReporter } from '../components/LuaCrashReporter';
import { MINIMAL_ARENA_TEST_PLAYER_CONFIG } from './configs/minimal-arena.test-player.config';

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

const meta: Meta<typeof TestPlayer> = {
  title: 'Arcade/Minimal Arena',
  component: TestPlayer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Minimal test arena: 12x12 room with 1 cat, 1 dog, and 5 fruit. Used for testing entity accumulation and collision system.',
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
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
    ticsPerSecond: { table: { disable: true } },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32],
      description: 'Tile size (pixels)',
    },
    inspector: {
      control: { type: 'boolean' },
      name: 'Inspector',
      description: 'Toggle inspector overlay.',
    },
    physics3dRuntimeMode: { table: { disable: true } },
    physics3dTuning: { table: { disable: true } },
    controller: { table: { disable: true } },
    act: { table: { disable: true } },
    pace: { table: { disable: true } },
    onClickAction: { table: { disable: true } },
    actors: { table: { disable: true } },
    pointerVariant: { table: { disable: true } },
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
  },
};

export default meta;

/** Minimal arena for testing entity accumulation. Cat vs Dog with hero referee. */
export const MinimalArena: StoryObj<typeof TestPlayer> = {
  render: (args) => (
    <>
      <TestPlayer
        {...args}
        showInspectorOverlay={args.inspector === true}
        showInspectorFollowLinks={false}
        showInspectorCollisionTint={false}
        showInspectorWallOutlines={false}
        showInspectorPhysicsShapes={false}
        showInspectorPathfindingPaths={false}
        showInspectorVelocityVectors={false}
      />
      <LuaCrashReporter />
    </>
  ),
  args: {
    ...MINIMAL_ARENA_TEST_PLAYER_CONFIG,
    inspector: false,
  },
};
