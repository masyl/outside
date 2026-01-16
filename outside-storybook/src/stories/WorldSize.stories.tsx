import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { StoreWrapper } from '../components/wrappers/StoreWrapper';
import { GameWrapper } from '../components/wrappers/GameRendererWrapper';

const WorldPreview = ({ width, height }: { width: number; height: number }) => {
  const initialCommands = [`set-world-size ${width} ${height}`, 'reset-world'];

  return (
    <StoreWrapper initialCommands={initialCommands}>
      {(store) => <GameWrapper width={width * 64} height={height * 64} store={store} />}
    </StoreWrapper>
  );
};

const meta: Meta<typeof WorldPreview> = {
  title: 'World/Empty Worlds',
  component: WorldPreview,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    width: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
    },
    height: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
    },
  },
};

export default meta;

export const Small: StoryObj<typeof WorldPreview> = {
  args: {
    width: 4,
    height: 3,
  },
};

export const Medium: StoryObj<typeof WorldPreview> = {
  args: {
    width: 8,
    height: 5,
  },
};

export const Large: StoryObj<typeof WorldPreview> = {
  args: {
    width: 12,
    height: 8,
  },
};

export const Controls: StoryObj<typeof WorldPreview> = {
  args: {
    width: 6,
    height: 4,
  },
};
