/**
 * Cat prefab: agile bot, faction=cat, hostile to dogs. Faster, lighter, higher jump.
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
import { FACTION_CAT, CAT_HOSTILE_MASK } from '../faction';
import type { SimulatorWorld } from '../world';

const DEFAULT_CANON_RANGE = 8;

export interface SpawnCatOptions extends SpawnBotOptions {
  canonRange?: number;
}

export function spawnCat(world: SimulatorWorld, options?: SpawnCatOptions): number {
  const eid = spawnBot(world, {
    walkingSpeedTps: 4,
    runningSpeedTps: 11,
    accelerationTps2: 24,
    variantSpriteKey: 'actor.bot.beige-cat',
    ...options,
  });

  addComponent(world, eid, Faction);
  setComponent(world, eid, Faction, { value: FACTION_CAT });

  addComponent(world, eid, HostileToFactions);
  setComponent(world, eid, HostileToFactions, { mask: CAT_HOSTILE_MASK });

  addComponent(world, eid, FoodCanon);
  setComponent(world, eid, FoodCanon, { loadedFoodEid: 0, ammoRemaining: 0 });

  addComponent(world, eid, CanonRange);
  setComponent(world, eid, CanonRange, { tiles: options?.canonRange ?? DEFAULT_CANON_RANGE });

  return eid;
}
