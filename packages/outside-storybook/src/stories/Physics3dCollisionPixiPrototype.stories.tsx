import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentType } from 'react';
import { PhysicsDungeonPixiPrototypeStory } from '../components/physics/PhysicsDungeonPixiPrototypeStory';

function FullHeightDecorator(Story: ComponentType) {
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

const meta: Meta<typeof PhysicsDungeonPixiPrototypeStory> = {
  title: 'Physics/3D Collision Pixi Prototype',
  component: PhysicsDungeonPixiPrototypeStory,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '3D collision prototype rendered through PixiEcsRenderer. Cannon drives ECS bot transforms; renderer consumes snapshot/delta stream like gameplay.',
      },
    },
  },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 } },
    botCount: { control: { type: 'number', min: 1, max: 20, step: 1 } },
    botMoveSpeed: { control: { type: 'number', min: 0.5, max: 8, step: 0.1 } },
    jumpImpulse: { control: { type: 'number', min: 0.5, max: 8, step: 0.1 } },
    severeClipTolerance: { control: { type: 'number', min: 0.01, max: 0.2, step: 0.01 } },
    tileSize: {
      control: { type: 'select' },
      options: [8, 12, 16, 24, 32, 48],
    },
  },
};

export default meta;

export const Baseline: StoryObj<typeof PhysicsDungeonPixiPrototypeStory> = {
  args: {
    seed: 42,
    botCount: 6,
    botMoveSpeed: 2.2,
    jumpImpulse: 2.4,
    severeClipTolerance: 0.03,
    tileSize: 24,
  },
};

export const Stress: StoryObj<typeof PhysicsDungeonPixiPrototypeStory> = {
  args: {
    seed: 42,
    botCount: 10,
    botMoveSpeed: 5.2,
    jumpImpulse: 3.6,
    severeClipTolerance: 0.03,
    tileSize: 24,
  },
};
