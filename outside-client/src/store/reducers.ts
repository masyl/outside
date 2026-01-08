import { produce } from 'immer';
import { WorldState, Bot, Position, Direction, isValidPosition, isPositionOccupied, placeObjectInGrid, removeObjectFromGrid } from '@outside/core';
import { Action } from './actions';

/**
 * Reducer function that handles state updates using Immer
 */
export function reducer(state: WorldState, action: Action): WorldState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'CREATE_BOT': {
        const { id } = action.payload;
        
        // Check if object already exists
        if (draft.objects.has(id)) {
          console.warn(`Object with id "${id}" already exists`);
          return state;
        }

        // Create new bot
        const bot: Bot = {
          id,
          type: 'bot',
          position: { x: 0, y: 0 }, // Default position, will be placed later
        };

        draft.objects.set(id, bot);
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

        // Remove object from old position
        if (object.position) {
          removeObjectFromGrid(draft.grid, object.position);
        }

        // Place object at new position
        object.position = position;
        placeObjectInGrid(draft.grid, object, position);
        break;
      }

      case 'MOVE_OBJECT': {
        const { id, direction, distance } = action.payload;
        
        const object = draft.objects.get(id);
        if (!object) {
          console.warn(`Object with id "${id}" not found`);
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
        }

        // Validate new position
        if (!isValidPosition(draft, newPosition)) {
          console.warn(`Invalid move position: (${newPosition.x}, ${newPosition.y})`);
          return state;
        }

        // Check if target position is occupied
        if (isPositionOccupied(draft, newPosition)) {
          console.warn(`Position (${newPosition.x}, ${newPosition.y}) is occupied`);
          return state;
        }

        // Remove from old position and place at new position
        removeObjectFromGrid(draft.grid, currentPos);
        object.position = newPosition;
        placeObjectInGrid(draft.grid, object, newPosition);
        break;
      }

      case 'SET_WORLD_STATE': {
        // Replace entire state
        return action.payload.worldState;
      }

      default:
        return state;
    }
  });
}
