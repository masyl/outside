import { WorldState, Direction, isValidPosition } from '@outside/core';
import { SelectionManager } from './selection';
import { CommandQueue } from '../commands/queue';
import { parseCommand } from '../commands/parser';
import { GameRenderer } from '../renderer/renderer';
import { Store } from '../store/store';

/**
 * Handles keyboard input for bot selection and movement
 */
export class KeyboardHandler {
  private selectionManager: SelectionManager;
  private commandQueue: CommandQueue;
  private store: Store;
  private renderer: GameRenderer;
  private keyHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  constructor(
    selectionManager: SelectionManager,
    commandQueue: CommandQueue,
    store: Store,
    renderer: GameRenderer
  ) {
    this.selectionManager = selectionManager;
    this.commandQueue = commandQueue;
    this.store = store;
    this.renderer = renderer;

    this.setupKeyHandlers();
    this.attachEventListeners();
  }

  /**
   * Setup key handler functions
   */
  private setupKeyHandlers(): void {
    // Tab: Cycle to next bot
    this.keyHandlers.set('Tab', (event) => {
      event.preventDefault();
      const world = this.store.getState();
      const selectedId = this.selectionManager.cycleNext(world);
      if (selectedId) {
        this.renderer.updateSelection(world, selectedId);
      }
    });

    // Shift+Tab: Cycle to previous bot
    this.keyHandlers.set('Shift+Tab', (event) => {
      event.preventDefault();
      const world = this.store.getState();
      const selectedId = this.selectionManager.cyclePrevious(world);
      if (selectedId) {
        this.renderer.updateSelection(world, selectedId);
      }
    });

    // Arrow keys: Move selected bot
    this.keyHandlers.set('ArrowUp', (event) => {
      event.preventDefault();
      this.handleArrowKey('up');
    });

    this.keyHandlers.set('ArrowDown', (event) => {
      event.preventDefault();
      this.handleArrowKey('down');
    });

    this.keyHandlers.set('ArrowLeft', (event) => {
      event.preventDefault();
      this.handleArrowKey('left');
    });

    this.keyHandlers.set('ArrowRight', (event) => {
      event.preventDefault();
      this.handleArrowKey('right');
    });
  }

  /**
   * Handle arrow key press - move selected bot
   */
  private handleArrowKey(direction: Direction): void {
    const selectedBotId = this.selectionManager.getSelectedBotId();
    if (!selectedBotId) {
      return; // No bot selected
    }

    const world = this.store.getState();
    const bot = world.objects.get(selectedBotId);
    if (!bot) {
      return; // Bot doesn't exist
    }

    // Calculate new position
    const currentPos = bot.position;
    let newPosition = { ...currentPos };

    switch (direction) {
      case 'up':
        newPosition.y -= 1;
        break;
      case 'down':
        newPosition.y += 1;
        break;
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
    }

    // Validate boundary before enqueueing command
    if (!isValidPosition(world, newPosition)) {
      console.log(`Cannot move bot ${selectedBotId} ${direction}: out of bounds`);
      return;
    }

    // Check if target position is occupied
    if (world.grid[newPosition.y][newPosition.x] !== null) {
      console.log(`Cannot move bot ${selectedBotId} ${direction}: position occupied`);
      return;
    }

    // Enqueue move command (1 tile movement)
    const command = parseCommand(`move ${selectedBotId} ${direction} 1`);
    this.commandQueue.enqueue(command);
  }

  /**
   * Attach keyboard event listeners
   */
  private attachEventListeners(): void {
    window.addEventListener('keydown', (event) => {
      // Handle Shift+Tab
      if (event.key === 'Tab' && event.shiftKey) {
        const handler = this.keyHandlers.get('Shift+Tab');
        if (handler) {
          handler(event);
        }
        return;
      }

      // Handle other keys
      const handler = this.keyHandlers.get(event.key);
      if (handler) {
        handler(event);
      }
    });
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    // Note: In a real implementation, we'd store the event listener
    // and remove it here. For now, the handler stays active.
    // This could be improved with proper cleanup.
  }
}
