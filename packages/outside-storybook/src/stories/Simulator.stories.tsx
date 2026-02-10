import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SimulatorRenderer } from '../components/SimulatorRenderer';
import {
  spawnFollowChain,
  spawnBotsInWorld,
  spawnScatteredWithLeaders,
  spawnDungeonThenScattered,
  spawnDungeonWithFood,
  spawnDungeonWithFoodAndHero,
  spawnDungeonWithSoccerBalls,
  spawnDungeonWFCThenScattered,
  spawnDungeonWFCWithFood,
  spawnDungeonWFCWithFoodAndHero,
} from '../components/simulator/spawnCloud';

/** Wrapper so the simulator fills the canvas and resizes with the viewport. */
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

const meta: Meta<typeof SimulatorRenderer> = {
  title: 'SIMULATOR/ECS Core',
  component: SimulatorRenderer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Headless ECS simulator (outside-simulator). Entities move and collide; red highlight shows collision detection. Events are queued and drained between tics.',
      },
    },
  },
  argTypes: {
    spawnFn: { table: { disable: true } },
    spawnPreset: { table: { disable: true } },
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
    ticsPerSecond: {
      control: { type: 'number', min: 1, max: 30, step: 1 },
      description: 'Simulation tics per second',
    },
    entityCount: {
      control: { type: 'number', min: 1, max: 2000, step: 10 },
      description: 'Number of random-walk entities',
    },
    zoom: {
      control: { type: 'range', min: 0.25, max: 4, step: 0.25 },
      description: 'Zoom level (1 = default)',
    },
    roomWidth: {
      control: { type: 'number', min: 4, max: 120, step: 2 },
      description: 'Room width in tiles (floor rect stories)',
    },
    roomHeight: {
      control: { type: 'number', min: 4, max: 80, step: 2 },
      description: 'Room height in tiles (floor rect stories)',
    },
    metaWidth: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'MetaTile grid width (metaTileDungeon preset)',
    },
    metaHeight: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'MetaTile grid height (metaTileDungeon preset)',
    },
  },
};

export default meta;

/** Default: scatter placement, 1 in 5 leaders (Wander), rest Follow. Blue lines = follow, orange = velocity. */
export const Default: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 15,
    spawnFn: spawnScatteredWithLeaders,
  },
};

export const FewEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 8,
    spawnFn: spawnScatteredWithLeaders,
  },
};

export const ManyEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 999,
    ticsPerSecond: 30,
    entityCount: 99,
    spawnFn: spawnScatteredWithLeaders,
  },
};

/** All bots Wander (no follow); same scatter placement. */
export const AllWander: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnFn: spawnBotsInWorld,
  },
};

/** Five bots in a follow chain: leader (Wander), four followers (Follow). Blue lines = follow links, orange = velocity. */
export const FollowChain: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 5,
    spawnFn: spawnFollowChain,
  },
};

/** Floor rect + grid: walkable floor tiles in a rectangle, entities scattered. Grid lines (floor + sub-snap) and dark grey tiles visible. */
export const FloorGridRect: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 15,
    spawnPreset: 'floorRect',
    roomWidth: 60,
    roomHeight: 40,
  },
};

/** Dungeon layout: rooms + tunnels as floor tiles, entities on floor. Pan/zoom to see full 80×50 layout. */
export const FloorGridDungeon: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnFn: spawnDungeonThenScattered,
  },
};

/** WFC-generated dungeon: organic floor layout (wave function collapse). Compare with FloorGridDungeon. */
export const FloorGridDungeonWFC: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnFn: spawnDungeonWFCThenScattered,
  },
};

/** MetaTile dungeon: 16×16 metatiles with Exits, Gaps, Sides, Frames, Interiors. Empty vs Wall distinct. Default 5×5 metatiles (80×80 tiles). */
export const FloorGridDungeonMetaTiles: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnPreset: 'metaTileDungeon',
    metaWidth: 5,
    metaHeight: 5,
    captionLegend: 'MetaTile dungeon. Use metaWidth / metaHeight controls to change grid size.',
  },
};

/** Dungeon + food: green circles are food; bots consume on overlap and food disappears. */
export const FloorGridDungeonWithFood: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnFn: spawnDungeonWithFood,
  },
};

/** WFC dungeon + food. Same as FloorGridDungeonWithFood but with WFC layout. */
export const FloorGridDungeonWithFoodWFC: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 20,
    spawnFn: spawnDungeonWFCWithFood,
  },
};

/** Pointer system: hover to see cursor (dotted tile). Empty=50%, floor/wall=100%, bot=green. Click empty→floor, floor→wall, wall→remove. */
export const PointerBasicCursor: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 6,
    spawnPreset: 'floorRect',
    roomWidth: 60,
    roomHeight: 40,
    captionLegend: 'Hover: pointer tile. Click empty→floor, floor→wall, wall→remove, bot→follow.',
  },
};

/** Pointer system: click a bot to follow it with the camera. The viewport will center on the clicked bot. */
export const PointerClickBot: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 8,
    spawnPreset: 'floorRect',
    roomWidth: 60,
    roomHeight: 40,
    captionLegend: 'Click a bot to follow it. Camera centers on the followed bot.',
  },
};

/** Hero (player-controlled) at center; click floor to order hero to that tile. Path and checkpoints drawn in yellow. */
export const HeroAndPathfinding: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 30,
    entityCount: 4,
    spawnPreset: 'floorRectWithHero',
    roomWidth: 60,
    roomHeight: 40,
    captionLegend:
      'Click a floor tile to order the hero there. Path: dotted yellow; checkpoints: yellow boxes.',
  },
};

/** Dungeon layout with 12 food items, 9 bots, and 1 hero. Camera follows hero. Click floor to order hero there. */
export const DungeonWithHero: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 9,
    spawnFn: spawnDungeonWithFoodAndHero,
    captionLegend: 'Dungeon: 12 food, 9 bots, 1 hero. Click floor to order hero there.',
  },
};

/** WFC dungeon with 12 food, 9 bots, 1 hero. Same as DungeonWithHero but WFC-generated layout. */
export const DungeonWithHeroWFC: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 30,
    entityCount: 9,
    spawnFn: spawnDungeonWFCWithFoodAndHero,
    captionLegend: 'WFC dungeon: 12 food, 9 bots, 1 hero. Click floor to order hero there.',
  },
};

/** Dungeon + soccer balls: bots should kick nearby balls and keep them moving. */
export const DungeonWithSoccerBalls: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 19,
    ticsPerSecond: 30,
    entityCount: 14,
    spawnFn: spawnDungeonWithSoccerBalls,
    captionLegend: 'Dungeon: bots kick nearby soccer balls (physics-driven).',
  },
};
