import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RENDERER_VERSION } from '@outside/renderer';
import { INSPECTOR_RENDERER_VERSION } from '@outside/inspector-renderer';
import { foodVariantIds } from '@outside/resource-packs/pixel-platter/meta';
import {
  spawnBot,
  spawnFloorRect,
  spawnFloorTile,
  spawnFood,
  spawnHero,
  spawnWall,
} from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';
import { StaticPixiEcsRendererStory } from '../components/renderer/StaticPixiEcsRendererStory';
import { generateDungeon } from '../utils/dungeonLayout';

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

function spawnBoxDungeonWithHero(world: SimulatorWorld, _seed: number): void {
  const width = 30;
  const height = 20;
  const xMin = -width / 2;
  const yMin = -height / 2;
  const xMax = width / 2;
  const yMax = height / 2;
  spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
  for (let x = xMin - 1; x <= xMax + 1; x++) {
    spawnWall(world, x, yMin - 1);
    spawnWall(world, x, yMax + 1);
  }
  for (let y = yMin; y <= yMax; y++) {
    spawnWall(world, xMin - 1, y);
    spawnWall(world, xMax + 1, y);
  }
  spawnHero(world, { x: 0, y: 0 });
}

function spawnZoosWorld(world: SimulatorWorld, seed: number): void {
  const penSize = 10;
  const gap = 3;
  const pens = [
    { cx: -penSize - gap, cy: -penSize - gap },
    { cx: penSize + gap, cy: -penSize - gap },
    { cx: -penSize - gap, cy: penSize + gap },
    { cx: penSize + gap, cy: penSize + gap },
  ];

  for (const pen of pens) {
    const xMin = pen.cx - penSize / 2;
    const yMin = pen.cy - penSize / 2;
    const xMax = pen.cx + penSize / 2;
    const yMax = pen.cy + penSize / 2;
    spawnFloorRect(world, xMin, yMin, xMax, yMax, true);
    for (let x = xMin - 1; x <= xMax + 1; x++) {
      spawnWall(world, x, yMin - 1);
      spawnWall(world, x, yMax + 1);
    }
    for (let y = yMin; y <= yMax; y++) {
      spawnWall(world, xMin - 1, y);
      spawnWall(world, xMax + 1, y);
    }
  }

  spawnHero(world, { x: pens[0].cx, y: pens[0].cy });
  spawnBot(world, { x: pens[1].cx - 2, y: pens[1].cy, urge: 'none', tilesPerSec: 0 });
  spawnBot(world, { x: pens[1].cx + 2, y: pens[1].cy, urge: 'none', tilesPerSec: 0 });
  spawnFood(world, { x: pens[2].cx, y: pens[2].cy, variant: 'apple' });
  spawnBot(world, { x: pens[3].cx - 1, y: pens[3].cy + 1, urge: 'none', tilesPerSec: 0 });
  spawnFood(world, { x: pens[3].cx + 1, y: pens[3].cy - 1, variant: 'banana' });

  // Central walkway
  spawnFloorRect(world, -5, -2, 5, 2, true);
}

function spawnDungeonFromGrid(
  world: SimulatorWorld,
  grid: boolean[][],
  offsetX: number,
  offsetY: number
): void {
  const width = grid.length;
  const height = grid[0]?.length ?? 0;
  const filled = new Set<string>();

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!grid[x][y]) continue;
      const wx = x + offsetX;
      const wy = y + offsetY;
      spawnFloorTile(world, wx, wy, true);
      filled.add(`${wx},${wy}`);
    }
  }

  const adjacentOffsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    // Include diagonals so room corners are enclosed by walls.
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (!grid[x][y]) continue;
      for (const [dx, dy] of adjacentOffsets) {
        const nx = x + dx + offsetX;
        const ny = y + dy + offsetY;
        if (filled.has(`${nx},${ny}`)) continue;
        spawnWall(world, nx, ny);
        filled.add(`${nx},${ny}`);
      }
    }
  }
}

function spawnSmallDungeon(world: SimulatorWorld, seed: number): void {
  const { grid } = generateDungeon(30, 20, seed, 12, 4, 7);
  spawnDungeonFromGrid(world, grid, -15, -10);
}

