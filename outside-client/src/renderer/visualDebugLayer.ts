import { Container, Graphics } from 'pixi.js';

/**
 * VisualDebugLayer - renders debug visualizations between ground and surface layers
 * Uses vector graphics, geometric shapes, and color coding for enhanced game state visualization
 */
export class VisualDebugLayer extends Container {
  private graphics: Graphics;
  private isVisible: boolean = false;

  // Color scheme constants
  private static readonly COLORS = {
    GRID_DOTS: 0xcccccc, // Light gray
    WORLD_BOUNDARY: 0xff8800, // Orange
    MOUSE_CIRCLE: 0x0088ff, // Blue
    CURSOR_TILE: 0xffff00, // Yellow
    BOT_POSITION: 0x00ff00, // Green (maintain existing)
  };

  // Grid configuration
  private static readonly GRID_WIDTH = 20;
  private static readonly GRID_HEIGHT = 10;
  private static readonly TILE_SIZE = 64;

  // Mouse tracking
  private mouseX: number = -1;
  private mouseY: number = -1;

  constructor() {
    console.log('[VisualDebugLayer] Constructor called');
    super();
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.visible = false;
  }

  /**
   * Toggle debug layer visibility
   */
  setVisible(visible: boolean): void {
    console.log(`[VisualDebugLayer] setVisible called with: ${visible}`);
    this.isVisible = visible;
    this.visible = visible;
    if (visible) {
      this.render();
    } else {
      this.graphics.clear();
    }
  }

  /**
   * Update mouse position for real-time tracking
   */
  updateMousePosition(gridX: number, gridY: number): void {
    this.mouseX = gridX;
    this.mouseY = gridY;
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Update bot positions from game state
   */
  updateBotPositions(bots: Array<{ x: number; y: number }>): void {
    this.render();
  }

  /**
   * Render all debug visualizations
   */
  private render(): void {
    console.log(`[VisualDebugLayer] render() called, isVisible: ${this.isVisible}`);
    this.graphics.clear();

    this.renderDotGrid();
    this.renderWorldBoundary();
    this.renderMouseVisualizations();
    // Bot positions will be added in Phase 4
  }

  /**
   * Render dots at tile corners
   */
  private renderDotGrid(): void {
    const { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, COLORS } = VisualDebugLayer;

    console.log(
      `[VisualDebugLayer] renderDotGrid: drawing ${GRID_WIDTH + 1}x${GRID_HEIGHT + 1} dots`
    );

    // Draw dots at each tile corner
    for (let x = 0; x <= GRID_WIDTH; x++) {
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;

        // Fill a small circle for each dot
        this.graphics.beginPath();
        this.graphics.fill({ color: COLORS.GRID_DOTS });
        this.graphics.circle(pixelX, pixelY, 2);
        this.graphics.fill();
      }
    }
  }

  /**
   * Render world boundary rectangle
   */
  private renderWorldBoundary(): void {
    const { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, COLORS } = VisualDebugLayer;

    console.log(
      `[VisualDebugLayer] renderWorldBoundary: drawing boundary of size ${GRID_WIDTH * TILE_SIZE}x${GRID_HEIGHT * TILE_SIZE}`
    );

    this.graphics.setStrokeStyle({ width: 3, color: COLORS.WORLD_BOUNDARY });
    this.graphics.rect(0, 0, GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
    this.graphics.stroke();
  }

  /**
   * Render mouse position circle and cursor tile square
   */
  private renderMouseVisualizations(): void {
    if (this.mouseX < 0 || this.mouseY < 0) return;

    const { TILE_SIZE, COLORS } = VisualDebugLayer;
    const centerX = this.mouseX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.mouseY * TILE_SIZE + TILE_SIZE / 2;

    console.log(
      `[VisualDebugLayer] renderMouseVisualizations: mouse at grid (${this.mouseX}, ${this.mouseY})`
    );

    // Continuous mouse position circle (blue)
    this.graphics.setStrokeStyle({ width: 2, color: COLORS.MOUSE_CIRCLE });
    this.graphics.beginPath();
    this.graphics.circle(centerX, centerY, TILE_SIZE / 3);
    this.graphics.stroke();

    // Grid-snapped cursor tile square (yellow)
    this.graphics.setStrokeStyle({ width: 2, color: COLORS.CURSOR_TILE });
    this.graphics.rect(this.mouseX * TILE_SIZE, this.mouseY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    this.graphics.stroke();
  }
}
