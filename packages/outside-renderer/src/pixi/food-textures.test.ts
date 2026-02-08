import { describe, expect, it } from 'vitest';
import { resolveFoodTexture } from './food-textures';

const tex = (name: string) => ({ name }) as unknown as any;

describe('resolveFoodTexture', () => {
  it('should return exact match first', () => {
    const map = new Map<string, any>([
      ['pickup.food', tex('default')],
      ['pickup.food.apple', tex('apple')],
    ]);
    expect(resolveFoodTexture(map, 'pickup.food.apple')).toBe(map.get('pickup.food.apple'));
  });

  it('should fall back to default food key when variant is missing', () => {
    const map = new Map<string, any>([['pickup.food', tex('default')]]);
    expect(resolveFoodTexture(map, 'pickup.food.unknown')).toBe(map.get('pickup.food'));
  });

  it('should return null when no fallback exists', () => {
    const map = new Map<string, any>();
    expect(resolveFoodTexture(map, 'pickup.food.apple')).toBeNull();
  });
});
