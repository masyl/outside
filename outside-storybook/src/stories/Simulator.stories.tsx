import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SimulatorRenderer } from '../components/SimulatorRenderer';

const meta: Meta<typeof SimulatorRenderer> = {
  title: 'Simulator/ECS Core',
  component: SimulatorRenderer,
  parameters: {
    layout: 'centered',
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

export const Default: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 42,
    ticsPerSecond: 10,
    entityCount: 5,
  },
};

export const FewEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 123,
    ticsPerSecond: 8,
    entityCount: 3,
  },
};

export const ManyEntities: StoryObj<typeof SimulatorRenderer> = {
  args: {
    seed: 999,
    ticsPerSecond: 30,
    entityCount: 999,
  },
};
