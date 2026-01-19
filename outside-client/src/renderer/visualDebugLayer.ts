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
    super();
    this.graphics = new Graphics();
    this.addChild(this.graphics);
    this.visible = false;
  }

  /**
   * Toggle debug layer visibility
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.visible = visible;
    if (visible) {
      this.render();
    } else {
      this.clear();
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
   * Clear all graphics
   */
  private clear(): void {
    this.graphics.clear();
  }

  /**
   * Render all debug visualizations
   */
  private render(): void {
    this.clear();

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

    this.graphics.setStrokeStyle({ width: 2, color: COLORS.GRID_DOTS });

    // Draw dots at each tile corner
    for (let x = 0; x <= GRID_WIDTH; x++) {
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        const pixelX = x * TILE_SIZE;
        const pixelY = y * TILE_SIZE;
        this.graphics.drawCircle(pixelX, pixelY, 2);
      }
    }
  }

  /**
   * Render world boundary rectangle
   */
  private renderWorldBoundary(): void {
    const { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, COLORS } = VisualDebugLayer;

    this.graphics.setStrokeStyle({ width: 3, color: COLORS.WORLD_BOUNDARY });
    this.graphics.drawRect(0, 0, GRID_WIDTH * TILE_SIZE, GRID_HEIGHT * TILE_SIZE);
  }

  /**
   * Render mouse position circle and cursor tile square
   */
  private renderMouseVisualizations(): void {
    if (this.mouseX < 0 || this.mouseY < 0) return;

    const { TILE_SIZE, COLORS } = VisualDebugLayer;
    const centerX = this.mouseX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.mouseY * TILE_SIZE + TILE_SIZE / 2;

    // Continuous mouse position circle (blue)
    this.graphics.setStrokeStyle({ width: 2, color: COLORS.MOUSE_CIRCLE });
    this.graphics.drawCircle(centerX, centerY, TILE_SIZE / 3);

    // Grid-snapped cursor tile square (yellow)
    this.graphics.setStrokeStyle({ width: 2, color: COLORS.CURSOR_TILE });
    this.graphics.drawRect(this.mouseX * TILE_SIZE, this.mouseY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }
}
