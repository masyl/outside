import { Store } from '../store/store';
import { actions } from '../store/actions';
import { ParsedCommand } from './parser';

/**
 * Execute a parsed command by dispatching appropriate actions
 */
export function executeCommand(store: Store, command: ParsedCommand): void {
  switch (command.type) {
    case 'create':
      if (command.objectType === 'bot') {
        store.dispatch(actions.createBot(command.id));
      }
      break;

    case 'place':
      store.dispatch(actions.placeObject(command.id, { x: command.x, y: command.y }));
      break;

    case 'move':
      store.dispatch(actions.moveObject(command.id, command.direction, command.distance));
      break;

    case 'unknown':
      console.warn(`Unknown command: ${command.raw}`);
      break;
  }
}
