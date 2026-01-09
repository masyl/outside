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
  private objectCountElement: HTMLDivElement;
  private clientCountElement: HTMLDivElement;
  private eventCountElement: HTMLDivElement;
  private p2pStatusElement: HTMLDivElement;
  private fps: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private stepCount: number = 0;
  private mode: 'host' | 'client' | 'unknown' = 'unknown';
  private surfaceCount: number = 0;
  private groundCount: number = 0;
  private clientCount: number = 0;
  private eventCount: number = 0;

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

    // Create object count element
    this.objectCountElement = document.createElement('div');
    this.objectCountElement.textContent = 'Objects: 0 (Surf) / 0 (Gnd)';
    this.container.appendChild(this.objectCountElement);

    // Create client count element
    this.clientCountElement = document.createElement('div');
    this.clientCountElement.textContent = 'Clients: 0';
    this.container.appendChild(this.clientCountElement);

    // Create event count element
    this.eventCountElement = document.createElement('div');
    this.eventCountElement.textContent = 'Events: 0';
    this.container.appendChild(this.eventCountElement);

    // Create P2P status element
    this.p2pStatusElement = document.createElement('div');
    this.p2pStatusElement.textContent = 'P2P: unknown';
    this.container.appendChild(this.p2pStatusElement);

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
   * Set step count (called by host or when receiving step updates)
   */
  setStepCount(count: number): void {
    this.stepCount = count;
    this.stepElement.textContent = `Step: ${count}`;
  }

  /**
   * Increment step counter (deprecated - use setStepCount instead)
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
   * Update object counts (surface and ground)
   */
  setObjectCounts(surface: number, ground: number): void {
    this.surfaceCount = surface;
    this.groundCount = ground;
    this.objectCountElement.textContent = `Objects: ${surface} (Surf) / ${ground} (Gnd)`;
  }

  /**
   * Update connected client count
   */
  setClientCount(count: number): void {
    this.clientCount = count;
    this.clientCountElement.textContent = `Clients: ${count}`;
  }

  /**
   * Update event log count
   */
  setEventCount(count: number): void {
    this.eventCount = count;
    this.eventCountElement.textContent = `Events: ${count}`;
  }

  /**
   * Update P2P connection status
   */
  setP2pStatus(status: string): void {
    this.p2pStatusElement.textContent = `P2P: ${status}`;
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
