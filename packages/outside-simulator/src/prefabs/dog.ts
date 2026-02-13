/**
 * Dog prefab: sturdy bot, faction=dog, hostile to cats. Slower, heavier, lower jump.
 * @packageDocumentation
 */
import { addComponent, setComponent } from 'bitecs';
import { spawnBot, type SpawnBotOptions } from './bot';
import {
  Faction,
  HostileToFactions,
  FoodCanon,
  CanonRange,
} from '../components';
import { FACTION_DOG, DOG_HOSTILE_MASK } from '../faction';
import type { SimulatorWorld } from '../world';

const DEFAULT_CANON_RANGE = 10;

export interface SpawnDogOptions extends SpawnBotOptions {
  canonRange?: number;
}

export function spawnDog(world: SimulatorWorld, options?: SpawnDogOptions): number {
  const eid = spawnBot(world, {
    walkingSpeedTps: 3,
    runningSpeedTps: 8,
    accelerationTps2: 16,
    visualDiameter: 1.4,
    obstacleDiameter: 0.95,
    variantSpriteKey: 'actor.bot.golden-retriever',
    ...options,
  });

  addComponent(world, eid, Faction);
  setComponent(world, eid, Faction, { value: FACTION_DOG });

  addComponent(world, eid, HostileToFactions);
  setComponent(world, eid, HostileToFactions, { mask: DOG_HOSTILE_MASK });

  addComponent(world, eid, FoodCanon);
  setComponent(world, eid, FoodCanon, { loadedFoodEid: 0, ammoRemaining: 0 });

  addComponent(world, eid, CanonRange);
  setComponent(world, eid, CanonRange, { tiles: options?.canonRange ?? DEFAULT_CANON_RANGE });

  return eid;
}
