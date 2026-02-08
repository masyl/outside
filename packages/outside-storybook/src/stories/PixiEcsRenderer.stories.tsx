import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PixiEcsRendererStory } from '../components/renderer/PixiEcsRendererStory';
import {
  spawnFloorRectThenScattered,
  spawnDungeonThenScattered,
  spawnDungeonWithFoodAndHero,
} from '../components/simulator/spawnCloud';

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

const meta: Meta<typeof PixiEcsRendererStory> = {
  title: 'Renderer/Pixi ECS',
  component: PixiEcsRendererStory,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Pixi renderer synced to the ECS simulator via BitECS observer stream. Toggle inspector overlay to compare the same stream input.',
      },
    },
  },
  argTypes: {
    spawnFn: { table: { disable: true } },
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
    ticsPerSecond: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Simulation tics per second',
    },
    entityCount: {
      control: { type: 'number', min: 1, max: 200, step: 5 },
      description: 'Number of random-walk entities',
    },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48, 64],
      description: 'Tile size (pixels)',
    },
    showDebug: {
      control: { type: 'boolean' },
      description: 'Show debug overlay',
    },
    waitForAssets: {
      control: { type: 'boolean' },
      description: 'Delay render until assets load',
    },
    showInspectorOverlay: {
      control: { type: 'boolean' },
      description: 'Overlay inspector renderer on top of Pixi',
    },
    inspectorOpacity: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      description: 'Overlay opacity',
    },
    width: { control: { type: 'number', min: 300, step: 50 } },
    height: { control: { type: 'number', min: 300, step: 50 } },
  },
  args: {
    showInspectorOverlay: false,
    inspectorOpacity: 0.45,
  },
};

export default meta;

export const Default: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 25,
    spawnFn: spawnFloorRectThenScattered,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    showInspectorOverlay: false,
    inspectorOpacity: 0.45,
    width: 900,
    height: 700,
  },
};

export const WallDensity: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 123,
    ticsPerSecond: 8,
    entityCount: 30,
    spawnFn: spawnDungeonThenScattered,
    tileSize: 8,
    showDebug: false,
    waitForAssets: false,
    showInspectorOverlay: false,
    inspectorOpacity: 0.45,
    width: 900,
    height: 700,
  },
};

export const HeroAndFood: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 321,
    ticsPerSecond: 10,
    entityCount: 18,
    spawnFn: spawnDungeonWithFoodAndHero,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    showInspectorOverlay: false,
    inspectorOpacity: 0.45,
    width: 900,
    height: 700,
  },
};
