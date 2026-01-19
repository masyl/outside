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
  private ticks!: Graphics; // For timeline tick marks

  // State
  private isVisible: boolean = false;
  private currentStep: number = 0;
  private totalSteps: number = 0;
  private isDragging: boolean = false;

  // Configuration
  private readonly config = {
    barHeight: 12, // Half as thick (was 24)
    padding: 12, // Increased by 50% (was 8)
    innerPadding: 6, // Inner padding between bar edge and green
    sideOffset: 12, // Same as padding for side spacing
    bottomOffset: 50,
    markerWidth: 4, // Thicker marker
    markerHeight: 24, // Taller marker (double bar height)
    cornerRadius: 8, // Same as debug menu
    tickInterval: 10, // 10 seconds for small ticks
    majorTickInterval: 60, // 60 seconds for major ticks
    tickWidth: 1, // 1px width for small ticks
    majorTickWidth: 2, // 2px width for major ticks
    colors: {
      background: 0x000000,
      bar: 0x00ff00,
      marker: 0xffffff, // White marker
      markerBorder: 0x000000, // Black border
      tick: 0x000000, // Black ticks
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

    // Create tick marks container
    this.ticks = new Graphics();
    this.addChild(this.ticks);

    this.updateLayout();
    this.updateMarkerPosition();
    this.updateTicks();
  }

  private setupEventHandlers(): void {
    // Enable mouse interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';

    // Mouse events
    this.on('pointerdown', this.handleMouseDown.bind(this));
    this.on('pointermove', this.handleMouseMove.bind(this));
    this.on('pointerup', this.handleMouseUp.bind(this));
    this.on('pointerupoutside', this.handleMouseUp.bind(this));

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
    const playbackState = this.timelineManager.getPlaybackState();

    // When pausing, ensure cursor shows at current position (not start)
    if (playbackState === PlaybackState.PAUSED) {
      this.setTimelinePosition(state.currentStep, state.totalSteps);
    } else {
      this.setTimelinePosition(state.currentStep, state.totalSteps);
    }

    this.updateVisibility();
  }

  private updateVisibility(): void {
    const playbackState = this.timelineManager.getPlaybackState();
    const state = this.timelineManager.getState();

    // Show when TRAVELING or PAUSED (not when PLAYING)
    const shouldShow =
      playbackState === PlaybackState.TRAVELING || playbackState === PlaybackState.PAUSED;

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

    // Draw green bar with inner padding and rounded corners
    this.bar.clear();
    this.bar.roundRect(
      0,
      this.config.padding,
      barWidth,
      this.config.barHeight,
      this.config.cornerRadius
    );
    this.bar.fill({ color: this.config.colors.bar });

    // Draw inner padding area (black rectangle on left and right edges)
    const innerPadding = this.config.innerPadding;
    if (innerPadding > 0) {
      this.bar.rect(0, this.config.padding, innerPadding, this.config.barHeight);
      this.bar.rect(
        barWidth - innerPadding,
        this.config.padding,
        innerPadding,
        this.config.barHeight
      );
      this.bar.fill({ color: this.config.colors.background, alpha: 1.0 });
    }

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

    // White marker with black border, taller than bar
    const markerY = this.config.padding - (this.config.markerHeight - this.config.barHeight) / 2;
    this.positionMarker.rect(
      markerX - this.config.markerWidth / 2,
      markerY,
      this.config.markerWidth,
      this.config.markerHeight
    );
    this.positionMarker.stroke({ width: 1, color: this.config.colors.markerBorder });
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
    this.updateTicks();
  }

  private updateTicks(): void {
    if (this.totalSteps === 0) {
      this.ticks.visible = false;
      return;
    }

    this.ticks.visible = true;
    this.ticks.clear();

    const screenWidth = this.app.screen.width;
    const barWidth = screenWidth - this.config.sideOffset * 2;
    const usableWidth = barWidth - this.config.innerPadding * 2;

    // Place a tick at every event position (every step)
    for (let i = 0; i < this.totalSteps; i++) {
      // Skip the first and last positions to avoid clutter at edges
      if (i === 0 || i === this.totalSteps - 1) continue;

      const normalizedPosition = i / (this.totalSteps - 1);
      const tickX = normalizedPosition * usableWidth + this.config.innerPadding;

      this.ticks.rect(
        tickX - this.config.tickWidth / 2,
        this.config.padding + this.config.barHeight - this.config.barHeight / 3,
        this.config.tickWidth,
        this.config.barHeight / 3
      );
      this.ticks.fill({ color: this.config.colors.tick });
    }
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    this.isVisible = visible;
  }

  public onResize(): void {
    this.updateLayout();
    this.updateTicks();
  }

  public dispose(): void {
    // Remove event listeners
    this.off('pointerdown', this.handleMouseDown);
    this.off('pointerover', this.handleMouseOver);
    this.off('pointerout', this.handleMouseOut);
    this.off('pointermove', this.handleMouseMove);
    this.off('pointerup', this.handleMouseUp);
    this.off('pointerupoutside', this.handleMouseUp);

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Destroy children
    this.background.destroy();
    this.bar.destroy();
    this.positionMarker.destroy();
    this.ticks.destroy();
  }
}
