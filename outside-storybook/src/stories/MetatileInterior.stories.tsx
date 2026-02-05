import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { generateSingleInterior, type TileKind } from '../utils/metatileDungeon';

const CELL_SIZE = 8;
const INTERIOR_SIZE = 14;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function InteriorGrid({ grid, index }: { grid: TileKind[][]; index: number }) {
  return (
    <div style={{ display: 'inline-block', margin: 8, verticalAlign: 'top' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
        Interior #{index}
      </div>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${INTERIOR_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${INTERIOR_SIZE}, ${CELL_SIZE}px)`,
          gap: 0,
          backgroundColor: '#111',
          border: '1px solid #333',
        }}
      >
        {grid.flatMap((row, x) =>
          row.map((t, y) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: TILE_COLORS[t],
                border: 'none',
              }}
              title={`${x},${y}: ${t}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function InteriorsGrid({ interiors }: { interiors: TileKind[][][] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        A dozen 14×14 interiors. Each is generated from a frame (same seed builds frame then interior).
        Rules: Floor only next to Floor or Wall; every Floor ≥ 2 Floor neighbors; every Wall ≥ 2 Wall neighbors.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {interiors.map((grid, i) => (
          <InteriorGrid key={i} grid={grid} index={i} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof InteriorsGrid> = {
  title: 'MetaTile/Interior',
  component: InteriorsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '14×14 interior generation. Each interior is constrained by its frame (Empty/Wall/Floor). Generate a dozen to spot patterns.',
      },
    },
  },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'Base seed (interiors use seed, seed+1, …)' },
  },
};

export default meta;

type Story = StoryObj<{ seed: number }>;

export const DozenInteriors: Story = {
  render: (args) => {
    const interiors = React.useMemo(() => {
      const out: TileKind[][][] = [];
      for (let i = 0; i < 12; i++) {
        out.push(generateSingleInterior(args.seed + i));
      }
      return out;
    }, [args.seed]);
    return <InteriorsGrid interiors={interiors} />;
  },
  args: {
    seed: 0,
  },
};
