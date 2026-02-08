import goldenRetrieverPackGenerated from './golden-retriever.pack.generated';
import type {
  ActorVariantAnimationLayout,
  ActorVariantManifest,
} from './manifest.types';

/** Golden Retriever actor variant manifest. */
export const goldenRetrieverPack =
  goldenRetrieverPackGenerated as unknown as ActorVariantManifest;

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

/** Pack id for Storybook/debug metadata controls. */
export const PAWS_WHISKERS_PACK_ID = goldenRetrieverPack.id;

/** Pack version for Storybook/debug metadata controls. */
export const PAWS_WHISKERS_PACK_VERSION = goldenRetrieverPack.version;

export type { ActorVariantAnimationLayout } from './manifest.types';
