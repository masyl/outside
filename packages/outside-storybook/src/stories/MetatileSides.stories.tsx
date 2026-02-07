import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { getAllPossibleSides, generateSides, type TileKind } from '../utils/metatileDungeon';

const CELL_SIZE = 18;

const TILE_COLORS: Record<TileKind, string> = {
  empty: '#2a2a2a',
  wall: '#5a4a3a',
  floor: '#4a7a4a',
};

function sideSegmentLabel(side: TileKind[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < side.length) {
    if (side[i] === 'empty') {
      let g = 0;
      while (i < side.length && side[i] === 'empty') {
        g++;
        i++;
      }
      parts.push(`G${g}`);
    } else if (side[i] === 'wall') {
      let e = 0;
      while (i < side.length && (side[i] === 'wall' || side[i] === 'floor')) {
        e++;
        i++;
      }
      parts.push(`E${e}`);
    } else {
      i++;
    }
  }
  return parts.join('+');
}

function SideStrip({ side, index }: { side: TileKind[]; index: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <span style={{ width: 28, fontSize: 11, color: '#888' }}>#{index}</span>
      <span style={{ width: 80, fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>
        {sideSegmentLabel(side)}
      </span>
      <div style={{ display: 'flex' }}>
        {side.map((t, i) => (
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

function SidesGrid({ sides }: { sides: TileKind[][] }) {
  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ marginBottom: 12, color: '#ccc', fontSize: 12 }}>
        Each row is one Side (16 tiles). Empty = dark, Wall = brown, Floor = green. Label: G = Gap length, E = Exit length.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sides.map((side, i) => (
          <SideStrip key={i} side={side} index={i} />
        ))}
      </div>
    </div>
  );
}

const meta: Meta<typeof SidesGrid> = {
  title: 'MetaTile/Sides',
  component: SidesGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sides are length-16 sequences of Gaps and Exits. First is always a Gap; Exit always followed by a Gap; last is always a Gap. Complete set enumerated below.',
      },
    },
  },
};

export default meta;

/** The complete set of possible Sides: all valid Gap/Exit sequences that sum to 16. No duplicates. */
export const CompleteSet: StoryObj<typeof SidesGrid> = {
  render: () => {
    const sides = getAllPossibleSides();
    return (
      <>
        <p style={{ padding: '0 16px', color: '#8a8', fontSize: 12 }}>
          Total: {sides.length} possible sides
        </p>
        <SidesGrid sides={sides} />
      </>
    );
  },
};

type RandomStory = StoryObj<{ seed: number; count: number }>;

/** Random sample (for comparison): may repeat and miss many. */
export const RandomSample: RandomStory = {
  render: (args) => {
    const sides = React.useMemo(() => generateSides(args.seed, args.count), [args.seed, args.count]);
    return <SidesGrid sides={sides} />;
  },
  args: { seed: 42, count: 24 },
  argTypes: {
    seed: { control: { type: 'number', min: 0, step: 1 } },
    count: { control: { type: 'number', min: 1, max: 64, step: 1 } },
  },
};
