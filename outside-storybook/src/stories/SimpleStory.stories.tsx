import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SimpleStory } from '../components/SimpleStory';

const meta: Meta<typeof SimpleStory> = {
  title: 'Demo/Simple Story',
  component: SimpleStory,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

export const Default: StoryObj<typeof SimpleStory> = {
  args: {
    message: 'Welcome to Outside Storybook!',
  },
};

export const CustomMessage: StoryObj<typeof SimpleStory> = {
  args: {
    message: 'This is a custom message!',
  },
};
