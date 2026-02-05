import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { getAllPossibleGaps, generateGaps, type TileKind } from '../utils/metatileDungeon';

const CELL_SIZE = 18;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function GapStrip({ gap, index }: { gap: TileKind[]; index: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <span style={{ width: 28, fontSize: 11, color: '#888' }}>#{index}</span>
      <span style={{ width: 24, fontSize: 11, color: '#aaa' }}>len {gap.length}</span>
      <div style={{ display: 'flex' }}>
        {gap.map((t, i) => (
          <div
            key={i}
            style={{
              width: CELL_SIZE - 1,
              height: CELL_SIZE - 1,
              backgroundColor: TILE_COLORS[t],
              border: '1px solid #444',
            }}
            title={`${i}: ${t}`}
          />
        ))}
      </div>
    </div>
  );
}

function GapsGrid({ gaps }: { gaps: TileKind[][] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        Each row is one Gap: 2–8 Empty tiles only. Length shown per row.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {gaps.map((gap, i) => (
          <GapStrip key={i} gap={gap} index={i} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof GapsGrid> = {
  title: 'MetaTile/Gaps',
  component: GapsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Gaps are 2–8 Empty tiles. There are exactly 7 possible gaps (one per length). Complete set below.',
      },
    },
  },
};

export default meta;

/** The complete set of possible gaps: exactly 7, one for each length 2..8. No duplicates. */
export const CompleteSet: StoryObj<typeof GapsGrid> = {
  render: () => {
    const gaps = getAllPossibleGaps();
    return <GapsGrid gaps={gaps} />;
  },
};

type RandomStory = StoryObj<{ seed: number; count: number }>;

/** Random sample (for comparison): may repeat and miss some lengths. */
export const RandomSample: RandomStory = {
  render: (args) => {
    const gaps = React.useMemo(() => generateGaps(args.seed, args.count), [args.seed, args.count]);
    return <GapsGrid gaps={gaps} />;
  },
  args: { seed: 42, count: 20 },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 } },
    count: { control: { type: 'number', min: 1, max: 64, step: 1 } },
  },
};
