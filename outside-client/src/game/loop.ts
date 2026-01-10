import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { executeCommand } from '../commands/handlers';
import { GameRenderer } from '../renderer/renderer';
import { DebugOverlay } from '../debug/overlay';

const STATE_UPDATE_INTERVAL = 125; // 125ms

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

    // Note: Initial render is now handled in main.ts after terrain is loaded
    // This ensures terrain is visible before the game loop starts

    // Start state update loop (125ms intervals)
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
   * Start the state update loop (processes commands at 125ms intervals)
   */
  private startStateUpdateLoop(): void {
    this.stateUpdateIntervalId = window.setInterval(() => {
      if (!this.isRunning) {
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
