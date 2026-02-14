import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TestPlayer } from '@outside/test-player';
import { STATUS_BAR_TEST_PLAYER_CONFIG } from './configs/status-bar.test-player.config';

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

const meta: Meta<typeof TestPlayer> = {
  title: 'HUD/StatusBar',
  component: TestPlayer,
  decorators: [FullHeightDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Status bar overlay at the top of the viewport. Shows a fullscreen toggle and hero slots. ' +
          'This story has no hero — a dog and a cat wander a small 12×12 dungeon in the background.',
      },
    },
  },
  argTypes: {
    spawnFn: { table: { disable: true } },
    seed: { table: { disable: true } },
    ticsPerSecond: { table: { disable: true } },
    botCount: { table: { disable: true } },
    foodCount: { table: { disable: true } },
    dogCount: { table: { disable: true } },
    catCount: { table: { disable: true } },
    ballCount: { table: { disable: true } },
    ballBounciness: { table: { disable: true } },
    kickBaseImpulse: { table: { disable: true } },
    kickSpeedFactor: { table: { disable: true } },
    kickLiftBase: { table: { disable: true } },
    kickLiftBouncinessFactor: { table: { disable: true } },
    ballMaxHorizontalSpeed: { table: { disable: true } },
    ballGroundRestitution: { table: { disable: true } },
    actors: { table: { disable: true } },
  },
};

export default meta;

export const SmallDungeonDogCat: StoryObj<typeof TestPlayer> = {
  name: 'Small dungeon – dog & cat',
  args: { ...STATUS_BAR_TEST_PLAYER_CONFIG },
};
