import { produce } from 'immer';
import {
  WorldState,
  Bot,
  Position,
  Direction,
  TerrainObject,
  isValidPosition,
  isPositionOccupied,
  getObjectAtPosition,
  toTilePosition,
  placeObjectInGrid,
  removeObjectFromGrid,
  addTerrainObject,
  isWalkable,
  getTopMostTerrainAtPosition,
  createWorldState,
} from '@outside/core';
import { Action } from './actions';
import { stepBotMotion } from './botMotion';
import { directionFromVelocity } from '../utils/direction';

/**
 * Reducer function that handles state updates using Immer
 */
export function reducer(state: WorldState, action: Action): WorldState {
  // Special case for SET_WORLD_STATE - bypass immer
  if (action.type === 'SET_WORLD_STATE') {
    return action.payload.worldState || state;
  }

  return produce(state, (draft) => {
    switch (action.type) {
      case 'CREATE_BOT': {
        const { id } = action.payload;

        // Check if object already exists
        if (draft.objects.has(id)) {
          console.warn(`Object with id "${id}" already exists`);
          return state;
        }

        // Create new bot without a position - will be positioned later via PLACE_OBJECT
        const bot: Bot = {
          id,
          type: 'bot',
          // No position - bot is invisible until placed
        };

        draft.objects.set(id, bot);
        break;
      }

      case 'SIM_TICK': {
        const { dtMs } = action.payload;
        const dtSec = dtMs / 1000;
        if (!(dtSec > 0)) {
          return state;
        }

        const clampPos = (p: Position): Position => {
          // Keep positions inside the world so flooring doesn't exceed bounds.
          const maxX = draft.horizontalLimit + 0.999999;
          const maxY = draft.verticalLimit + 0.999999;
          return {
            x: Math.max(-draft.horizontalLimit, Math.min(maxX, p.x)),
            y: Math.max(-draft.verticalLimit, Math.min(maxY, p.y)),
          };
        };

        const isBlocked = (botId: string, pos: Position): boolean => {
          if (!isWalkable(draft, pos)) return true;
          const occ = getObjectAtPosition(draft, pos);
          if (occ && occ.id !== botId) return true;
          return false;
        };

        // Deterministic tick: update time after stepping.
        const timeMs = draft.timeMs;

        for (const object of draft.objects.values()) {
          if (object.type !== 'bot') continue;
          if (!object.position) continue;

          const prevPos = object.position;
          const key = { seed: draft.seed, botId: object.id };
          const update = stepBotMotion({
            key,
            timeMs,
            dtMs,
            previousMotion: object.motion,
            previousFacing: object.facing,
          });

          let velocity = { ...update.velocity };
          let nextPos: Position = {
            x: prevPos.x + velocity.x * dtSec,
            y: prevPos.y + velocity.y * dtSec,
          };
          nextPos = clampPos(nextPos);

          // Tile-based collision / bounce (axis-separated).
          let resolvedPos: Position = { ...prevPos };
          let collidedX = false;
          let collidedY = false;

          const tryX: Position = { x: nextPos.x, y: resolvedPos.y };
          if (!isBlocked(object.id, tryX)) {
            resolvedPos.x = tryX.x;
          } else {
            velocity.x = -velocity.x;
            collidedX = true;
          }

          const tryY: Position = { x: resolvedPos.x, y: nextPos.y };
          if (!isBlocked(object.id, tryY)) {
            resolvedPos.y = tryY.y;
          } else {
            velocity.y = -velocity.y;
            collidedY = true;
          }

          // If we collided, keep position clamped and re-sync motion heading to new velocity.
          resolvedPos = clampPos(resolvedPos);

          object.position = resolvedPos;
          object.velocity = velocity;
          object.motion =
            collidedX || collidedY
              ? {
                  ...update.motion,
                  headingRad: Math.atan2(velocity.y, velocity.x),
                  angularVelocityRadPerSec: -update.motion.angularVelocityRadPerSec * 0.5,
                }
              : update.motion;
          object.facing = directionFromVelocity(velocity, object.facing ?? update.facing);

          // Update grid occupancy only if tile changed.
          const fromTile = toTilePosition(prevPos);
          const toTile = toTilePosition(resolvedPos);
          if (fromTile.x !== toTile.x || fromTile.y !== toTile.y) {
            removeObjectFromGrid(draft.grid, prevPos, draft.horizontalLimit);
            placeObjectInGrid(draft.grid, object, resolvedPos, draft.horizontalLimit);
          }
        }

        draft.timeMs += dtMs;
        break;
      }

      case 'CREATE_TERRAIN': {
        const { id, terrainType, x, y, width, height } = action.payload;

        // Check if terrain already exists
        if (draft.groundLayer.terrainObjects.has(id)) {
          console.warn(`Terrain with id "${id}" already exists`);
          return state;
        }

        // Validate terrain bounds
        // Terrain must be fully within the grid: x + width <= limit, y + height <= limit
        if (
          x < -draft.horizontalLimit ||
          x + width > draft.horizontalLimit + 1 ||
          y < -draft.verticalLimit ||
          y + height > draft.verticalLimit + 1
        ) {
          console.warn(
            `Terrain extends outside world bounds: (${x}, ${y}) ${width}x${height}, world limits: ±${draft.horizontalLimit}, ±${draft.verticalLimit}`
          );
          return state;
        }

        // Additional validation: ensure width and height are positive
        if (width <= 0 || height <= 0) {
          console.warn(`Terrain has invalid dimensions: ${width}x${height}`);
          return state;
        }

        // Create new terrain object with current timestamp
        const terrain: TerrainObject = {
          id,
          type: terrainType,
          position: { x, y },
          width,
          height,
          createdAt: Date.now(),
        };

        // console.log(`[CREATE_TERRAIN] Creating terrain: ${id} (${terrainType}) at (${x}, ${y}) size ${width}x${height}`);

        // Add to ground layer
        addTerrainObject(draft.groundLayer, terrain);

        // console.log(`[CREATE_TERRAIN] Terrain added. Total terrain objects: ${draft.groundLayer.terrainObjects.size}`);
        break;
      }

      case 'PLACE_OBJECT': {
        const { id, position } = action.payload;

        const object = draft.objects.get(id);
        if (!object) {
          console.warn(`Object with id "${id}" not found`);
          return state;
        }

        if (!isValidPosition(draft, position)) {
          console.warn(`Invalid position: (${position.x}, ${position.y})`);
          return state;
        }

        // Check walkability - bots can only be placed on walkable terrain
        // console.log(`[PLACE_OBJECT] Trying to place ${id} at (${position.x}, ${position.y})`);
        if (!isWalkable(draft, position)) {
          const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, position);
          if (topMostTerrain) {
            console.warn(
              `[PLACE_OBJECT] Position (${position.x}, ${position.y}) is not walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`
            );
          } else {
            console.warn(
              `[PLACE_OBJECT] Position (${position.x}, ${position.y}) is not walkable - NO TERRAIN at this position`
            );
          }
          return state;
        }

        const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, position);
        if (topMostTerrain) {
          // console.log(`[PLACE_OBJECT] Position (${position.x}, ${position.y}) is walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
        } else {
          // console.log(`[PLACE_OBJECT] Position (${position.x}, ${position.y}) is walkable - NO TERRAIN (should not happen)`);
        }

        // Check if target position is occupied by another object
        if (isPositionOccupied(draft, position)) {
          console.warn(`Position (${position.x}, ${position.y}) is occupied`);
          return state;
        }

        // Remove object from old position (if it had one)
        if (object.position) {
          removeObjectFromGrid(draft.grid, object.position, draft.horizontalLimit);
        }

        // Place object at new position
        object.position = position;
        placeObjectInGrid(draft.grid, object, position, draft.horizontalLimit);
        break;
      }

      case 'MOVE_OBJECT': {
        const { id, direction, distance } = action.payload;

        const object = draft.objects.get(id);
        if (!object) {
          console.warn(`Object with id "${id}" not found`);
          return state;
        }

        // Can't move an object that doesn't have a position yet
        if (!object.position) {
          console.warn(`Object with id "${id}" has no position and cannot be moved`);
          return state;
        }

        const currentPos = object.position;
        let newPosition: Position = { ...currentPos };

        // Calculate new position based on direction
        switch (direction) {
          case 'left':
            newPosition.x -= distance;
            break;
          case 'right':
            newPosition.x += distance;
            break;
          case 'up':
            newPosition.y -= distance;
            break;
          case 'down':
            newPosition.y += distance;
            break;
          case 'up-left':
            newPosition.x -= distance;
            newPosition.y -= distance;
            break;
          case 'up-right':
            newPosition.x += distance;
            newPosition.y -= distance;
            break;
          case 'down-left':
            newPosition.x -= distance;
            newPosition.y += distance;
            break;
          case 'down-right':
            newPosition.x += distance;
            newPosition.y += distance;
            break;
        }

        // Validate new position
        if (!isValidPosition(draft, newPosition)) {
          // console.warn(`[MOVE_OBJECT] Invalid move position: (${newPosition.x}, ${newPosition.y})`);
          return state;
        }

        // Check walkability - bots can only move to walkable positions
        // console.log(`[MOVE_OBJECT] Bot ${id} trying to move from (${currentPos.x}, ${currentPos.y}) to (${newPosition.x}, ${newPosition.y})`);

        // Debug: Check what terrain is at the target position
        const topMostTerrain = getTopMostTerrainAtPosition(draft.groundLayer, newPosition);
        if (topMostTerrain) {
          // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) has terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
        } else {
          // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) has NO TERRAIN`);
        }

        // Check all terrain objects at this position (for debugging)
        const allTerrainAtPosition = draft.groundLayer.terrainObjectsByPosition.get(
          `${newPosition.x},${newPosition.y}`
        );
        if (allTerrainAtPosition && allTerrainAtPosition.length > 0) {
          // console.log(`[MOVE_OBJECT] All terrain at (${newPosition.x}, ${newPosition.y}):`, allTerrainAtPosition.map(t => `${t.type}(${t.id})`).join(', '));
        }

        if (!isWalkable(draft, newPosition)) {
          if (topMostTerrain) {
            // console.warn(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is not walkable - terrain: ${topMostTerrain.type} (${topMostTerrain.id})`);
          } else {
            // console.warn(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is not walkable - NO TERRAIN at this position`);
          }
          return state;
        }

        // console.log(`[MOVE_OBJECT] Position (${newPosition.x}, ${newPosition.y}) is walkable, allowing movement`);

        // Check if target position is occupied by another object
        if (isPositionOccupied(draft, newPosition)) {
          console.warn(`Position (${newPosition.x}, ${newPosition.y}) is occupied`);
          return state;
        }

        // Remove from old position and place at new position
        removeObjectFromGrid(draft.grid, currentPos, draft.horizontalLimit);
        object.position = newPosition;
        placeObjectInGrid(draft.grid, object, newPosition, draft.horizontalLimit);
        break;
      }

      case 'SET_WORLD_SIZE': {
        const { horizontalLimit, verticalLimit } = action.payload;

        // Create new grid with specified limits (limit * 2 + 1 for center-based coordinates)
        const gridSizeX = horizontalLimit * 2 + 1;
        const gridSizeY = verticalLimit * 2 + 1;
        const newGrid = Array(gridSizeY)
          .fill(null)
          .map(() => Array(gridSizeX).fill(null));

        // Update dimensions and grid
        draft.horizontalLimit = horizontalLimit;
        draft.verticalLimit = verticalLimit;
        draft.grid = newGrid;

        // Clear any objects that are now outside bounds (only if they have a position)
        for (const [id, object] of draft.objects) {
          if (object.position && !isValidPosition(draft, object.position)) {
            draft.objects.delete(id);
          }
        }

        break;
      }

      case 'SET_SEED': {
        const { seed } = action.payload;
        draft.seed = seed;
        break;
      }

      case 'RESET_WORLD': {
        const newState = createWorldState(draft.seed, draft.horizontalLimit);
        // Preserve dimensions if they've been customized
        newState.horizontalLimit = draft.horizontalLimit;
        newState.verticalLimit = draft.verticalLimit;
        const gridSize = draft.horizontalLimit * 2 + 1;
        newState.grid = Array(gridSize)
          .fill(null)
          .map(() => Array(gridSize).fill(null));

        // Replace entire state
        return newState;
      }

      default:
        return state;
    }
  });
}
