/**
 * Debug overlay for displaying FPS, step counter, and other debug info
 */

export const VERSION = '0.1.8'; // Update patch number when making changes

export class DebugOverlay {
  private container: HTMLDivElement;
  private fpsElement: HTMLDivElement;
  private stepElement: HTMLDivElement;
  private versionElement: HTMLDivElement;
  private modeElement: HTMLDivElement;
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private stepCount: number = 0;
  private mode: 'host' | 'client' | 'unknown' = 'unknown';

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border: 1px solid #00ff00;
      z-index: 10000;
      pointer-events: none;
      user-select: none;
    `;

    // Create version element
    this.versionElement = document.createElement('div');
    this.versionElement.textContent = `Version: ${VERSION}`;
    this.container.appendChild(this.versionElement);

    // Create mode element
    this.modeElement = document.createElement('div');
    this.modeElement.textContent = 'Mode: unknown';
    this.container.appendChild(this.modeElement);

    // Create FPS element
    this.fpsElement = document.createElement('div');
    this.fpsElement.textContent = 'FPS: --';
    this.container.appendChild(this.fpsElement);

    // Create step element
    this.stepElement = document.createElement('div');
    this.stepElement.textContent = 'Step: 0';
    this.container.appendChild(this.stepElement);

    // Append to body
    document.body.appendChild(this.container);

    // Log version to console
    console.log(`Outside Game Client - Version ${VERSION}`);

    // Start FPS counter
    this.startFpsCounter();
  }

  private startFpsCounter(): void {
    const updateFps = (timestamp: number) => {
      this.frameCount++;
      
      if (timestamp - this.lastFpsUpdate >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFpsUpdate = timestamp;
        this.fpsElement.textContent = `FPS: ${this.fps}`;
      }
      
      requestAnimationFrame(updateFps);
    };
    
    requestAnimationFrame(updateFps);
  }

  /**
   * Increment step counter (called when a command is processed)
   */
  incrementStep(): void {
    this.stepCount++;
    this.stepElement.textContent = `Step: ${this.stepCount}`;
    console.log(`[Step ${this.stepCount}] Command processed`);
  }

  /**
   * Get current step count
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    return this.fps;
  }

  /**
   * Set the game mode (host or client)
   */
  setMode(mode: 'host' | 'client'): void {
    this.mode = mode;
    this.modeElement.textContent = `Mode: ${mode.toUpperCase()}`;
  }

  /**
   * Get current mode
   */
  getMode(): 'host' | 'client' | 'unknown' {
    return this.mode;
  }

  /**
   * Remove debug overlay
   */
  dispose(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
