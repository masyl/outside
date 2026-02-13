import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestPlayer } from '@outside/test-player';
import { MINIMAP_TEST_PLAYER_CONFIG } from './configs/minimap.test-player.config';

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
  title: 'HUD/Minimap',
  component: TestPlayer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dual-POV rendering on one canvas: a main camera and a configurable minimap overlay.',
      },
    },
  },
  argTypes: {
    spawnFn: { table: { disable: true } },
    seed: { table: { disable: true } },
    ticsPerSecond: { table: { disable: true } },
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
    pointerVariant: { table: { disable: true } },
    act: { table: { disable: true } },
    pace: { table: { disable: true } },
    onClickAction: { table: { disable: true } },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48, 64],
      name: 'Tile Size',
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
    physics3dRuntimeMode: { table: { disable: true } },
    physics3dTuning: { table: { disable: true } },
    controller: { table: { disable: true } },
    rendererVer: { table: { disable: true } },
    inspectorVer: { table: { disable: true } },
    inspector: { table: { disable: true } },
    showMinimap: { table: { disable: true } },
    minimapShape: {
      control: { type: 'select' },
      options: ['round', 'square'],
      name: 'Shape',
    },
    minimapPlacement: {
      control: { type: 'select' },
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      name: 'Placement',
    },
    minimapZoomLevel: {
      control: { type: 'range', min: 2, max: 16, step: 1 },
      name: 'Zoom Level',
    },
    minimapOpacity: {
      control: { type: 'range', min: 0.2, max: 1, step: 0.05 },
      name: 'Opacity',
    },
    minimapSnapToGrid: {
      control: { type: 'boolean' },
      name: 'Snap To Grid',
    },
    minimapSizeRatio: {
      control: { type: 'range', min: 0.08, max: 0.5, step: 0.01 },
      name: 'Size Ratio',
    },
    minimapPaddingXRatio: {
      control: { type: 'range', min: 0, max: 0.2, step: 0.005 },
      name: 'Padding X',
    },
    minimapPaddingYRatio: {
      control: { type: 'range', min: 0, max: 0.2, step: 0.005 },
      name: 'Padding Y',
    },
  },
};

export default meta;

export const RoundBottomRight: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
  },
};

export const SquareBottomRight: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
    minimapShape: 'square',
  },
};

export const RoundTopLeft: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
    minimapPlacement: 'top-left',
  },
};

export const SquareTopRightCompact: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
    minimapShape: 'square',
    minimapPlacement: 'top-right',
    minimapSizeRatio: 0.16,
    minimapZoomLevel: 5,
  },
};

export const RoundBottomLeftTranslucent: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
    minimapPlacement: 'bottom-left',
    minimapOpacity: 0.55,
    minimapZoomLevel: 3,
  },
};

export const RoundBottomRightLargeHighZoom: StoryObj<typeof TestPlayer> = {
  args: {
    ...MINIMAP_TEST_PLAYER_CONFIG,
    minimapPlacement: 'bottom-right',
    minimapSizeRatio: 0.26,
    minimapZoomLevel: 8,
    minimapPaddingXRatio: 0.035,
    minimapPaddingYRatio: 0.035,
  },
};
