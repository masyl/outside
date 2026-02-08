import { describe, expect, it } from 'vitest';
import {
  GOLDEN_RETRIEVER_ANIMATION_LAYOUT,
  GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
  GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  goldenRetrieverPack,
} from './meta';

describe('goldenRetrieverPack', () => {
  it('should expose actor bot/hero sprite keys', () => {
    expect(GOLDEN_RETRIEVER_BOT_SPRITE_KEY.startsWith('actor.bot.')).toBe(true);
    expect(GOLDEN_RETRIEVER_HERO_SPRITE_KEY.startsWith('actor.hero.')).toBe(true);
  });

  it('should define usable animation layout', () => {
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.frameWidth).toBe(16);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.frameHeight).toBe(16);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.frameCount).toBe(4);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.cardinalDirectionToGroup.down).toBe(0);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.cardinalDirectionToGroup.up).toBe(4);
  });

  it('should contain licensing restrictions metadata', () => {
    expect(goldenRetrieverPack.credits.restrictions.length).toBeGreaterThan(0);
  });
});
