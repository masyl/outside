import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  generateSingleFrame,
  generateInteriorForFrame,
  assembleMetaTile,
  type TileKind,
} from '../utils/metatileDungeon';

const CELL_SIZE = 8;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function FullTile({ grid, index }: { grid: TileKind[][]; index: number }) {
  const size = grid.length;
  return (
    <div style={{ display: 'inline-block', margin: 8, verticalAlign: 'top' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
        Tile #{index} (16×16)
      </div>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(${size}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${size}, ${CELL_SIZE}px)`,
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

function InteriorsGrid({ tiles }: { tiles: TileKind[][][] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        One frame (seed), then 12 interiors for that frame. Shown: 12 full 16×16 tiles (frame + interior each).
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {tiles.map((grid, i) => (
          <FullTile key={i} grid={grid} index={i} />
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
          'One frame, 12 interiors: each assembled as a full 16×16 tile (frame + interior). Same frame for all 12.',
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
    const tiles = React.useMemo(() => {
      const frame = generateSingleFrame(args.seed);
      const out: TileKind[][][] = [];
      for (let i = 0; i < 12; i++) {
        const interior = generateInteriorForFrame(frame, args.seed + 1000 + i);
        out.push(assembleMetaTile(frame, interior));
      }
      return out;
    }, [args.seed]);
    return <InteriorsGrid tiles={tiles} />;
  },
  args: {
    seed: 0,
  },
};
