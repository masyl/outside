import type { Position, TerrainObject, WorldState } from '@outside/core';

export type RenderKind = 'terrain' | 'bot';

/**
 * Renderer-owned sprite identifier.
 *
 * This is intentionally NOT a Pixi texture or sprite reference. It is a stable key
 * that the renderer can resolve into textures/sprites using its own caches.
 */
export interface SpriteSpec {
  textureKey: string;
}

export interface Renderable {
  id: string; // stable EntityId (maps to WorldState ids)
  kind: RenderKind;
  position: Position; // grid position (top-left for terrain rectangles)
  sprite: SpriteSpec;
  z: number; // sort key (terrain < bots, terrain stacking preserved)
  size?: { width: number; height: number }; // terrain rectangles
}

// Terrain z uses `createdAt` which is currently ms since epoch (Date.now()).
// That value is ~1.7e12 today, so keep bot z safely above it.
const BOT_Z_BASE = 10_000_000_000_000;

function terrainToRenderable(terrain: TerrainObject): Renderable {
  return {
    id: terrain.id,
    kind: 'terrain',
    position: terrain.position,
    sprite: { textureKey: `terrain:${terrain.type}` },
    // Preserve stacking: newer terrain should appear above older terrain.
    z: terrain.createdAt,
    size: { width: terrain.width, height: terrain.height },
  };
}

/**
 * Build a flat list of renderables (bots + terrain) from WorldState.
 *
 * This is Phase 0/1 infrastructure: a derived view only. It MUST NOT mutate world.
 */
export function buildRenderables(world: WorldState): Renderable[] {
  const out: Renderable[] = [];

  // Terrain: one renderable per TerrainObject rectangle.
  for (const terrain of world.groundLayer.terrainObjects.values()) {
    out.push(terrainToRenderable(terrain));
  }

  // Bots: render only placed objects.
  for (const obj of world.objects.values()) {
    if (obj.type !== 'bot') continue;
    if (!obj.position) continue;

    out.push({
      id: obj.id,
      kind: 'bot',
      position: obj.position,
      sprite: { textureKey: 'bot' },
      z: BOT_Z_BASE,
    });
  }

  // Stable render order for deterministic debugging/parity checks.
  // z first, then id as a stable tie-breaker.
  out.sort((a, b) => (a.z - b.z !== 0 ? a.z - b.z : a.id.localeCompare(b.id)));

  return out;
}

