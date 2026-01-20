import { WorldState, Direction, Position, isValidPosition } from '@outside/core';
import { SelectionManager } from './selection';
import { CommandQueue } from '../commands/queue';
import { parseCommand } from '../commands/parser';
import { GameRenderer } from '../renderer/renderer';
import { Store } from '../store/store';
import { InputCommandType } from '../network/inputCommands';
import { KeystrokeOverlay } from '../debug/keystrokeOverlay';
import { TimelineManager } from '../timeline/manager';
import { GameLoop } from '../game/loop';
import { PlaybackState } from '../timeline/types';

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
  private gameLoop: GameLoop | null = null;
  private debugOverlay: any = null;
  private onResetLevel: (() => void) | null = null;
  private onToggleAutonomy: (() => void) | null = null;
  private isAutonomyEnabled: (() => boolean) | null = null;

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

    // Debug: log registered handlers BEFORE attaching listeners
    console.log(
      '[KeyboardHandler] Initialized, handlers registered:',
      Array.from(this.keyHandlers.keys())
    );
    console.log(
      '[KeyboardHandler] isHostMode:',
      this.isHostMode(),
      'hasTimelineManager:',
      !!this.timelineManager
    );

    this.attachEventListeners();
  }

  setTimelineManager(manager: any): void {
    this.timelineManager = manager;
  }

  setGameLoop(gameLoop: GameLoop): void {
    this.gameLoop = gameLoop;
  }

  setDebugOverlay(debugOverlay: any): void {
    this.debugOverlay = debugOverlay;
  }

  setOnResetLevel(callback: () => void): void {
    this.onResetLevel = callback;
  }

  setOnToggleAutonomy(callback: () => void, isEnabledGetter: () => boolean): void {
    this.onToggleAutonomy = callback;
    this.isAutonomyEnabled = isEnabledGetter;
  }

  private updateTimelineCursor(): void {
    if (this.debugOverlay && this.timelineManager) {
      const state = this.timelineManager.getState();
      this.debugOverlay.setTimelineCursor(state.currentStep, state.totalSteps);
    }
  }

  private isHostMode(): boolean {
    return !this.isClientMode;
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

    // Arrow keys: Move selected bot (or timeline controls with Option/Alt modifier)
    // Up = earlier in time (step backward), Down = later in time (step forward)
    this.keyHandlers.set('ArrowUp', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Step backward (Up = earlier in time)');
        this.timelineManager.stepBackward();
        this.updateTimelineCursor();
        return;
      }
      event.preventDefault();
      this.handleArrowKey('up');
    });

    this.keyHandlers.set('ArrowDown', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Step forward (Down = later in time)');
        this.timelineManager.stepForward();
        this.updateTimelineCursor();
        return;
      }
      event.preventDefault();
      this.handleArrowKey('down');
    });

    this.keyHandlers.set('ArrowLeft', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Scrub backward (50 steps)');
        this.scrubTimeline('backward');
        this.updateTimelineCursor();
        return;
      }
      event.preventDefault();
      this.handleArrowKey('left');
    });

    this.keyHandlers.set('ArrowRight', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Scrub forward (50 steps)');
        this.scrubTimeline('forward');
        this.updateTimelineCursor();
        return;
      }
      event.preventDefault();
      this.handleArrowKey('right');
    });

    // Space: Pause/Resume (with Option/Alt modifier for timeline control)
    this.keyHandlers.set(' ', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        const currentState = this.timelineManager.getPlaybackState();
        console.log(`[Timeline] Toggle play/pause (current: ${currentState})`);
        this.togglePausePlayback();
        if (this.debugOverlay) {
          this.debugOverlay.setPlaybackMode(this.timelineManager.getPlaybackState());
        }
        return;
      }
      // Existing behavior without modifier (backwards compatibility)
      event.preventDefault();
      if (this.timelineManager) {
        const currentState = this.timelineManager.getPlaybackState();
        if (currentState === PlaybackState.PLAYING) {
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

    // Option/Alt + Home: Jump to LevelStart (after initialization, using time travel)
    this.keyHandlers.set('Home', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Jump to LevelStart');
        this.timelineManager.goToLevelStart();
        this.updateTimelineCursor();
      }
    });

    // Option/Alt + End: Jump to end of timeline
    this.keyHandlers.set('End', (event) => {
      if (event.altKey && this.isHostMode() && this.timelineManager) {
        event.preventDefault();
        console.log('[Timeline] Jump to end');
        this.timelineManager.goToEnd();
        this.updateTimelineCursor();
      }
    });

    // Option/Alt + R: Full reset (clear events, reset step count, reinitialize level)
    // Handled via event.code in attachEventListeners for Mac compatibility
    // These handlers are kept for non-Mac systems where Alt+R might still produce 'r'/'R'
    this.keyHandlers.set('r', (event) => {
      if (event.altKey && this.isHostMode() && this.onResetLevel) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[Debug] Reset level (Alt+R) - full reset (clear events, reinitialize)');
        this.onResetLevel();
      }
    });
    this.keyHandlers.set('R', (event) => {
      if (event.altKey && this.isHostMode() && this.onResetLevel) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[Debug] Reset level (Alt+R) - full reset (clear events, reinitialize)');
        this.onResetLevel();
      }
    });

    // Note: Alt+F is handled in attachEventListeners via event.code='KeyF'
    // because on Mac, Alt+F produces a special character, not 'f'
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

    // Bot must have a position to be moved
    if (!bot.position) {
      console.log(`Cannot move bot ${selectedBotId}: bot has no position`);
      return;
    }

    // Calculate new position
    const currentPos = bot.position;
    let newPosition: Position = { ...currentPos };

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
    console.log('[KeyboardHandler] Attaching event listeners...');
    const eventHandler = (event: KeyboardEvent) => {
      // Debug: log ALL Alt+R, Mod+F, and any Alt/Mod keydown events
      // Use event.code for physical key (works on Mac where Alt+R produces '®' character)
      if (event.altKey && event.code === 'KeyR') {
        console.log('[KeyboardHandler] *** Alt+R DETECTED ***', {
          key: event.key,
          code: event.code,
          altKey: event.altKey,
          isHostMode: this.isHostMode(),
          handlerExists: this.keyHandlers.has(event.key) || this.keyHandlers.has(event.code),
          callbackExists: !!this.onResetLevel,
          allHandlers: Array.from(this.keyHandlers.keys()),
        });
      }
      if (event.altKey && event.code === 'KeyF') {
        console.log('[KeyboardHandler] *** Alt+F DETECTED ***', {
          key: event.key,
          code: event.code,
          altKey: event.altKey,
          isHostMode: this.isHostMode(),
          callbackExists: !!this.onToggleAutonomy,
        });
      }
      // Debug: log ANY Alt+key or Mod+key combinations for troubleshooting (but skip Alt key by itself)
      if (
        (event.altKey || event.metaKey || event.ctrlKey) &&
        event.code !== 'AltLeft' &&
        event.code !== 'AltRight'
      ) {
        console.log('[KeyboardHandler] Modifier key detected:', {
          key: event.key,
          code: event.code,
          altKey: event.altKey,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
        });
      }
      // Handle Shift+Tab first
      if (event.key === 'Tab' && event.shiftKey) {
        const handler = this.keyHandlers.get('Shift+Tab');
        if (handler) {
          handler(event);
        }
        return;
      }

      // Handle Space key specially (can be ' ', 'Spacebar', or event.code === 'Space')
      if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
        const handler = this.keyHandlers.get(' ');
        if (handler) {
          console.log(
            '[KeyboardHandler] Space key matched, altKey:',
            event.altKey,
            'isHostMode:',
            this.isHostMode(),
            'hasTimelineManager:',
            !!this.timelineManager
          );
          handler(event);
          return;
        } else {
          console.log('[KeyboardHandler] Space key detected but handler not found!');
        }
        return;
      }

      // Handle Alt+R using event.code (Mac produces '®' character, not 'r')
      // Alt+R = Full reset (clear events, reset step count, reinitialize level)
      if (event.altKey && event.code === 'KeyR') {
        event.preventDefault();
        event.stopPropagation();
        if (this.isHostMode() && this.onResetLevel) {
          console.log('[Debug] Reset level (Alt+R) - full reset (clear events, reinitialize)');
          this.onResetLevel();
        }
        return;
      }

      // Handle Alt+F using event.code (Mac produces special character, not 'f')
      if (event.altKey && event.code === 'KeyF') {
        event.preventDefault();
        event.stopPropagation();
        if (this.isHostMode() && this.onToggleAutonomy) {
          const wasEnabled = this.isAutonomyEnabled ? this.isAutonomyEnabled() : false;
          console.log(
            `[Debug] Toggle Freeze/Unfreeze (Alt+F) - current: ${wasEnabled ? 'Unfrozen' : 'Frozen'}`
          );
          this.onToggleAutonomy();
        }
        return;
      }

      // Handle Alt+Home using event.code (for Mac compatibility)
      // Alt+Home = Time travel to LevelStart (after initialization)
      if (event.altKey && event.code === 'Home') {
        event.preventDefault();
        event.stopPropagation();
        if (this.isHostMode() && this.timelineManager) {
          console.log('[Timeline] Jump to LevelStart (Alt+Home)');
          this.timelineManager.goToLevelStart();
          this.updateTimelineCursor();
        }
        return;
      }

      // Handle Alt+End using event.code (for Mac compatibility)
      if (event.altKey && event.code === 'End') {
        event.preventDefault();
        event.stopPropagation();
        if (this.isHostMode() && this.timelineManager) {
          console.log('[Timeline] Jump to end (Alt+End)');
          this.timelineManager.goToEnd();
          this.updateTimelineCursor();
        }
        return;
      }

      // Handle Alt+D using event.code (for Mac compatibility)
      // Alt+D = Toggle debug panel visibility
      if (event.altKey && event.code === 'KeyD') {
        event.preventDefault();
        event.stopPropagation();
        if (this.debugOverlay && typeof this.debugOverlay.toggle === 'function') {
          console.log('[Debug] Toggle debug panel (Alt+D)');
          this.debugOverlay.toggle();
        }
        return;
      }

      // Handle Alt+Esc using event.code
      // Alt+Esc = Toggle debug panel visibility (Alternative shortcut)
      if (event.altKey && event.code === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (this.debugOverlay && typeof this.debugOverlay.toggle === 'function') {
          console.log('[Debug] Toggle debug panel (Alt+Esc)');
          this.debugOverlay.toggle();
        }
        return;
      }

      // Handle Shift+G
      // Shift+G = Toggle sub-grid visibility
      if (event.key === 'G' && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        console.log('[Debug] Toggle sub-grid (Shift+G)');
        // Access toggleSubGrid via renderer if available
        if (this.renderer && typeof (this.renderer as any).toggleSubGrid === 'function') {
          (this.renderer as any).toggleSubGrid();
        }
        return;
      }

      // Handle other keys using event.key
      const handler = this.keyHandlers.get(event.key);
      if (handler) {
        handler(event);
      } else {
        // Debug: log if Alt+R or Alt+F wasn't handled
        if (event.altKey && event.code === 'KeyR') {
          console.warn(
            '[KeyboardHandler] Alt+R handler NOT found! Event.key:',
            event.key,
            'Event.code:',
            event.code,
            'Available keys:',
            Array.from(this.keyHandlers.keys())
          );
        }
        if (event.altKey && event.code === 'KeyF') {
          console.warn(
            '[KeyboardHandler] Alt+F handler NOT found! Event.key:',
            event.key,
            'Event.code:',
            event.code,
            'Available keys:',
            Array.from(this.keyHandlers.keys())
          );
        }
      }
    };

    window.addEventListener('keydown', eventHandler, { capture: true });
    console.log(
      '[KeyboardHandler] Event listener attached successfully. Registered handlers:',
      Array.from(this.keyHandlers.keys()).sort()
    );
  }

  /**
   * Toggle play/pause playback state
   */
  private togglePausePlayback(): void {
    if (!this.timelineManager) return;

    const currentState = this.timelineManager.getPlaybackState();
    if (currentState === PlaybackState.PLAYING) {
      this.timelineManager.pause();
      if (this.gameLoop) {
        this.gameLoop.pause();
      }
    } else {
      this.timelineManager.resume();
      if (this.gameLoop) {
        this.gameLoop.resume();
      }
    }
  }

  /**
   * Scrub timeline forward or backward by 50 steps
   */
  private scrubTimeline(direction: 'forward' | 'backward'): void {
    if (!this.timelineManager) return;

    const eventLogger = this.store.getEventLogger();
    const events = eventLogger.loadEvents();
    const currentStep = this.timelineManager.getCurrentStep();

    // Game runs at 8 steps per second (125ms interval), so 1 second = 8 steps
    const STEPS_PER_SECOND = 8;
    const scrubAmount = STEPS_PER_SECOND; // Jump 1 second worth of steps

    let targetStep: number;
    if (direction === 'forward') {
      targetStep = Math.min(currentStep + scrubAmount, events.length - 1);
    } else {
      targetStep = Math.max(currentStep - scrubAmount, 0);
    }

    console.log(
      `[Timeline] Scrubbing ${direction} (1 second = ${STEPS_PER_SECOND} steps): ${currentStep} -> ${targetStep} (total: ${events.length})`
    );
    this.timelineManager.goToStep(targetStep);
    this.updateTimelineCursor();
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