function spawnLargeDungeonWithEntities(world: SimulatorWorld, seed: number): void {
  const { grid, roomCells } = generateDungeon(80, 50, seed, 32, 5, 11);
  spawnDungeonFromGrid(world, grid, -40, -25);

  const heroCell = roomCells[Math.floor(roomCells.length / 2)];
  if (heroCell) {
    spawnHero(world, { x: heroCell.x - 40 + 0.5, y: heroCell.y - 25 + 0.5 });
  }

  const botCount = Math.min(18, roomCells.length);
  for (let i = 0; i < botCount; i++) {
    const cell = roomCells[(i * 7) % roomCells.length];
    spawnBot(world, {
      x: cell.x - 40 + 0.5,
      y: cell.y - 25 + 0.5,
      urge: 'none',
      tilesPerSec: 0,
    });
  }

  const foodCount = Math.min(12, roomCells.length);
  for (let i = 0; i < foodCount; i++) {
    const cell = roomCells[(i * 11) % roomCells.length];
    const variant = foodVariantIds[i % foodVariantIds.length];
    spawnFood(world, { x: cell.x - 40 + 0.5, y: cell.y - 25 + 0.5, variant });
  }
}

function spawnSingleTileHero(world: SimulatorWorld, _seed: number): void {
  spawnFloorTile(world, 0, 0, true);
  spawnHero(world, { x: 0.5, y: 0.5 });
}

function spawnTileStrip(world: SimulatorWorld, _seed: number): void {
  for (let x = -6; x <= 6; x++) {
    spawnFloorTile(world, x, 0, true);
  }
  spawnHero(world, { x: 0, y: 0 });
}

function spawnFoodOnly(world: SimulatorWorld, _seed: number): void {
  spawnFood(world, { x: -2, y: -1, variant: 'apple' });
  spawnFood(world, { x: 2, y: -1, variant: 'orange' });
  spawnFood(world, { x: 0, y: 2, variant: 'strawberry' });
}

function spawnWallsOnly(world: SimulatorWorld, _seed: number): void {
  for (let x = -4; x <= 4; x++) {
    spawnWall(world, x, -3);
    spawnWall(world, x, 3);
  }
  for (let y = -2; y <= 2; y++) {
    spawnWall(world, -4, y);
    spawnWall(world, 4, y);
  }
}

function spawnFoodVariantGallery(world: SimulatorWorld, _seed: number): void {
  const columns = 6;
  const spacing = 2;
  for (let i = 0; i < foodVariantIds.length; i++) {
    const variant = foodVariantIds[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * spacing - ((columns - 1) * spacing) / 2;
    const y = -row * spacing + 2;
    spawnFloorTile(world, Math.floor(x), Math.floor(y), true);
    spawnFood(world, { x: x + 0.5, y: y + 0.5, variant });
  }
}

const meta: Meta<typeof StaticPixiEcsRendererStory> = {
  title: 'Renderer/Pixi ECS (Static)',
  component: StaticPixiEcsRendererStory,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Static Pixi renderer snapshots (no simulation loop). Toggle inspector overlay to compare debug output from the same snapshot stream.',
      },
    },
  },
  argTypes: {
    buildWorld: { table: { disable: true } },
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'Seed for layout' },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48, 64],
    },
    waitForAssets: { control: { type: 'boolean' } },
    useCrtEffect: { control: { type: 'boolean' } },
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
    showInspectorOverlay: { control: { type: 'boolean' } },
    showInspectorFollowLinks: { control: { type: 'boolean' } },
    showInspectorVelocityVectors: { control: { type: 'boolean' } },
    showInspectorCollisionTint: { control: { type: 'boolean' } },
    showInspectorWallOutlines: { control: { type: 'boolean' } },
    showInspectorPathfindingPaths: { control: { type: 'boolean' } },
  },
  args: {
    showInspectorOverlay: false,
    showInspectorFollowLinks: true,
    showInspectorVelocityVectors: true,
    showInspectorCollisionTint: true,
    showInspectorWallOutlines: true,
    showInspectorPathfindingPaths: false,
    useCrtEffect: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export default meta;

export const BoxDungeonHero: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnBoxDungeonWithHero,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: true,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const ZoosShowcase: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 7,
    buildWorld: spawnZoosWorld,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const SmallDungeonEmpty: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 3,
    buildWorld: spawnSmallDungeon,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const LargeDungeonWithEntities: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 9,
    buildWorld: spawnLargeDungeonWithEntities,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const SingleTileHero: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnSingleTileHero,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const TileStrip: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnTileStrip,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const FoodOnly: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnFoodOnly,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const FoodVariantGallery: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnFoodVariantGallery,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};

export const WallsOnly: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnWallsOnly,
    tileSize: 16,
    waitForAssets: false,
    showInspectorOverlay: false,
    rendererVer: RENDERER_VER,
    inspectorVer: INSPECTOR_VER,
  },
};
