import goldenRetrieverPackGenerated from './golden-retriever.pack.generated';
import beigeCatPackGenerated from './beige-cat.pack.generated';
import type {
  ActorVariantAnimationLayout,
  ActorVariantManifest,
} from './manifest.types';

/** Golden Retriever actor variant manifest. */
export const goldenRetrieverPack =
  goldenRetrieverPackGenerated as unknown as ActorVariantManifest;
/** Beige Cat actor variant manifest. */
export const beigeCatPack =
  beigeCatPackGenerated as unknown as ActorVariantManifest;

/** Variant id for this actor skin. */
export const GOLDEN_RETRIEVER_VARIANT_ID =
  goldenRetrieverPack.actorVariant.variantId;

/** Sprite key for bot entities using Golden Retriever skin. */
export const GOLDEN_RETRIEVER_BOT_SPRITE_KEY =
  goldenRetrieverPack.actorVariant.botSpriteKey;

/** Sprite key for hero entities using Golden Retriever skin. */
export const GOLDEN_RETRIEVER_HERO_SPRITE_KEY =
  goldenRetrieverPack.actorVariant.heroSpriteKey;

/** Shared animation layout metadata for Golden Retriever. */
export const GOLDEN_RETRIEVER_ANIMATION_LAYOUT =
  goldenRetrieverPack.actorVariant.animation as ActorVariantAnimationLayout;
/** Variant id for the Beige Cat skin. */
export const BEIGE_CAT_VARIANT_ID = beigeCatPack.actorVariant.variantId;

/** Sprite key for bot entities using Beige Cat skin. */
export const BEIGE_CAT_BOT_SPRITE_KEY =
  beigeCatPack.actorVariant.botSpriteKey;

/** Sprite key for hero entities using Beige Cat skin. */
export const BEIGE_CAT_HERO_SPRITE_KEY =
  beigeCatPack.actorVariant.heroSpriteKey;

/** Shared animation layout metadata for Beige Cat. */
export const BEIGE_CAT_ANIMATION_LAYOUT =
  beigeCatPack.actorVariant.animation as ActorVariantAnimationLayout;

/** Pack id for Storybook/debug metadata controls. */
export const PAWS_WHISKERS_PACK_ID = goldenRetrieverPack.id;

/** Pack version for Storybook/debug metadata controls. */
export const PAWS_WHISKERS_PACK_VERSION = goldenRetrieverPack.version;

/** All actor variant sprite keys available in this pack group. */
export const PAWS_WHISKERS_ACTOR_VARIANT_KEYS = {
  goldenRetriever: {
    bot: GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
    hero: GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  },
  beigeCat: {
    bot: BEIGE_CAT_BOT_SPRITE_KEY,
    hero: BEIGE_CAT_HERO_SPRITE_KEY,
  },
} as const;

export type { ActorVariantAnimationLayout } from './manifest.types';
