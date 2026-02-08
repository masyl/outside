/**
 * Generic weighted tile-variant pool.
 */
export interface TileVariantPool<T> {
  base: T | null;
  variants: readonly T[];
}

function hashTile(kind: 'floor' | 'wall', worldX: number, worldY: number, eid: number): number {
  const salt = kind === 'wall' ? 0x9e3779b1 : 0x85ebca6b;
  const xi = Number.isFinite(worldX) ? Math.round(worldX) : eid;
  const yi = Number.isFinite(worldY) ? Math.round(worldY) : eid;
  let hash = ((xi * 374761393) ^ (yi * 668265263) ^ (eid * 2246822519) ^ salt) >>> 0;
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
  if (!pool.base) {
    return (
      pool.variants[
        hashTile(params.kind, params.worldX, params.worldY, params.eid) %
          pool.variants.length
      ] ?? null
    );
  }
  if (pool.variants.length === 0) return pool.base;

  const hash = hashTile(params.kind, params.worldX, params.worldY, params.eid);
  const useVariant = hash % 4 === 0;
  if (!useVariant) return pool.base;
  return pool.variants[(hash >>> 2) % pool.variants.length] ?? pool.base;
}
