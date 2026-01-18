import { Container, Graphics } from 'pixi.js';
import { Application } from 'pixi.js';
import { TimelineManager } from '../timeline/manager';
import { PlaybackState } from '../timeline/types';

/**
 * Utility function for throttling function calls
 */
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export class TimelineBar extends Container {
  private app: Application;
  private timelineManager: TimelineManager;

  // Visual elements
  private background!: Graphics;
  private bar!: Graphics;
  private positionMarker!: Graphics;

  // State
  private isVisible: boolean = false;
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private isDragging: boolean = false;

  // Configuration
  private readonly config = {
    barHeight: 24,
    padding: 8,
    bottomOffset: 50,
    markerWidth: 2,
    colors: {
      background: 0x000000,
      bar: 0x00ff00,
      marker: 0x000000,
      borderHover: 0x40ff40, // Brighter green for hover
    },
  };

  // Throttled update function (60fps ~ 16ms)
  private throttledGoToStep: (step: number) => void;

  constructor(app: Application, timelineManager: TimelineManager) {
    super();

    this.app = app;
    this.timelineManager = timelineManager;

    // Initialize throttled function
    this.throttledGoToStep = throttle((step: number) => {
      this.timelineManager.goToStep(step);
    }, 16);

    // Set initial visibility and z-index
    this.visible = false;
    this.zIndex = 9999; // Below debug overlay (10000) but above game elements

    this.createVisualElements();
    this.setupEventHandlers();
    this.setupTimelineManagerCallbacks();

    // Initial position update
    this.updateFromTimelineManager();
  }

  private createVisualElements(): void {
    // Create background (black padding)
    this.background = new Graphics();
    this.addChild(this.background);

    // Create timeline bar (green)
    this.bar = new Graphics();
    this.addChild(this.bar);

    // Create position marker
    this.positionMarker = new Graphics();
    this.addChild(this.positionMarker);

    this.updateLayout();
    this.updateMarkerPosition();
  }

  private setupEventHandlers(): void {
    // Enable mouse interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Mouse events
    this.on('pointerdown', this.handleMouseDown.bind(this));
    this.app.stage.on('pointermove', this.handleMouseMove.bind(this));
    this.app.stage.on('pointerup', this.handleMouseUp.bind(this));
    this.app.stage.on('pointerupoutside', this.handleMouseUp.bind(this));

    // Hover effects
    this.on('pointerover', this.handleMouseOver.bind(this));
    this.on('pointerout', this.handleMouseOut.bind(this));
  }

  private setupTimelineManagerCallbacks(): void {
    // Listen for playback state changes
    this.timelineManager.onStateChange((state: PlaybackState) => {
      this.updateVisibility();
    });

    // Listen for position changes
    this.timelineManager.onPositionChange((currentStep: number, totalSteps: number) => {
      this.setTimelinePosition(currentStep, totalSteps);
    });
  }

  private updateFromTimelineManager(): void {
    const state = this.timelineManager.getState();
    this.setTimelinePosition(state.currentStep, state.totalSteps);
    this.updateVisibility();
  }

  private updateVisibility(): void {
    const playbackState = this.timelineManager.getPlaybackState();
    const state = this.timelineManager.getState();

    // Show when not in normal PLAY mode or when in PLAY but not at head
    const shouldShow =
      playbackState !== PlaybackState.PLAYING || state.currentStep < state.totalSteps - 1;

    this.setVisible(shouldShow);
  }

  private handleMouseDown(event: any): void {
    this.isDragging = true;
    const targetStep = this.calculateTargetStep(event.global.x);
    this.throttledGoToStep(targetStep);
  }

  private handleMouseMove(event: any): void {
    if (!this.isDragging) return;

    const targetStep = this.calculateTargetStep(event.global.x);
    this.throttledGoToStep(targetStep);
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleMouseOver(): void {
    // Brighten border on hover
    this.updateVisuals(true);
  }

  private handleMouseOut(): void {
    this.isDragging = false;
    // Reset border color
    this.updateVisuals(false);
  }

  private calculateTargetStep(mouseX: number): number {
    // Get the bar bounds in global coordinates
    const barBounds = this.bar.getBounds();

    // Calculate relative position within the bar
    const relativeX = mouseX - barBounds.x;
    const barWidth = barBounds.width;

    // Convert to step number
    const targetStep = Math.floor((relativeX / barWidth) * this.totalSteps);

    // Clamp to valid range
    return Math.max(0, Math.min(targetStep, this.totalSteps - 1));
  }

  private updateLayout(): void {
    const screenWidth = this.app.screen.width;
    const totalHeight = this.config.barHeight + this.config.padding * 2;

    // Position at bottom of screen
    this.x = 0;
    this.y = this.app.screen.height - this.config.bottomOffset - totalHeight;

    // Draw background (black padding)
    this.background.clear();
    this.background.rect(0, 0, screenWidth, totalHeight);
    this.background.fill({ color: this.config.colors.background, alpha: 1.0 });

    // Draw green bar (centered within padding)
    this.bar.clear();
    this.bar.rect(0, this.config.padding, screenWidth, this.config.barHeight);
    this.bar.fill({ color: this.config.colors.bar });

    // Update marker position
    this.updateMarkerPosition();
  }

  private updateMarkerPosition(): void {
    if (this.totalSteps === 0) {
      this.positionMarker.visible = false;
      return;
    }

    this.positionMarker.visible = true;
    const barWidth = this.app.screen.width;
    const markerX = (this.currentStep / (this.totalSteps - 1)) * barWidth;

    this.positionMarker.clear();
    this.positionMarker.rect(
      markerX - this.config.markerWidth / 2,
      this.config.padding,
      this.config.markerWidth,
      this.config.barHeight
    );
    this.positionMarker.fill({ color: this.config.colors.marker });
  }

  private updateVisuals(isHovered: boolean = false): void {
    const screenWidth = this.app.screen.width;
    const totalHeight = this.config.barHeight + this.config.padding * 2;

    this.background.clear();
    this.background.rect(0, 0, screenWidth, totalHeight);
    this.background.fill({ color: this.config.colors.background, alpha: 1.0 });

    // Add border with hover effect
    const borderColor = isHovered ? this.config.colors.borderHover : this.config.colors.bar;
    this.background.stroke({ width: 2, color: borderColor });
  }

  private setTimelinePosition(currentStep: number, totalSteps: number): void {
    this.currentStep = currentStep;
    this.totalSteps = totalSteps;
    this.updateMarkerPosition();
  }

  // Public API
  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.isVisible = visible;
  }

  public onResize(): void {
    this.updateLayout();
  }

  public dispose(): void {
    // Remove event listeners
    this.off('pointerdown', this.handleMouseDown);
    this.off('pointerover', this.handleMouseOver);
    this.off('pointerout', this.handleMouseOut);
    this.app.stage.off('pointermove', this.handleMouseMove);
    this.app.stage.off('pointerup', this.handleMouseUp);
    this.app.stage.off('pointerupoutside', this.handleMouseUp);

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Destroy children
    this.background.destroy();
    this.bar.destroy();
    this.positionMarker.destroy();
  }
}
