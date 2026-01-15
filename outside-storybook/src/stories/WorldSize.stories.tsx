import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useMemo, useState } from 'react';
import { Store } from '@outside/client/src/store/store';
import { executeCommand } from '@outside/client/src/commands/handlers';
import { parseCommand } from '@outside/client/src/commands/parser';

const WorldPreview = ({ width, height }: { width: number; height: number }) => {
  const store = useMemo(() => new Store(), []);
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
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
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#444' }}>
        World size: {state.width} × {state.height}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.width}, 24px)`,
          gridTemplateRows: `repeat(${state.height}, 24px)`,
          gap: '2px',
          background: '#f5f5f5',
          padding: '8px',
          borderRadius: '6px',
        }}
      >
        {Array.from({ length: state.width * state.height }).map((_, index) => (
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

const WorldControlPanel = ({ width, height }: { width: number; height: number }) => {
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <label style={{ fontSize: '12px' }}>
        Width
        <input
          type="number"
          min={1}
          max={20}
          value={currentWidth}
          onChange={(event) => setCurrentWidth(Number(event.target.value))}
          style={{ marginLeft: '6px', width: '60px' }}
        />
      </label>
      <label style={{ fontSize: '12px' }}>
        Height
        <input
          type="number"
          min={1}
          max={20}
          value={currentHeight}
          onChange={(event) => setCurrentHeight(Number(event.target.value))}
          style={{ marginLeft: '6px', width: '60px' }}
        />
      </label>
      <WorldPreview width={currentWidth} height={currentHeight} />
    </div>
  );
};

const meta: Meta<typeof WorldControlPanel> = {
  title: 'World/Empty Worlds',
  component: WorldControlPanel,
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

export const Small: StoryObj<typeof WorldControlPanel> = {
  args: {
    width: 4,
    height: 3,
  },
};

export const Medium: StoryObj<typeof WorldControlPanel> = {
  args: {
    width: 8,
    height: 5,
  },
};

export const Large: StoryObj<typeof WorldControlPanel> = {
  args: {
    width: 12,
    height: 8,
  },
};

export const Controls: StoryObj<typeof WorldControlPanel> = {
  args: {
    width: 6,
    height: 4,
  },
};
