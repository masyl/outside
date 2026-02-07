import { describe, expect, it } from 'vitest';

import { pickWorldAndTileFromScreen } from './tilePicking';

describe('tilePicking', () => {
  it('converts screen→world→tile with zero root offset', () => {
    const { world, tile } = pickWorldAndTileFromScreen({
      screen: { x: 64 * 2 + 1, y: 64 * 3 + 1 },
      rootPos: { x: 0, y: 0 },
      zoomScale: 1,
    });

    expect(tile).toEqual({ x: 2, y: 3 });
    expect(world.x).toBeCloseTo(2 + 1 / 64, 6);
    expect(world.y).toBeCloseTo(3 + 1 / 64, 6);
  });

  it('accounts for root offset and zoom scale', () => {
    const { tile } = pickWorldAndTileFromScreen({
      screen: { x: 64 * 2 * 2 + 5 + 10, y: 64 * 1 * 2 + 5 + 20 },
      rootPos: { x: 10, y: 20 },
      zoomScale: 2,
    });

    expect(tile).toEqual({ x: 2, y: 1 });
  });
});

