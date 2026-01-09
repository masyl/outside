import { WorldState, Grid, GameObject, Position, GroundLayer, TerrainObject, TerrainType } from './types';

/**
 * Creates an empty ground layer
 */
export function createGroundLayer(): GroundLayer {
  return {
    terrainObjects: new Map<string, TerrainObject>(),
    terrainObjectsByPosition: new Map<string, TerrainObject[]>(),
  };
}

/**
 * Creates an empty world state with a 20x10 grid
 */
export function createWorldState(seed?: number): WorldState {
  const width = 20;
  const height = 10;
  
  const grid: Grid = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
  
  return {
    grid,
    objects: new Map<string, GameObject>(),
    groundLayer: createGroundLayer(),
    width,
    height,
    seed: seed ?? Math.floor(Math.random() * 2147483647), // Generate random seed if not provided
  };
}

/**
 * Get position key for indexing terrain by position
 */
function getPositionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

/**
 * Check if a terrain object covers a given position
 */
export function doesTerrainCoverPosition(
  terrain: TerrainObject,
  position: Position
): boolean {
  return (
    position.x >= terrain.position.x &&
    position.x < terrain.position.x + terrain.width &&
    position.y >= terrain.position.y &&
    position.y < terrain.position.y + terrain.height
  );
}

/**
 * Get all terrain objects that cover a position
 */
export function getTerrainObjectsAtPosition(
  groundLayer: GroundLayer,
  position: Position
): TerrainObject[] {
  const positionKey = getPositionKey(position);
  return groundLayer.terrainObjectsByPosition.get(positionKey) || [];
}

/**
 * Get the top-most (most recently created) terrain object at a position
 */
export function getTopMostTerrainAtPosition(
  groundLayer: GroundLayer,
  position: Position
): TerrainObject | null {
  const terrainObjects = getTerrainObjectsAtPosition(groundLayer, position);
  if (terrainObjects.length === 0) {
    return null;
  }
  
  // Sort by createdAt descending (most recent first)
  const sorted = [...terrainObjects].sort((a, b) => b.createdAt - a.createdAt);
  return sorted[0];
}

/**
 * Check if a terrain type is walkable
 */
export function isTerrainTypeWalkable(terrainType: TerrainType): boolean {
  return terrainType === 'grass' || terrainType === 'dirt' || terrainType === 'sand';
}

/**
 * Check if a position is walkable (has terrain AND top-most terrain is walkable)
 */
export function isWalkable(
  world: WorldState,
  position: Position
): boolean {
  if (!isValidPosition(world, position)) {
    return false;
  }
  
  const topMostTerrain = getTopMostTerrainAtPosition(world.groundLayer, position);
  if (!topMostTerrain) {
    // No terrain = not walkable
    return false;
  }
  
  return isTerrainTypeWalkable(topMostTerrain.type);
}

/**
 * Add a terrain object to the ground layer and update position index
 */
export function addTerrainObject(
  groundLayer: GroundLayer,
  terrain: TerrainObject
): void {
  // Add to terrain objects map
  groundLayer.terrainObjects.set(terrain.id, terrain);
  
  // Update position index - add this terrain to all positions it covers
  for (let y = terrain.position.y; y < terrain.position.y + terrain.height; y++) {
    for (let x = terrain.position.x; x < terrain.position.x + terrain.width; x++) {
      const positionKey = `${x},${y}`;
      const existing = groundLayer.terrainObjectsByPosition.get(positionKey) || [];
      existing.push(terrain);
      groundLayer.terrainObjectsByPosition.set(positionKey, existing);
    }
  }
}

/**
 * Remove a terrain object from the ground layer and update position index
 */
export function removeTerrainObject(
  groundLayer: GroundLayer,
  terrainId: string
): void {
  const terrain = groundLayer.terrainObjects.get(terrainId);
  if (!terrain) {
    return;
  }
  
  // Remove from terrain objects map
  groundLayer.terrainObjects.delete(terrainId);
  
  // Update position index - remove this terrain from all positions it covered
  for (let y = terrain.position.y; y < terrain.position.y + terrain.height; y++) {
    for (let x = terrain.position.x; x < terrain.position.x + terrain.width; x++) {
      const positionKey = `${x},${y}`;
      const existing = groundLayer.terrainObjectsByPosition.get(positionKey);
      if (existing) {
        const filtered = existing.filter(t => t.id !== terrainId);
        if (filtered.length === 0) {
          groundLayer.terrainObjectsByPosition.delete(positionKey);
        } else {
          groundLayer.terrainObjectsByPosition.set(positionKey, filtered);
        }
      }
    }
  }
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
