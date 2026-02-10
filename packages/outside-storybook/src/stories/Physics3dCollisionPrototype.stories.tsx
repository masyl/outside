import type { Meta, StoryObj } from '@storybook/react';
import { PhysicsDungeonPrototypeStory } from '../components/physics/PhysicsDungeonPrototypeStory';

const meta: Meta<typeof PhysicsDungeonPrototypeStory> = {
  title: 'Physics/3D Collision Prototype',
  component: PhysicsDungeonPrototypeStory,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'First implementation attempt for 3D physics collision. Uses Cannon spheres (bots) against static wall boxes in a small dungeon and shows severe clipping metrics.',
      },
    },
  },
};

export default meta;

export const SmallDungeon: StoryObj<typeof PhysicsDungeonPrototypeStory> = {
  args: {
    seed: 42,
    botCount: 6,
    botMoveSpeed: 2.2,
    jumpImpulse: 2.4,
    severeClipTolerance: 0.03,
  },
};

export const HighSpeedStress: StoryObj<typeof PhysicsDungeonPrototypeStory> = {
  args: {
    seed: 42,
    botCount: 10,
    botMoveSpeed: 5.2,
    jumpImpulse: 3.6,
    severeClipTolerance: 0.03,
  },
};
