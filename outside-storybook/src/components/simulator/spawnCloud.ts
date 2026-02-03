import { spawnBot } from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';

/** Deterministic 0..1 from seed; same seed + index gives same cloud. */
export function seededUnit(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

/**
 * Creates a world, spawns entityCount bots in a scattered cloud (near center first, further as count grows).
 * Returns the world and initial entity IDs for the movable query.
 */
export function spawnBotsInWorld(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const maxRadius = entityCount <= 1 ? 0 : 2 + Math.sqrt(entityCount) * 2;
  for (let i = 0; i < entityCount; i++) {
    const t = entityCount <= 1 ? 0 : i / (entityCount - 1);
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    const r = Math.sqrt(seededUnit(seed, i * 2 + 1));
    const radius = (0.15 + 0.85 * t) * maxRadius * r;
    spawnBot(world, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      diameter: 1.5,
      directionRad: seededUnit(seed, i * 3) * Math.PI * 2,
      tilesPerSec: 0.5 + (i % 3) * 0.3,
    });
  }
}
