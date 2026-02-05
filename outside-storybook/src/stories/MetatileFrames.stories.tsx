import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  generateSingleFrame,
  countExitsInSide,
  type TileKind,
  type MetaTileFrame,
} from '../utils/metatileDungeon';

const CELL_SIZE = 10;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

/** Render a frame as 16×16 border only (same layout as assembleMetaTile: row0=left, row15=right, col0=top, col15=bottom). */
function FrameBorder({ frame, index }: { frame: MetaTileFrame; index: number }) {
  const totalExits =
    countExitsInSide(frame.top) +
    countExitsInSide(frame.bottom) +
    countExitsInSide(frame.left) +
    countExitsInSide(frame.right);
  const grid: (TileKind | null)[][] = Array.from({ length: 16 }, () =>
    Array(16).fill(null)
  );
  for (let i = 0; i < 16; i++) {
    grid[i][0] = frame.top[i];
    grid[i][15] = frame.bottom[i];
    grid[0][i] = frame.left[i];
    grid[15][i] = frame.right[i];
  }
  return (
    <div style={{ display: 'inline-block', margin: 8, verticalAlign: 'top' }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
        Frame #{index} (exits: {totalExits})
      </div>
      <div
        style={{
          display: 'inline-grid',
          gridTemplateColumns: `repeat(16, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(16, ${CELL_SIZE}px)`,
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
                backgroundColor: t ? TILE_COLORS[t] : '#1a1a1a',
                border: 'none',
              }}
              title={t ? `${x},${y}: ${t}` : `${x},${y}: (interior)`}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FramesGrid({ frames }: { frames: MetaTileFrame[] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        A dozen frames. Each frame is 4 sides (16 tiles each); total exits must be ≤ 8.
        Border layout: top=left column, bottom=right column, left=top row, right=bottom row (matches assembly).
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {frames.map((frame, i) => (
          <FrameBorder key={i} frame={frame} index={i} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof FramesGrid> = {
  title: 'MetaTile/Frames',
  component: FramesGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Generate a dozen frames to inspect the 4 sides. Each frame has top, bottom, left, right (length 16); total exits ≤ 8. Same seed order as in full dungeon.',
      },
    },
  },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'Base seed (frames use seed, seed+1, …)' },
  },
};

export default meta;

type Story = StoryObj<{ seed: number }>;

export const DozenFrames: Story = {
  render: (args) => {
    const frames = React.useMemo(() => {
      const out: MetaTileFrame[] = [];
      for (let i = 0; i < 12; i++) {
        out.push(generateSingleFrame(args.seed + i));
      }
      return out;
    }, [args.seed]);
    return <FramesGrid frames={frames} />;
  },
  args: {
    seed: 0,
  },
};
