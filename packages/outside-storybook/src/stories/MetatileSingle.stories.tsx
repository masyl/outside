import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { generateSingleMetaTile, type TileKind } from '../utils/metatileDungeon';

const CELL_SIZE = 14;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function MetaTileGrid({ grid }: { grid: TileKind[][] }) {
  const size = grid.length;
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${size}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${size}, ${CELL_SIZE}px)`,
          gap: 1,
          backgroundColor: '#111',
          padding: 1,
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

const meta: Meta<typeof MetaTileGrid> = {
  title: 'MetaTile/Single',
  component: MetaTileGrid,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single 16×16 MetaTile: frame (4 sides from Gaps + Exits) and 14×14 interior. Seed controls layout; same seed gives the same tile.',
      },
    },
  },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
  },
};

export default meta;

type Story = StoryObj<{ seed: number }>;

export const Default: Story = {
  render: (args) => {
    const grid = React.useMemo(
      () => generateSingleMetaTile(args.seed),
      [args.seed]
    );
    return <MetaTileGrid grid={grid} />;
  },
  args: {
    seed: 42,
  },
};
