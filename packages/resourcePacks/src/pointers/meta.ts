import lightCursorsPackGenerated from './light-cursors.pack.generated';
import { pointerCursorDefaultUrl } from './atlas';
import type { PointerPackManifest, PointerPackVariant } from './manifest.types';

/** Pointer cursor manifest metadata. */
export const pointersPack = lightCursorsPackGenerated as unknown as PointerPackManifest;

/** Default pointer variant id. */
export const POINTER_DEFAULT_VARIANT_ID = pointersPack.defaults.baseVariantId;

/** Interactive pointer variant id. */
export const POINTER_INTERACTIVE_VARIANT_ID = pointersPack.defaults.interactiveVariantId;

/** All pointer variant ids in grid order. */
export const pointerVariantIds = pointersPack.pointers.map((variant) => variant.variantId);

/** Finds one pointer variant by id. */
export function findPointerVariantById(variantId: string): PointerPackVariant | undefined {
  return pointersPack.pointers.find((variant) => variant.variantId === variantId);
}

/** CSS cursor value for default pointer usage. */
export const POINTER_CURSOR_DEFAULT_CSS = `url("${pointerCursorDefaultUrl}") 1 1, default`;

/** CSS cursor value when pointing at interactive targets. */
export const POINTER_CURSOR_INTERACTIVE_CSS = `url("${pointerCursorDefaultUrl}") 1 1, pointer`;

/** Pack id exported for debug UIs. */
export const POINTERS_PACK_ID = pointersPack.id;

/** Pack version exported for debug UIs. */
export const POINTERS_PACK_VERSION = pointersPack.version;
