import { describe, expect, it } from 'vitest';
import { snapToVirtualPixel } from './sprite-render';

describe('snapToVirtualPixel', () => {
  it('snaps to 1/16 tile increments', () => {
    expect(snapToVirtualPixel(10.12, 32)).toBe(10);
    expect(snapToVirtualPixel(10.9, 32)).toBe(10);
    expect(snapToVirtualPixel(11.1, 32)).toBe(12);
  });

  it('returns input when tile size is invalid', () => {
    expect(snapToVirtualPixel(10.25, 0)).toBe(10.25);
    expect(snapToVirtualPixel(10.25, Number.NaN)).toBe(10.25);
  });
});
