import type { Meta, StoryObj } from '@storybook/react';
import { StoreWrapper } from '../components/wrappers/StoreWrapper';
import { GameWrapper } from '../components/wrappers/GameRendererWrapper';

const WorldPreview = ({ width, height, seed }: { width: number; height: number; seed: number }) => {
  const initialCommands = ['reset-world', `set-seed ${seed}`, `set-world-size ${width} ${height}`];

  return (
    <StoreWrapper initialCommands={initialCommands}>
      {(store) => (
        <div style={{ width: '100vw', height: '100vh' }}>
          <GameWrapper store={store} startupCommands={initialCommands} />
        </div>
      )}
    </StoreWrapper>
  );
};

const meta: Meta<typeof WorldPreview> = {
  title: 'World/Empty Worlds',
  component: WorldPreview,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    width: {
      control: { type: 'number', min: 1, max: 40, step: 1 },
    },
    height: {
      control: { type: 'number', min: 1, max: 30, step: 1 },
    },
    seed: {
      control: { type: 'number', min: 0, step: 1 },
    },
  },
};

export default meta;

export const Small: StoryObj<typeof WorldPreview> = {
  args: {
    width: 10,
    height: 6,
    seed: 0,
  },
};

export const Medium: StoryObj<typeof WorldPreview> = {
  args: {
    width: 8,
    height: 5,
    seed: 0,
  },
};

export const Large: StoryObj<typeof WorldPreview> = {
  args: {
    width: 12,
    height: 8,
    seed: 0,
  },
};

export const Controls: StoryObj<typeof WorldPreview> = {
  args: {
    width: 6,
    height: 4,
    seed: 0,
  },
};
