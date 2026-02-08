import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
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
  spawnFood(world, { x: pens[2].cx, y: pens[2].cy });
  spawnBot(world, { x: pens[3].cx - 1, y: pens[3].cy + 1, urge: 'none', tilesPerSec: 0 });
  spawnFood(world, { x: pens[3].cx + 1, y: pens[3].cy - 1 });

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
    spawnFood(world, { x: cell.x - 40 + 0.5, y: cell.y - 25 + 0.5 });
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
  spawnFood(world, { x: -2, y: -1 });
  spawnFood(world, { x: 2, y: -1 });
  spawnFood(world, { x: 0, y: 2 });
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

function spawnMixedSizes(world: SimulatorWorld, _seed: number): void {
  spawnFloorRect(world, -6, -4, 6, 4, true);
  spawnBot(world, { x: -2, y: 0, visualDiameter: 0.8, obstacleDiameter: 0.6, urge: 'none' });
  spawnBot(world, { x: 0, y: 0, visualDiameter: 1.2, obstacleDiameter: 0.8, urge: 'none' });
  spawnBot(world, { x: 2, y: 0, visualDiameter: 1.6, obstacleDiameter: 1.0, urge: 'none' });
  spawnHero(world, { x: 0, y: -2 });
  spawnFood(world, { x: 0, y: 2 });
}

function spawnRenderKindPalette(world: SimulatorWorld, _seed: number): void {
  spawnFloorTile(world, -2, 0, true);
  spawnWall(world, -1, 0);
  spawnBot(world, { x: 0.5, y: 0.5, urge: 'none', tilesPerSec: 0 });
  spawnHero(world, { x: 1.5, y: 0.5 });
  spawnFood(world, { x: 2.5, y: 0.5 });
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
          'Static Pixi renderer snapshots (no simulation loop). Useful for composition and layout validation.',
      },
    },
  },
  argTypes: {
    buildWorld: { table: { disable: true } },
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'Seed for layout' },
    tileSize: { control: { type: 'number', min: 16, max: 64, step: 4 } },
    showDebug: { control: { type: 'boolean' } },
    waitForAssets: { control: { type: 'boolean' } },
    width: { control: { type: 'number', min: 300, step: 50 } },
    height: { control: { type: 'number', min: 300, step: 50 } },
  },
};

export default meta;

export const BoxDungeonHero: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnBoxDungeonWithHero,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const ZoosShowcase: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 7,
    buildWorld: spawnZoosWorld,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const SmallDungeonEmpty: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 3,
    buildWorld: spawnSmallDungeon,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const LargeDungeonWithEntities: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 9,
    buildWorld: spawnLargeDungeonWithEntities,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const SingleTileHero: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnSingleTileHero,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const TileStrip: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnTileStrip,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const FoodOnly: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnFoodOnly,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const WallsOnly: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnWallsOnly,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const MixedSizes: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnMixedSizes,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};

export const RenderKindPalette: StoryObj<typeof StaticPixiEcsRendererStory> = {
  args: {
    seed: 1,
    buildWorld: spawnRenderKindPalette,
    tileSize: 16,
    showDebug: false,
    waitForAssets: false,
    width: 900,
    height: 700,
  },
};
