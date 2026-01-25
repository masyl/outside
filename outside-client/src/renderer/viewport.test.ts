import { describe, expect, it } from 'vitest';

import { computeViewportOffset } from './viewport';

describe('computeViewportOffset', () => {
  it('centers camera position on screen', () => {
    const offset = computeViewportOffset({
      cameraPos: { x: 0.5, y: 0.5 },
      screen: { width: 800, height: 600 },
      zoomScale: 1,
    });

    // Tile size is 64px, so (0.5, 0.5) maps to (32, 32).
    expect(offset).toEqual({ x: 800 / 2 - 32, y: 600 / 2 - 32 });
  });

  it('scales display offset with zoom', () => {
    const offset = computeViewportOffset({
      cameraPos: { x: 1, y: 2 },
      screen: { width: 1000, height: 700 },
      zoomScale: 2,
    });

    // (1,2) => (64,128) then scaled by 2 => (128,256).
    expect(offset).toEqual({ x: 1000 / 2 - 128, y: 700 / 2 - 256 });
  });
});

