import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RENDERER_VERSION } from '@outside/renderer';
import { INSPECTOR_RENDERER_VERSION } from '@outside/inspector-renderer';
import { PixiEcsRendererStory } from '../components/renderer/PixiEcsRendererStory';
import {
  spawnFloorRectThenScattered,
  spawnDungeonThenScattered,
  spawnDungeonWithFoodAndHero,
  spawnDungeonWithSoccerBallsAndHero,
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
  title: 'RENDERED/Pixi ECS',
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
      control: { type: 'number', min: 1, max: 30, step: 1 },
      description: 'Simulation tics per second',
    },
    botCount: {
      control: { type: 'number', min: 0, max: 200, step: 1 },
      description: 'Number of default bots to spawn',
    },
    foodCount: {
      control: { type: 'number', min: 0, max: 200, step: 1 },
      description: 'Number of food entities (used by Hero and Food story)',
    },
    dogCount: {
      control: { type: 'number', min: 0, max: 200, step: 1 },
      description: 'Number of dog-variant bots (used by Hero and Food story)',
    },
    catCount: {
      control: { type: 'number', min: 0, max: 200, step: 1 },
      description: 'Number of cat-variant bots (used by Hero and Food story)',
    },
    ballCount: {
      control: { type: 'number', min: 0, max: 80, step: 1 },
      description: 'Number of soccer balls (used by Soccer Ball story)',
    },
    ballBounciness: {
      control: { type: 'number', min: 0, max: 1, step: 0.01 },
      description: 'Default bounciness assigned when soccer balls spawn',
    },
    kickBaseImpulse: {
      control: { type: 'number', min: 0, max: 2, step: 0.01 },
      description: 'Base kick impulse applied to soccer balls',
    },
    kickSpeedFactor: {
      control: { type: 'number', min: 0, max: 1, step: 0.01 },
      description: 'Extra kick impulse from kicker movement speed',
    },
    kickLiftBase: {
      control: { type: 'number', min: 0, max: 8, step: 0.1 },
      description: 'Base upward kick velocity applied to soccer balls',
    },
    kickLiftBouncinessFactor: {
      control: { type: 'number', min: 0, max: 4, step: 0.05 },
      description: 'Extra upward kick velocity scaled by ball bounciness',
    },
    ballMaxHorizontalSpeed: {
      control: { type: 'number', min: 1, max: 30, step: 0.5 },
      description: 'Clamp for soccer-ball horizontal speed',
    },
    ballGroundRestitution: {
      control: { type: 'number', min: 0, max: 1, step: 0.01 },
      description: 'Soccer-ball restitution against world surfaces',
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
    useCrtEffect: {
      control: { type: 'boolean' },
      description: 'Enable CRT TV post-processing filter',
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
    showInspectorWallOutlines: {
      control: { type: 'boolean' },
      description: 'Inspector: draw wall outlines',
    },
    showInspectorPathfindingPaths: {
      control: { type: 'boolean' },
      description: 'Inspector: show pathfinding debug paths',
    },
    showInspectorPhysicsShapes: {
      control: { type: 'boolean' },
      description: 'Inspector: show physics collider outlines (dotted blue)',
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
    showInspectorWallOutlines: true,
    showInspectorPathfindingPaths: false,
    showInspectorPhysicsShapes: false,
    useCrtEffect: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export default meta;

export const Default: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    botCount: 25,
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
    ticsPerSecond: 30,
    botCount: 30,
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
    seed: 4,
    ticsPerSecond: 30,
    botCount: 10,
    dogCount: 10,
    catCount: 10,
    foodCount: 10,
    spawnFn: spawnDungeonWithFoodAndHero,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: true,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
    showInspectorVelocityVectors: false,
    showInspectorFollowLinks: false,
    showInspectorCollisionTint: false,
    showInspectorWallOutlines: false,
    showInspectorPathfindingPaths: true,
    showInspectorPhysicsShapes: false,
  },
};

export const SoccerBallHeroControl: StoryObj<typeof PixiEcsRendererStory> = {
  args: {
    seed: 19,
    ticsPerSecond: 30,
    botCount: 12,
    ballCount: 36,
    ballBounciness: 0.9,
    kickBaseImpulse: 2,
    kickSpeedFactor: 0.08,
    kickLiftBase: 1.05,
    kickLiftBouncinessFactor: 1.25,
    ballMaxHorizontalSpeed: 20.5,
    ballGroundRestitution: 0.85,
    spawnFn: spawnDungeonWithSoccerBallsAndHero,
    tileSize: 32,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
    showInspectorVelocityVectors: false,
    showInspectorFollowLinks: false,
    showInspectorCollisionTint: false,
    showInspectorWallOutlines: false,
    showInspectorPathfindingPaths: true,
    showInspectorPhysicsShapes: true,
  },
};
