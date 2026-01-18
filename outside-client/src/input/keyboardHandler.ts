import { WorldState, Direction, isValidPosition } from '@outside/core';
import { SelectionManager } from './selection';
import { CommandQueue } from '../commands/queue';
import { parseCommand } from '../commands/parser';
import { GameRenderer } from '../renderer/renderer';
import { Store } from '../store/store';
import { InputCommandType } from '../network/inputCommands';
import { KeystrokeOverlay } from '../debug/keystrokeOverlay';
import { TimelineManager } from '../timeline/manager';

export type InputCommandSender = (
  command: InputCommandType,
  selectedBotId?: string,
  data?: { x?: number; y?: number }
) => void;

/**
 * Handles keyboard input for bot selection and movement
 */
export class KeyboardHandler {
  private selectionManager: SelectionManager;
  private commandQueue: CommandQueue | null;
  private store: Store;
  private renderer: GameRenderer;
  private keyHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();
  private inputCommandSender: InputCommandSender | null = null;
  private isClientMode: boolean = false;
  private keystrokeOverlay: KeystrokeOverlay;
  private timelineManager: TimelineManager | null;

  constructor(
    selectionManager: SelectionManager,
    commandQueue: CommandQueue | null,
    store: Store,
    renderer: GameRenderer,
    inputCommandSender?: InputCommandSender,
    timelineManager?: TimelineManager | null
  ) {
    this.selectionManager = selectionManager;
    this.commandQueue = commandQueue;
    this.store = store;
    this.renderer = renderer;
    this.inputCommandSender = inputCommandSender || null;
    this.isClientMode = inputCommandSender !== undefined;
    this.timelineManager = timelineManager || null;
    this.keystrokeOverlay = new KeystrokeOverlay();

    this.setupKeyHandlers();
    this.attachEventListeners();
  }

  setTimelineManager(manager: any): void {
    this.timelineManager = manager;
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
      // In client mode, notify host (optional, selection is local)
      if (this.isClientMode && this.inputCommandSender) {
        this.inputCommandSender('SELECT_NEXT_BOT');
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
      // In client mode, notify host (optional, selection is local)
      if (this.isClientMode && this.inputCommandSender) {
        this.inputCommandSender('SELECT_PREV_BOT');
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

    // Space: Pause/Resume
    this.keyHandlers.set(' ', (event) => {
      event.preventDefault();
      if (this.timelineManager) {
        const currentState = this.timelineManager.getPlaybackState();
        if (currentState === 'PLAYING') {
          this.timelineManager.pause();
        } else {
          this.timelineManager.resume();
        }
      }
    });

    // , (comma): Step Backward
    this.keyHandlers.set(',', (event) => {
      // event.preventDefault(); // Don't prevent default, might be needed for input fields? But we don't have inputs yet.
      if (this.timelineManager) {
        this.timelineManager.stepBackward();
      }
    });

    // . (period): Step Forward
    this.keyHandlers.set('.', (event) => {
      if (this.timelineManager) {
        this.timelineManager.stepForward();
      }
    });

    // ?: Toggle keystroke overlay
    this.keyHandlers.set('?', (event) => {
      event.preventDefault();
      this.keystrokeOverlay.toggle();
    });

    // ESC: Hide keystroke overlay (when visible)
    this.keyHandlers.set('Escape', (event) => {
      if (this.keystrokeOverlay['isVisible']) {
        event.preventDefault();
        this.keystrokeOverlay.hide();
      }
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

    // In client mode, send input command to host with selected bot ID
    if (this.isClientMode && this.inputCommandSender) {
      let inputCommand: InputCommandType;
      switch (direction) {
        case 'up':
          inputCommand = 'MOVE_UP';
          break;
        case 'down':
          inputCommand = 'MOVE_DOWN';
          break;
        case 'left':
          inputCommand = 'MOVE_LEFT';
          break;
        case 'right':
          inputCommand = 'MOVE_RIGHT';
          break;
        default:
          throw new Error(`Unexpected direction: ${direction}`);
      }
      // Send the selected bot ID so host knows which bot to move
      this.inputCommandSender(inputCommand, selectedBotId);
      return;
    }

    // In host mode, enqueue game command
    if (this.commandQueue) {
      const command = parseCommand(`move ${selectedBotId} ${direction} 1`);
      this.commandQueue.enqueue(command);
    }
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
