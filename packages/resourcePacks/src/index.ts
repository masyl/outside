export { pixelPlatterAtlasUrl } from './pixel-platter/atlas';
export { goldenRetrieverSheetUrl, beigeCatSheetUrl } from './paws-whiskers/atlas';

export {
  pixelPlatterPack,
  foodVariantIds,
  DEFAULT_FOOD_SPRITE_KEY,
  foodVariantToSpriteKey,
  findFoodVariantBySpriteKey,
  PIXEL_PLATTER_PACK_ID,
  PIXEL_PLATTER_PACK_VERSION,
} from './pixel-platter/meta';
export {
  goldenRetrieverPack,
  beigeCatPack,
  GOLDEN_RETRIEVER_VARIANT_ID,
  GOLDEN_RETRIEVER_BOT_SPRITE_KEY,
  GOLDEN_RETRIEVER_HERO_SPRITE_KEY,
  GOLDEN_RETRIEVER_ANIMATION_LAYOUT,
  BEIGE_CAT_VARIANT_ID,
  BEIGE_CAT_BOT_SPRITE_KEY,
  BEIGE_CAT_HERO_SPRITE_KEY,
  BEIGE_CAT_ANIMATION_LAYOUT,
  PAWS_WHISKERS_ACTOR_VARIANT_KEYS,
  PAWS_WHISKERS_PACK_ID,
  PAWS_WHISKERS_PACK_VERSION,
} from './paws-whiskers/meta';

export type {
  ResourcePackManifest,
  ResourcePackCredits,
  ResourcePackFoodVariant,
  ResourcePackFrame,
} from './pixel-platter/manifest.types';
export type { FoodVariantId } from './pixel-platter/meta';
export type {
  ActorVariantManifest,
  ActorVariantCredits,
  ActorVariantAnimationLayout,
  ActorVariantCardinalGroups,
} from './paws-whiskers/manifest.types';
