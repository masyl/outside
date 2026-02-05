import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { generateExits, getAllPossibleExits, type TileKind } from '../utils/metatileDungeon';

const CELL_SIZE = 18;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function ExitStrip({ exit, index }: { exit: TileKind[]; index: number }) {
  const floorCount = exit.filter((t) => t === 'floor').length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <span style={{ width: 28, fontSize: 11, color: '#888' }}>#{index}</span>
      <span style={{ width: 48, fontSize: 11, color: '#aaa' }}>
        {floorCount} floor (len {exit.length})
      </span>
      <div style={{ display: 'flex' }}>
        {exit.map((t, i) => (
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

function ExitsGrid({ exits }: { exits: TileKind[][] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        Each row is one Exit: Wall (brown) + 2–12 Floor (green) + Wall (brown). Pattern must start and end with Wall.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {exits.map((exit, i) => (
          <ExitStrip key={i} exit={exit} index={i} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof ExitsGrid> = {
  title: 'MetaTile/Exits',
  component: ExitsGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Exits are Wall + 2–12 Floor + Wall. CompleteSet shows all 11 (one per floor count). RandomSample shows a generated sample for comparison.',
      },
    },
  },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 }, description: 'RNG seed' },
    count: { control: { type: 'number', min: 1, max: 64, step: 1 }, description: 'Number of exits to generate' },
  },
};

export default meta;

/** The complete set of possible exits: exactly 11, one per floor count 2..12. No duplicates. */
export const CompleteSet: StoryObj<typeof ExitsGrid> = {
  render: () => {
    const exits = getAllPossibleExits();
    return <ExitsGrid exits={exits} />;
  },
};

type RandomStory = StoryObj<{ seed: number; count: number }>;

function ExitsGridFromArgs({ seed, count }: { seed: number; count: number }) {
  const exits = React.useMemo(() => generateExits(seed, count), [seed, count]);
  return <ExitsGrid exits={exits} />;
}

/** Random sample (for comparison): may repeat and miss some floor counts. */
export const RandomSample: RandomStory = {
  render: (args) => <ExitsGridFromArgs seed={args.seed} count={args.count} />,
  args: {
    seed: 42,
    count: 20,
  },
};
