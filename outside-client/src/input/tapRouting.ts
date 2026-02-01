import { isWalkable, toTilePosition, type Position, type WorldState } from '@outside/core';

import type { ParsedCommand } from '../commands/parser';

export type TileCoordinate = { x: number; y: number };

export type TapRoutingResult = {
  commands: ParsedCommand[];
  resolved:
    | { kind: 'bot'; botId: string }
    | { kind: 'walkable-terrain'; tile: TileCoordinate; spawnedBotId: string; targetBotId: string }
    | { kind: 'noop'; reason: 'invalid-tile' | 'not-tappable' };
};

export function isTileTappable(world: WorldState, tile: TileCoordinate): boolean {
  if (!Number.isFinite(tile.x) || !Number.isFinite(tile.y)) return false;

  const botId = getBotIdAtTile(world, tile);
  if (botId) return true;

  return isWalkable(world, tile);
}

export function getBotIdAtTile(world: WorldState, tile: TileCoordinate): string | null {
  const tx = Math.floor(tile.x);
  const ty = Math.floor(tile.y);

  for (const obj of world.objects.values()) {
    if (obj.type !== 'bot' || !obj.position) continue;
    const p = toTilePosition(obj.position);
    if (p.x === tx && p.y === ty) return obj.id;
  }

  return null;
}

export function routeTileTapToCommands(args: {
  world: WorldState;
  tile: TileCoordinate;
  step: number;
  tightness?: number;
}): TapRoutingResult {
  const { world } = args;
  const tile = { x: Math.floor(args.tile.x), y: Math.floor(args.tile.y) };
  const step = Math.floor(args.step);
  const tightness = args.tightness ?? 0.5;

  if (!Number.isFinite(tile.x) || !Number.isFinite(tile.y)) {
    return { commands: [], resolved: { kind: 'noop', reason: 'invalid-tile' } };
  }

  const botId = getBotIdAtTile(world, tile);
  if (botId) {
    const bot = world.objects.get(botId);
    const urge = bot?.type === 'bot' ? (bot.urge?.urge ?? 'wander') : 'wander';

    // follow → wander, wander → wait, wait → wander
    const next: 'wander' | 'wait' =
      urge === 'follow' ? 'wander' : urge === 'wander' ? 'wait' : 'wander';

    return {
      commands: [{ type: next, id: botId }],
      resolved: { kind: 'bot', botId },
    };
  }

  if (!isWalkable(world, tile)) {
    return { commands: [], resolved: { kind: 'noop', reason: 'not-tappable' } };
  }

  const targetBotId = findNearestBotId(world, tile);
  if (!targetBotId) {
    return { commands: [], resolved: { kind: 'noop', reason: 'not-tappable' } };
  }

  const spawnedBotId = makeDeterministicSpawnBotId(world, tile, step);

  return {
    commands: [
      { type: 'create', objectType: 'bot', id: spawnedBotId },
      { type: 'place', id: spawnedBotId, x: tile.x, y: tile.y },
      { type: 'follow', id: spawnedBotId, targetId: targetBotId, tightness },
    ],
    resolved: { kind: 'walkable-terrain', tile, spawnedBotId, targetBotId },
  };
}

function findNearestBotId(world: WorldState, tile: TileCoordinate): string | null {
  const tap: Position = { x: tile.x + 0.5, y: tile.y + 0.5 };

  let best: { id: string; dist2: number } | null = null;
  for (const obj of world.objects.values()) {
    if (obj.type !== 'bot' || !obj.position) continue;

    const dx = obj.position.x - tap.x;
    const dy = obj.position.y - tap.y;
    const dist2 = dx * dx + dy * dy;

    if (!best || dist2 < best.dist2 || (dist2 === best.dist2 && obj.id < best.id)) {
      best = { id: obj.id, dist2 };
    }
  }

  return best?.id ?? null;
}

function makeDeterministicSpawnBotId(world: WorldState, tile: TileCoordinate, step: number): string {
  const base = `tap-bot-${tile.x}-${tile.y}-${step}`;
  let id = base;
  let n = 1;

  while (world.objects.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }

  return id;
}

