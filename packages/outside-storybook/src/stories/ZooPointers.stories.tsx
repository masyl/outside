import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestPlayer } from '@outside/test-player';
import { POINTER_ZOO_VARIANTS } from '../components/simulator/spawnCloud';
import { ZOO_POINTERS_TEST_PLAYER_CONFIG } from './configs/zoo-pointers.test-player.config';

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

const pointerOptions = POINTER_ZOO_VARIANTS.map((variant) => variant.id);
const pointerLabels = Object.fromEntries(
  POINTER_ZOO_VARIANTS.map((variant) => [variant.id, variant.label])
);

const meta: Meta<typeof TestPlayer> = {
  title: 'Zoo/Pointers',
  component: TestPlayer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cursor zoo: select the active custom pointer via control or by clicking any cursor swatch in the grid.',
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
    actors: { table: { disable: true } },
    act: { table: { disable: true } },
    pace: { table: { disable: true } },
    onClickAction: { table: { disable: true } },
    seed: { table: { disable: true } },
    ticsPerSecond: { table: { disable: true } },
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
    pointerVariant: {
      control: { type: 'select' },
      options: pointerOptions,
      labels: pointerLabels,
      name: 'Pointer',
      description: 'Active cursor style for the custom in-world pointer.',
    },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48, 64],
      description: 'Tile size (pixels)',
    },
  },
};

export default meta;

export const Pointers: StoryObj<typeof TestPlayer> = {
  render: (args) => (
    <TestPlayer
      {...args}
      showInspectorOverlay={args.inspector === true}
      showInspectorFollowLinks={false}
      showInspectorVelocityVectors={false}
      showInspectorCollisionTint={false}
      showInspectorWallOutlines={false}
      showInspectorPathfindingPaths={false}
      showInspectorPhysicsShapes={false}
    />
  ),
  args: {
    ...ZOO_POINTERS_TEST_PLAYER_CONFIG,
    inspector: false,
  },
};
