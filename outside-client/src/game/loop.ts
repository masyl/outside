import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { executeCommand } from '../commands/handlers';
import { GameRenderer } from '../renderer/renderer';
import { DebugBridge } from '../debug/debugBridge';
import { PlaybackState } from '../timeline/types';
import { TimelineManager } from '../timeline/manager';

const STATE_UPDATE_INTERVAL = 125; // 125ms

/**
 * Game loop manager
 */
export class GameLoop {
  private store: Store;
  private commandQueue: CommandQueue;
  private renderer: GameRenderer;
  private debugOverlay?: typeof DebugBridge; // Updated type to allow static class
  private stateUpdateIntervalId: number | null = null;

  private isRunning: boolean = false;
  private playbackState: PlaybackState = PlaybackState.PLAYING;
  private timelineManager: TimelineManager | null = null;

  constructor(
    store: Store,
    commandQueue: CommandQueue,
    renderer: GameRenderer,
    debugOverlay?: any // Use any to accept static class or instance with matching interface
  ) {
    this.store = store;
    this.commandQueue = commandQueue;
    this.renderer = renderer;
    this.debugOverlay = debugOverlay;
  }

  setTimelineManager(manager: TimelineManager): void {
    this.timelineManager = manager;
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  setPlaybackState(state: PlaybackState): void {
    const previousState = this.playbackState;
    this.playbackState = state;

    // If entering TRAVELING mode, clear the command queue
    // This prevents commands intended for the "live" head from executing on historical states
    if (state === PlaybackState.TRAVELING && previousState !== PlaybackState.TRAVELING) {
      this.commandQueue.clear();
    }

    // When pausing or traveling, ensure UI updates with current timeline position
    if (this.timelineManager && state !== PlaybackState.PLAYING) {
      this.timelineManager.notifyPositionChange();
    }
  }

  /**
   * Pause the game execution
   */
  pause(): void {
    this.setPlaybackState(PlaybackState.PAUSED);
  }

  /**
   * Resume normal game execution
   */
  resume(): void {
    this.setPlaybackState(PlaybackState.PLAYING);
  }

  /**
   * Execute a single step forward (only when paused/traveling)
   */
  step(): void {
    if (this.timelineManager) {
      this.timelineManager.stepForward();
      // Force an update to process any immediate effects if needed,
      // though typically TimelineManager handles state updates directly.
    }
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Subscribe to state changes for rendering
    this.store.subscribe((state) => {
      this.renderer.update(state);
      if (this.timelineManager && this.playbackState !== PlaybackState.PLAYING) {
        this.timelineManager.notifyPositionChange();
      }
    });

    // Note: Initial render is now handled in main.ts after terrain is loaded
    // This ensures terrain is visible before the game loop starts

    // Start state update loop (125ms intervals)
    this.startStateUpdateLoop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;

    if (this.stateUpdateIntervalId !== null) {
      clearInterval(this.stateUpdateIntervalId);
      this.stateUpdateIntervalId = null;
    }
  }

  /**
   * Start the state update loop (processes commands at 125ms intervals)
   */
  private startStateUpdateLoop(): void {
    this.stateUpdateIntervalId = window.setInterval(() => {
      if (!this.isRunning) {
        return;
      }

      // Only process commands in PLAYING state
      if (this.playbackState !== PlaybackState.PLAYING) {
        return;
      }

      // Process multiple commands per step to drain the queue
      // This allows multiple bots to move in the same visual "step"
      const currentStep = this.debugOverlay?.getStepCount();

      // Process up to 10 commands per tick to prevent infinite loops but drain queue
      const MAX_COMMANDS_PER_TICK = 10;
      let processed = 0;

      while (this.commandQueue.length() > 0 && processed < MAX_COMMANDS_PER_TICK) {
        const command = this.commandQueue.dequeue();
        if (command) {
          // #region agent log
          // fetch('http://127.0.0.1:7243/ingest/c24317a8-1790-427d-a3bc-82c53839c989',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'loop.ts:startStateUpdateLoop',message:'Executing command',data:{command, step: currentStep, processedCount: processed},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          executeCommand(this.store, command, currentStep);
          processed++;
        }
      }
    }, STATE_UPDATE_INTERVAL);
  }

  /**
   * Check if the game loop is running
   */
  isGameLoopRunning(): boolean {
    return this.isRunning;
  }
}
