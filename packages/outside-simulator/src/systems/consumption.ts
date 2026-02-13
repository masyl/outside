/**
 * Consumption system: when a bot overlaps a food entity:
 * - If the bot has a FoodCanon with an empty chamber, the food is loaded into the canon
 *   (hidden, kept alive, linked via FoodCanon.loadedFoodEid). Emits FoodLoadedInCanonEvent.
 * - Otherwise the food is removed and a ConsumedEvent is emitted (original behaviour).
 * Runs after movement, before obstacle/collision. Food is walk-through (overlap only).
 * @packageDocumentation
 */

import { query, getComponent, removeComponent, removeEntity, hasComponent } from 'bitecs';
import {
  Position,
  ObstacleSize,
  Speed,
  Direction,
  Size,
  Food,
  DefaultSpriteKey,
  VariantSpriteKey,
  VisualSize,
  Observed,
  FoodCanon,
  ShotCount,
} from '../components';
import type { SimulatorWorld } from '../world';
import type { ConsumedEvent, FoodLoadedInCanonEvent } from '../events';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

interface Consumption {
  botEid: number;
  foodEid: number;
  x: number;
  y: number;
}

/**
 * Removes the render-observed components before deleting the entity.
 */
function clearFoodRenderComponents(world: SimulatorWorld, foodEid: number): void {
  removeComponent(world, foodEid, Food);
  removeComponent(world, foodEid, Position);
  removeComponent(world, foodEid, Size);
  removeComponent(world, foodEid, DefaultSpriteKey);
  removeComponent(world, foodEid, VariantSpriteKey);
  removeComponent(world, foodEid, VisualSize);
  removeComponent(world, foodEid, Observed);
}

/**
 * Hides a food entity into a canon: removes render/position components but keeps the entity
 * alive so it can be used as a projectile template and later respawned.
 */
function hideFoodIntoCanon(world: SimulatorWorld, foodEid: number): void {
  removeComponent(world, foodEid, Position);
  removeComponent(world, foodEid, Size);
  removeComponent(world, foodEid, Observed);
  // Keep: Food tag, DefaultSpriteKey, VariantSpriteKey, Bounciness, ProjectileMass, ShotCount
}

/** Bots (mobile) and food (Position + Size + Food). One food consumed per bot per tic (first overlap). */
export function consumptionSystem(world: SimulatorWorld): SimulatorWorld {
  const bots = query(world, [Position, ObstacleSize, Speed, Direction]);
  const foods = query(world, [Position, Size, Food]);
  const queue = world.eventQueue;

  const consumedFoodEids = new Set<number>();
  const consumptions: Consumption[] = [];

  for (let i = 0; i < bots.length; i++) {
    const botEid = bots[i];
    const posBot = getComponent(world, botEid, Position);
    const sizeBot = getComponent(world, botEid, ObstacleSize);
    const radiusBot = sizeBot.diameter / 2;

    for (let j = 0; j < foods.length; j++) {
      const foodEid = foods[j];
      if (consumedFoodEids.has(foodEid)) continue;

      const posFood = getComponent(world, foodEid, Position);
      const sizeFood = getComponent(world, foodEid, Size);
      const radiusFood = sizeFood.diameter / 2;
      const dist = distance(posBot.x, posBot.y, posFood.x, posFood.y);
      if (dist >= radiusBot + radiusFood) continue;

      consumedFoodEids.add(foodEid);
      consumptions.push({
        botEid,
        foodEid,
        x: posFood.x,
        y: posFood.y,
      });
      break;
    }
  }

  for (const { botEid, foodEid, x, y } of consumptions) {
    // If the consumer has an empty FoodCanon, load the food rather than destroying it.
    if (
      hasComponent(world, botEid, FoodCanon) &&
      FoodCanon.loadedFoodEid[botEid] === 0
    ) {
      const shotMax = hasComponent(world, foodEid, ShotCount)
        ? ShotCount.max[foodEid]
        : 1;
      FoodCanon.loadedFoodEid[botEid] = foodEid;
      FoodCanon.ammoRemaining[botEid] = shotMax;
      ShotCount.remaining[foodEid] = shotMax;
      hideFoodIntoCanon(world, foodEid);
      queue.push({
        type: 'food_loaded_in_canon',
        canonEntity: botEid,
        foodEntity: foodEid,
      } satisfies FoodLoadedInCanonEvent);
    } else {
      queue.push({
        type: 'consumed',
        entity: botEid,
        foodEntity: foodEid,
        x,
        y,
      } satisfies ConsumedEvent);
      clearFoodRenderComponents(world, foodEid);
      removeEntity(world, foodEid);
    }
  }

  return world;
}
