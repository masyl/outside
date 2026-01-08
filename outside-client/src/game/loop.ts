import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { executeCommand } from '../commands/handlers';
import { GameRenderer } from '../renderer/renderer';
import { DebugOverlay } from '../debug/overlay';

const STATE_UPDATE_INTERVAL = 500; // 500ms

/**
 * Game loop manager
 */
export class GameLoop {
  private store: Store;
  private commandQueue: CommandQueue;
  private renderer: GameRenderer;
  private debugOverlay?: DebugOverlay;
  private stateUpdateIntervalId: number | null = null;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;

  constructor(store: Store, commandQueue: CommandQueue, renderer: GameRenderer, debugOverlay?: DebugOverlay) {
    this.store = store;
    this.commandQueue = commandQueue;
    this.renderer = renderer;
    this.debugOverlay = debugOverlay;
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
    });

    // Initial render
    this.renderer.setWorld(this.store.getState());

    // Start state update loop (500ms intervals)
    this.startStateUpdateLoop();

    // Start animation loop (runs at 60fps)
    this.startAnimationLoop();
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

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Start the state update loop (processes commands at 500ms intervals)
   */
  private startStateUpdateLoop(): void {
    this.stateUpdateIntervalId = window.setInterval(() => {
      if (!this.isRunning) {
        return;
      }

      // Process one command per step
      const command = this.commandQueue.dequeue();
      if (command) {
        executeCommand(this.store, command);
        // Increment step counter
        if (this.debugOverlay) {
          this.debugOverlay.incrementStep();
        }
        // Grid is redrawn automatically via store subscription
      }
    }, STATE_UPDATE_INTERVAL);
  }

  /**
   * Start the animation loop (runs independently for smooth animations)
   */
  private startAnimationLoop(): void {
    const loop = () => {
      if (!this.isRunning) {
        return;
      }

      // Animation updates happen here if needed
      // For now, motion.dev handles its own animation loop
      
      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  /**
   * Check if the game loop is running
   */
  isGameLoopRunning(): boolean {
    return this.isRunning;
  }
}
