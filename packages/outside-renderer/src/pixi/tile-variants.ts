/**
 * Generic weighted tile-variant pool.
 */
export interface TileVariantPool<T> {
  base: T | null;
  variants: readonly T[];
}

function hashTile(
  kind: 'floor' | 'wall',
  worldX: number,
  worldY: number,
  eid: number,
  extraSalt = 0
): number {
  const kindSalt = kind === 'wall' ? 0x9e3779b1 : 0x85ebca6b;
  const xi = Number.isFinite(worldX) ? Math.round(worldX) : eid;
  const yi = Number.isFinite(worldY) ? Math.round(worldY) : eid;
  let hash =
    ((xi * 374761393) ^
      (yi * 668265263) ^
      (eid * 2246822519) ^
      kindSalt ^
      extraSalt) >>>
    0;
  hash = (hash ^ (hash >>> 13)) >>> 0;
  hash = Math.imul(hash, 1274126177) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
}

/**
 * Picks a deterministic tile texture with 75% base / 25% variants.
 */
export function pickTileVariant<T>(
  pool: TileVariantPool<T>,
  params: { kind: 'floor' | 'wall'; worldX: number; worldY: number; eid: number }
): T | null {
  if (!pool.base && pool.variants.length === 0) return null;
  const hash = hashTile(params.kind, params.worldX, params.worldY, params.eid);
  if (!pool.base) {
    return pool.variants[hash % pool.variants.length] ?? null;
  }
  if (pool.variants.length === 0) return pool.base;

  const useVariant = hash % 4 === 0;
  if (!useVariant) return pool.base;
  return pool.variants[(hash >>> 2) % pool.variants.length] ?? pool.base;
}

export interface TileSubVariant {
  reflectX: boolean;
  reflectY: boolean;
  rotationRad: number;
}

export interface TileSubVariantFlags {
  reflectX: boolean;
  reflectY: boolean;
  rotate90: boolean;
  rotate180: boolean;
  rotate270: boolean;
}

const IDENTITY_SUB_VARIANT: TileSubVariant = {
  reflectX: false,
  reflectY: false,
  rotationRad: 0,
};

/**
 * Enumerates all valid transform sub-variants from manifest flags.
 */
export function buildTileSubVariants(flags: TileSubVariantFlags): TileSubVariant[] {
  const rotations = [0];
  if (flags.rotate90) rotations.push(Math.PI / 2);
  if (flags.rotate180) rotations.push(Math.PI);
  if (flags.rotate270) rotations.push((Math.PI * 3) / 2);

  const reflections = [{ reflectX: false, reflectY: false }];
  if (flags.reflectX) reflections.push({ reflectX: true, reflectY: false });
  if (flags.reflectY) reflections.push({ reflectX: false, reflectY: true });
  if (flags.reflectX && flags.reflectY) {
    reflections.push({ reflectX: true, reflectY: true });
  }

  const variants: TileSubVariant[] = [];
  for (const rotationRad of rotations) {
    for (const reflection of reflections) {
      variants.push({
        reflectX: reflection.reflectX,
        reflectY: reflection.reflectY,
        rotationRad,
      });
    }
  }
  return variants.length > 0 ? variants : [IDENTITY_SUB_VARIANT];
}

/**
 * Deterministically picks one sub-variant index for a tile.
 */
export function pickTileSubVariantIndex(
  subVariantCount: number,
  params: { kind: 'floor' | 'wall'; worldX: number; worldY: number; eid: number }
): number {
  if (subVariantCount <= 1) return 0;
  const hash = hashTile(params.kind, params.worldX, params.worldY, params.eid, 0x27d4eb2d);
  return hash % subVariantCount;
}
