import { describe, expect, it } from 'vitest';
import {
  BEIGE_CAT_BOT_SPRITE_KEY,
  BEIGE_CAT_HERO_SPRITE_KEY,
  BEIGE_CAT_VARIANT_ID,
  GOLDEN_RETRIEVER_ANIMATION_LAYOUT,
  GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
  GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  PAWS_WHISKERS_ACTOR_VARIANT_KEYS,
  beigeCatPack,
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
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.frameInsetY).toBe(9);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.cardinalDirectionToGroup.down).toBe(4);
    expect(GOLDEN_RETRIEVER_ANIMATION_LAYOUT.cardinalDirectionToGroup.up).toBe(0);
  });

  it('should contain licensing restrictions metadata', () => {
    expect(goldenRetrieverPack.credits.restrictions.length).toBeGreaterThan(0);
    expect(beigeCatPack.credits.restrictions.length).toBeGreaterThan(0);
  });

  it('should expose Beige Cat actor bot/hero sprite keys', () => {
    expect(BEIGE_CAT_VARIANT_ID).toBe('beige-cat');
    expect(BEIGE_CAT_BOT_SPRITE_KEY.startsWith('actor.bot.')).toBe(true);
    expect(BEIGE_CAT_HERO_SPRITE_KEY.startsWith('actor.hero.')).toBe(true);
    expect(PAWS_WHISKERS_ACTOR_VARIANT_KEYS.beigeCat.bot).toBe(BEIGE_CAT_BOT_SPRITE_KEY);
    expect(PAWS_WHISKERS_ACTOR_VARIANT_KEYS.beigeCat.hero).toBe(BEIGE_CAT_HERO_SPRITE_KEY);
  });
});
