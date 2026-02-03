import { describe, it, expect } from 'vitest';
import { snapToGrid } from './grid';

describe('snapToGrid', () => {
  it('snaps to integer when resolution is 1', () => {
    expect(snapToGrid(0.3, 0.7, 1)).toEqual({ x: 0, y: 1 });
    expect(snapToGrid(1.5, -0.4, 1)).toEqual({ x: 2, y: 0 });
  });

  it('snaps to 1/8 when resolution is 0.125', () => {
    expect(snapToGrid(0, 0, 0.125)).toEqual({ x: 0, y: 0 });
    expect(snapToGrid(0.1, 0.1, 0.125)).toEqual({ x: 0.125, y: 0.125 });
    expect(snapToGrid(0.5, 0.5, 0.125)).toEqual({ x: 0.5, y: 0.5 });
    expect(snapToGrid(0.4, 0.6, 0.125)).toEqual({ x: 0.375, y: 0.625 });
  });
});
