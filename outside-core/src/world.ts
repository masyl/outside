import { WorldState, Grid, GameObject, Position } from './types';

/**
 * Creates an empty world state with a 20x10 grid
 */
export function createWorldState(): WorldState {
  const width = 20;
  const height = 10;
  
  const grid: Grid = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
  
  return {
    grid,
    objects: new Map<string, GameObject>(),
    width,
    height,
  };
}

/**
 * Checks if a position is valid within the world bounds
 */
export function isValidPosition(world: WorldState, position: Position): boolean {
  return (
    position.x >= 0 &&
    position.x < world.width &&
    position.y >= 0 &&
    position.y < world.height
  );
}

/**
 * Checks if a position is occupied
 */
export function isPositionOccupied(world: WorldState, position: Position): boolean {
  if (!isValidPosition(world, position)) {
    return false;
  }
  return world.grid[position.y][position.x] !== null;
}

/**
 * Gets the object at a specific position
 */
export function getObjectAtPosition(
  world: WorldState,
  position: Position
): GameObject | null {
  if (!isValidPosition(world, position)) {
    return null;
  }
  return world.grid[position.y][position.x];
}

/**
 * Places an object at a position in the grid
 */
export function placeObjectInGrid(
  grid: Grid,
  object: GameObject,
  position: Position
): void {
  if (position.y >= 0 && position.y < grid.length) {
    if (position.x >= 0 && position.x < grid[position.y].length) {
      grid[position.y][position.x] = object;
    }
  }
}

/**
 * Removes an object from a position in the grid
 */
export function removeObjectFromGrid(grid: Grid, position: Position): void {
  if (position.y >= 0 && position.y < grid.length) {
    if (position.x >= 0 && position.x < grid[position.y].length) {
      grid[position.y][position.x] = null;
    }
  }
}
