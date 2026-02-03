import { spawnBot } from '@outside/simulator';
import type { SimulatorWorld } from '@outside/simulator';

/**
 * Spawns count bots in a follow chain: first is leader (Wander), rest Follow previous.
 */
export function spawnFollowChain(
  world: SimulatorWorld,
  _seed: number,
  count: number
): void {
  if (count < 1) return;
  const leader = spawnBot(world, { x: 0, y: 0 });
  let prev = leader;
  for (let i = 1; i < count; i++) {
    prev = spawnBot(world, {
      x: 3 * i,
      y: 0,
      urge: 'follow',
      followTargetEid: prev,
    });
  }
}

/** Deterministic 0..1 from seed; same seed + index gives same cloud. */
export function seededUnit(seed: number, index: number): number {
  const n = (seed + index * 7919) | 0;
  const t = Math.sin(n * 12.9898 + index * 78.233) * 43758.5453;
  return t - Math.floor(t);
}

/**
 * Same scatter as spawnBotsInWorld: positions from seeded cloud.
 * Used by spawnBotsInWorld and spawnScatteredWithLeaders.
 */
function scatterPositions(
  seed: number,
  entityCount: number
): { x: number; y: number; angle: number }[] {
  const maxRadius = entityCount <= 1 ? 0 : 2 + Math.sqrt(entityCount) * 2;
  const out: { x: number; y: number; angle: number }[] = [];
  for (let i = 0; i < entityCount; i++) {
    const t = entityCount <= 1 ? 0 : i / (entityCount - 1);
    const angle = seededUnit(seed, i * 2) * Math.PI * 2;
    const r = Math.sqrt(seededUnit(seed, i * 2 + 1));
    const radius = (0.15 + 0.85 * t) * maxRadius * r;
    out.push({
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      angle: seededUnit(seed, i * 3) * Math.PI * 2,
    });
  }
  return out;
}

/**
 * Creates a world, spawns entityCount bots in a scattered cloud (near center first, further as count grows).
 */
export function spawnBotsInWorld(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const positions = scatterPositions(seed, entityCount);
  for (let i = 0; i < entityCount; i++) {
    const p = positions[i];
    spawnBot(world, {
      x: p.x,
      y: p.y,
      diameter: 1.5,
      directionRad: p.angle,
      tilesPerSec: 1 + (i % 3) * 0.3,
    });
  }
}

/**
 * Same scattering algorithm as spawnBotsInWorld; 1 in 5 bots are leaders (Wander), rest Follow that leader.
 */
export function spawnScatteredWithLeaders(
  world: SimulatorWorld,
  seed: number,
  entityCount: number
): void {
  const positions = scatterPositions(seed, entityCount);
  let lastLeaderEid: number | null = null;
  for (let i = 0; i < entityCount; i++) {
    const p = positions[i];
    const isLeader = i % 5 === 0;
    if (isLeader) {
      lastLeaderEid = spawnBot(world, {
        x: p.x,
        y: p.y,
        diameter: 1.5,
        directionRad: p.angle,
        urge: 'wander',
      });
    } else {
      spawnBot(world, {
        x: p.x,
        y: p.y,
        diameter: 1.5,
        directionRad: p.angle,
        urge: 'follow',
        followTargetEid: lastLeaderEid!,
      });
    }
  }
}
