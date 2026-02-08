import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RENDERER_VERSION } from '@outside/renderer';
import { INSPECTOR_RENDERER_VERSION } from '@outside/inspector-renderer';
import { PixiEcsRendererStory } from '../components/renderer/PixiEcsRendererStory';
import {
  spawnFloorRectThenScattered,
  spawnDungeonThenScattered,
  spawnDungeonWithFoodAndHero,
} from '../components/simulator/spawnCloud';

const RENDERER_VER =
  typeof RENDERER_VERSION === 'string' && RENDERER_VERSION.length > 0
    ? RENDERER_VERSION
    : 'unknown';
const INSPECTOR_VER =
  typeof INSPECTOR_RENDERER_VERSION === 'string' && INSPECTOR_RENDERER_VERSION.length > 0
    ? INSPECTOR_RENDERER_VERSION
    : 'unknown';

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
    waitForAssets: {
      control: { type: 'boolean' },
      description: 'Delay render until assets load',
    },
    showInspectorOverlay: {
      control: { type: 'boolean' },
      description: 'Overlay inspector renderer on top of Pixi',
    },
    showInspectorFollowLinks: {
      control: { type: 'boolean' },
      description: 'Inspector: show follow-target links',
    },
    showInspectorVelocityVectors: {
      control: { type: 'boolean' },
      description: 'Inspector: show velocity vectors',
    },
    showInspectorCollisionTint: {
      control: { type: 'boolean' },
      description: 'Inspector: tint colliding bots/walls',
    },
    rendererVer: {
      control: { type: 'select' },
      options: [RENDERER_VER],
      description: 'Full semver for @outside/renderer',
      table: { readonly: true },
    },
    inspectorVer: {
      control: { type: 'select' },
      options: [INSPECTOR_VER],
      description: 'Full semver for @outside/inspector-renderer',
      table: { readonly: true },
    },
  },
  args: {
    showInspectorOverlay: false,
    showInspectorFollowLinks: true,
    showInspectorVelocityVectors: true,
    showInspectorCollisionTint: true,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
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
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const WallDensity: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 123,
    ticsPerSecond: 8,
    entityCount: 30,
    spawnFn: spawnDungeonThenScattered,
    tileSize: 8,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const HeroAndFood: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 321,
    ticsPerSecond: 10,
    entityCount: 81,
    spawnFn: spawnDungeonWithFoodAndHero,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};
