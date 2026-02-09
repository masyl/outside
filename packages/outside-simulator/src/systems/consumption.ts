/**
 * Consumption system: when a bot overlaps a food entity, remove the food and emit a consumed event.
 * Runs after movement, before obstacle/collision. Food is walk-through (overlap only).
 * @packageDocumentation
 */

import { query, getComponent, removeComponent, removeEntity } from 'bitecs';
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
} from '../components';
import type { SimulatorWorld } from '../world';
import type { ConsumedEvent } from '../events';

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
 * This guarantees observer deltas contain component removals so render worlds
 * stop drawing consumed food immediately.
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

  return world;
}
