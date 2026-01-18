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
    barHeight: 12, // Half as thick (was 24)
    padding: 12, // Increased by 50% (was 8)
    sideOffset: 12, // Same as padding for side spacing
    bottomOffset: 50,
    markerWidth: 2,
    cornerRadius: 8, // Same as debug menu
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

    // Show only when TRAVELING (not when PLAYING)
    const shouldShow = playbackState === PlaybackState.TRAVELING;

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
    // Account for side offset and get relative position within bar
    const relativeX = mouseX - this.x;
    const screenWidth = this.app.screen.width;
    const barWidth = screenWidth - this.config.sideOffset * 2;

    // Convert to step number
    const targetStep = Math.floor((relativeX / barWidth) * this.totalSteps);

    // Clamp to valid range
    return Math.max(0, Math.min(targetStep, this.totalSteps - 1));
  }

  private updateLayout(): void {
    const screenWidth = this.app.screen.width;
    const totalHeight = this.config.barHeight + this.config.padding * 2;

    // Position at bottom of screen with side padding
    this.x = this.config.sideOffset;
    this.y = this.app.screen.height - this.config.bottomOffset - totalHeight;

    const barWidth = screenWidth - this.config.sideOffset * 2;

    // Draw background (black padding) with rounded corners
    this.background.clear();
    this.background.roundRect(0, 0, barWidth, totalHeight, this.config.cornerRadius);
    this.background.fill({ color: this.config.colors.background, alpha: 1.0 });

    // Draw green bar (centered within padding) with rounded corners
    this.bar.clear();
    this.bar.roundRect(
      0,
      this.config.padding,
      barWidth,
      this.config.barHeight,
      this.config.cornerRadius
    );
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
    const screenWidth = this.app.screen.width;
    const barWidth = screenWidth - this.config.sideOffset * 2;
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
    const barWidth = screenWidth - this.config.sideOffset * 2;
    const totalHeight = this.config.barHeight + this.config.padding * 2;

    this.background.clear();
    this.background.roundRect(0, 0, barWidth, totalHeight, this.config.cornerRadius);
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
