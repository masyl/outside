import { Store } from '../store/store';
import { actions } from '../store/actions';
import { ParsedCommand } from './parser';

/**
 * Execute a parsed command by dispatching appropriate actions
 */
export function executeCommand(store: Store, command: ParsedCommand, step?: number): void {
  switch (command.type) {
    case 'create':
      if (command.objectType === 'bot') {
        store.dispatch(actions.createBot(command.id), step);
      } else if (command.objectType === 'terrain') {
        store.dispatch(
          actions.createTerrain(
            command.id,
            command.terrainType,
            command.x,
            command.y,
            command.width,
            command.height
          ),
          step
        );
      }
      break;

    case 'place':
      store.dispatch(actions.placeObject(command.id, { x: command.x, y: command.y }), step);
      break;

    case 'move':
      store.dispatch(actions.moveObject(command.id, command.direction, command.distance), step);
      break;

    case 'set-world-size':
      store.dispatch(actions.setWorldSize(command.width, command.height), step);
      break;

    case 'set-seed':
      store.dispatch(actions.setSeed(command.seed), step);
      break;

    case 'reset-world':
      store.dispatch(actions.resetWorld(), step);
      break;

    case 'unknown':
      console.warn(`Unknown command: ${command.raw}`);
      break;
  }
}
