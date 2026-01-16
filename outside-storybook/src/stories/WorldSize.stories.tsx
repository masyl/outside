import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useMemo, useState } from 'react';
import { Store } from '@outside/client/src/store/store';
import { executeCommand } from '@outside/client/src/commands/handlers';
import { parseCommand } from '@outside/client/src/commands/parser';

import { WorldState } from '@outside/core';

const WorldPreview = ({ width, height }: { width: number; height: number }) => {
  const store = useMemo(() => new Store(), []);
  const [currentState, setCurrentState] = useState<WorldState>(() => store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe((state: WorldState) => {
      setCurrentState(state);
    });
    return () => unsubscribe();
  }, [store]);

  useEffect(() => {
    const commands = [`set-world-size ${width} ${height}`, 'reset-world'];
    for (const command of commands) {
      const parsed = parseCommand(command);
      if (parsed.type !== 'unknown') {
        executeCommand(store, parsed);
      }
    }
  }, [store, width, height]);

  return (
    <div
      style={{
        display: 'inline-block',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#444' }}>
        World size: {currentState.width} × {currentState.height}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${currentState.width}, 24px)`,
          gridTemplateRows: `repeat(${currentState.height}, 24px)`,
          gap: '2px',
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: '6px',
        }}
      >
        {Array.from({ length: currentState.width * currentState.height }).map((_, index) => (
          <div
            key={index}
            style={{
              width: '24px',
              height: '24px',
              background: '#ffffff',
              border: '1px solid #e0e0e0',
              boxSizing: 'border-box',
            }}
          />
        ))}
      </div>
    </div>
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
