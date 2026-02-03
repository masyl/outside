import type { Meta, StoryObj } from '@storybook/react';
import { SimulatorRenderer } from '../components/SimulatorRenderer';
import {
  spawnFollowChain,
  spawnBotsInWorld,
  spawnScatteredWithLeaders,
  spawnFloorRectThenScattered,
  spawnDungeonThenScattered,
} from '../components/simulator/spawnCloud';

const meta: Meta<typeof SimulatorRenderer> = {
  title: 'Simulator/ECS Core',
  component: SimulatorRenderer,
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
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
    ticsPerSecond: {
      control: { type: 'number', min: 1, max: 30, step: 1 },
      description: 'Simulation tics per second',
    },
    entityCount: {
      control: { type: 'number', min: 1, max: 2000, step: 10 },
      description: 'Number of random-walk entities',
    },
  },
};

export default meta;

/** Default: scatter placement, 1 in 5 leaders (Wander), rest Follow. Blue lines = follow, orange = velocity. */
export const Default: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 15,
    spawnFn: spawnScatteredWithLeaders,
  },
};

export const FewEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 8,
    entityCount: 8,
    spawnFn: spawnScatteredWithLeaders,
  },
};

export const ManyEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 999,
    ticsPerSecond: 30,
    entityCount: 999,
    spawnFn: spawnScatteredWithLeaders,
  },
};

/** All bots Wander (no follow); same scatter placement. */
export const AllWander: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 20,
    spawnFn: spawnBotsInWorld,
  },
};

/** Five bots in a follow chain: leader (Wander), four followers (Follow). Blue lines = follow links, orange = velocity. */
export const FollowChain: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 5,
    spawnFn: spawnFollowChain,
  },
};

/** Floor rect + grid: walkable floor tiles in a rectangle, entities scattered. Grid lines (floor + sub-snap) and dark grey tiles visible. */
export const FloorGridRect: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 15,
    spawnFn: spawnFloorRectThenScattered,
  },
};

/** Dungeon layout: rooms + tunnels as floor tiles, entities on floor. Pan/zoom to see full 80×50 layout. */
export const FloorGridDungeon: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 10,
    entityCount: 20,
    spawnFn: spawnDungeonThenScattered,
  },
};
