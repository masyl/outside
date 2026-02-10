import { describe, expect, it } from 'vitest';
import {
  pointersPack,
  POINTER_DEFAULT_VARIANT_ID,
  findPointerVariantById,
} from './meta';

describe('pointers meta', () => {
  it('should expose expected 7x7 cursor grid', () => {
    expect(pointersPack.layout.columns).toBe(7);
    expect(pointersPack.layout.rows).toBe(7);
    expect(pointersPack.layout.frameWidth).toBe(16);
    expect(pointersPack.layout.frameHeight).toBe(16);
    expect(pointersPack.pointers).toHaveLength(49);
  });

  it('should resolve default pointer variant and hotspot', () => {
    const variant = findPointerVariantById(POINTER_DEFAULT_VARIANT_ID);
    expect(variant).toBeDefined();
    expect(variant?.hotspot).toEqual({ x: 1, y: 1 });
  });
});
