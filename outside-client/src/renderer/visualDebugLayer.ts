import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CoordinateConverter, COORDINATE_SYSTEM, WorldPosition } from './coordinateSystem';
import { Direction } from '@outside/core';

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

  // Mouse tracking (using floating-point world coordinates)
  private mousePos: WorldPosition = { x: -1, y: -1 };

  // Bot tracking
  private bots: Array<{ x: number; y: number; direction?: Direction }> = [];

  // Debug options
  private showSubGrid: boolean = false;

  constructor() {
    super();
    console.log('[VisualDebugLayer] Constructor called, showSubGrid:', this.showSubGrid);
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
   * @param worldX Floating-point world X coordinate
   * @param worldY Floating-point world Y coordinate
   */
  updateMousePosition(worldX: number, worldY: number): void {
    this.mousePos = { x: worldX, y: worldY };
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Update bot positions from game state
   */
  updateBotPositions(bots: Array<{ x: number; y: number; direction?: Direction }>): void {
    this.bots = bots;
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Toggle sub-grid visibility
   */
  setSubGridVisible(visible: boolean): void {
    this.showSubGrid = visible;
    if (this.isVisible) {
      this.render();
    }
  }

  /**
   * Toggle sub-grid visibility state
   */
  toggleSubGrid(): void {
    this.setSubGridVisible(!this.showSubGrid);
  }

  /**
   * Render a coordinate label at the given position
   */
  private renderCoordinateLabel(
    displayX: number,
    displayY: number,
    worldX: number,
    worldY: number
  ): void {
    const text = `(${worldX.toFixed(2)}, ${worldY.toFixed(2)})`;
    const style = new TextStyle({
      fontFamily: 'monospace',
      fontSize: 10,
      fill: 0xffffff,
    });

    const label = new Text({ text, style });

    // Position label slightly below the point
    label.x = displayX - label.width / 2;
    label.y = displayY + 20;

    // Draw background
    this.graphics.beginPath();
    this.graphics.fillStyle.color = 0x000000;
    this.graphics.fillStyle.alpha = 0.25;
    this.graphics.rect(label.x - 2, label.y - 2, label.width + 4, label.height + 4);
    this.graphics.fill();

    // Add text object to container (since it's not a primitive)
    this.addChild(label);
  }

  /**
   * Render all debug visualizations
   */
  private render(): void {
    console.log(`[VisualDebugLayer] render() called, isVisible: ${this.isVisible}`);

    // Clear graphics and remove all children (text labels)
    this.graphics.clear();
    // Keep the graphics object, remove only text labels (which are other children)
    // We iterate backwards to avoid index issues, and stop before index 0 (graphics)
    // Actually, simple way: remove all children, then re-add graphics.
    this.removeChildren();
    this.addChild(this.graphics);

    this.renderDotGrid();
    if (this.showSubGrid) {
      this.renderSubGrid8();
    }
    this.renderWorldBoundary();
    this.renderBots();
    this.renderMouseVisualizations();
  }

  /**
   * Render bot positions and direction vectors
   */
  private renderBots(): void {
    const { COLORS } = VisualDebugLayer;
    const { DISPLAY_TILE_SIZE, VIRTUAL_PIXEL } = COORDINATE_SYSTEM;

    this.bots.forEach((bot) => {
      const displayPos = CoordinateConverter.gridToDisplay({ x: bot.x, y: bot.y });

      // 1. Draw tile highlight (dotted square)
      this.graphics.setStrokeStyle({ width: VIRTUAL_PIXEL, color: COLORS.BOT_POSITION, alpha: 1 });
      this.graphics.beginPath(); // Start new path for dotted square

      // Draw dotted square manually since PixiJS Graphics doesn't support dotted lines natively in a simple way
      const dot = VIRTUAL_PIXEL;
      const gap = VIRTUAL_PIXEL;
      const size = DISPLAY_TILE_SIZE;
      const x = displayPos.x;
      const y = displayPos.y;

      // Top edge
      for (let i = 0; i < size; i += dot + gap) {
        this.graphics.moveTo(x + i, y);
        this.graphics.lineTo(Math.min(x + i + dot, x + size), y);
      }
      // Bottom edge
      for (let i = 0; i < size; i += dot + gap) {
        this.graphics.moveTo(x + i, y + size);
        this.graphics.lineTo(Math.min(x + i + dot, x + size), y + size);
      }
      // Left edge
      for (let i = 0; i < size; i += dot + gap) {
        this.graphics.moveTo(x, y + i);
        this.graphics.lineTo(x, Math.min(y + i + dot, y + size));
      }
      // Right edge
      for (let i = 0; i < size; i += dot + gap) {
        this.graphics.moveTo(x + size, y + i);
        this.graphics.lineTo(x + size, Math.min(y + i + dot, y + size));
      }

      this.graphics.stroke();

      // 2. Draw direction vector if available
      if (bot.direction) {
        const center = CoordinateConverter.getTileCenter(bot.x, bot.y);
        const centerDisplay = CoordinateConverter.worldToDisplay(center);

        let dx = 0;
        let dy = 0;

        switch (bot.direction) {
          case 'up':
            dy = -1;
            break;
          case 'down':
            dy = 1;
            break;
          case 'left':
            dx = -1;
            break;
          case 'right':
            dx = 1;
            break;
          case 'up-left':
            dx = -1;
            dy = -1;
            break;
          case 'up-right':
            dx = 1;
            dy = -1;
            break;
          case 'down-left':
            dx = -1;
            dy = 1;
            break;
          case 'down-right':
            dx = 1;
            dy = 1;
            break;
        }

        // Normalize diagonal vectors
        if (dx !== 0 && dy !== 0) {
          const length = Math.sqrt(dx * dx + dy * dy);
          dx /= length;
          dy /= length;
        }

        // Line length = half tile size (radius)
        const length = DISPLAY_TILE_SIZE / 2;

        this.graphics.setStrokeStyle({ width: 2, color: COLORS.BOT_POSITION, alpha: 1 });
        this.graphics.beginPath();
        this.graphics.moveTo(centerDisplay.x, centerDisplay.y);
        this.graphics.lineTo(centerDisplay.x + dx * length, centerDisplay.y + dy * length);
        this.graphics.stroke();

        // Draw small arrowhead
        const arrowSize = 6;
        const endX = centerDisplay.x + dx * length;
        const endY = centerDisplay.y + dy * length;

        // Calculate angle
        const angle = Math.atan2(dy, dx);

        this.graphics.beginPath();
        this.graphics.moveTo(endX, endY);
        this.graphics.lineTo(
          endX - arrowSize * Math.cos(angle - Math.PI / 6),
          endY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.graphics.moveTo(endX, endY);
        this.graphics.lineTo(
          endX - arrowSize * Math.cos(angle + Math.PI / 6),
          endY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.graphics.stroke();
      }

      // 3. Render coordinate label for bot
      const labelPos = CoordinateConverter.gridToDisplay({ x: bot.x, y: bot.y });
      // Center horizontally on the tile
      labelPos.x += DISPLAY_TILE_SIZE / 2;
      // Position below the tile
      labelPos.y += DISPLAY_TILE_SIZE;

      this.renderCoordinateLabel(labelPos.x, labelPos.y, bot.x, bot.y);
    });
  }

  /**
   * Render dots at tile corners
   */
  private renderDotGrid(): void {
    const { GRID_WIDTH, GRID_HEIGHT, COLORS } = VisualDebugLayer;

    console.log(
      `[VisualDebugLayer] renderDotGrid: drawing ${GRID_WIDTH + 1}x${GRID_HEIGHT + 1} dots`
    );

    // Draw dots at each tile corner
    for (let x = 0; x <= GRID_WIDTH; x++) {
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        const gridPos = { x, y };
        const displayPos = CoordinateConverter.gridToDisplay(gridPos);

        // Fill a small circle for each dot
        this.graphics.beginPath();
        this.graphics.fill({ color: COLORS.GRID_DOTS });
        this.graphics.circle(displayPos.x, displayPos.y, 2);
        this.graphics.fill();
      }
    }
  }

  /**
   * Render 8x8 sub-grid for precise positioning
   */
  private renderSubGrid8(): void {
    const { GRID_WIDTH, GRID_HEIGHT, COLORS } = VisualDebugLayer;
    const { DISPLAY_TILE_SIZE } = COORDINATE_SYSTEM;
    const SUB_SIZE = DISPLAY_TILE_SIZE / 8;

    this.graphics.setStrokeStyle({ width: 1, color: COLORS.GRID_DOTS, alpha: 0.3 });
    this.graphics.beginPath();

    // Draw vertical sub-grid lines
    for (let x = 0; x < GRID_WIDTH; x++) {
      for (let subX = 1; subX < 8; subX++) {
        const xPos = x * DISPLAY_TILE_SIZE + subX * SUB_SIZE;
        this.graphics.moveTo(xPos, 0);
        this.graphics.lineTo(xPos, GRID_HEIGHT * DISPLAY_TILE_SIZE);
      }
    }

    // Draw horizontal sub-grid lines
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let subY = 1; subY < 8; subY++) {
        const yPos = y * DISPLAY_TILE_SIZE + subY * SUB_SIZE;
        this.graphics.moveTo(0, yPos);
        this.graphics.lineTo(GRID_WIDTH * DISPLAY_TILE_SIZE, yPos);
      }
    }

    this.graphics.stroke();
  }

  /**
   * Render world boundary rectangle
   */
  private renderWorldBoundary(): void {
    const { GRID_WIDTH, GRID_HEIGHT, COLORS } = VisualDebugLayer;

    // Use coordinate converter for dimensions
    const topLeft = CoordinateConverter.gridToDisplay({ x: 0, y: 0 });
    const bottomRight = CoordinateConverter.gridToDisplay({ x: GRID_WIDTH, y: GRID_HEIGHT });
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    console.log(
      `[VisualDebugLayer] renderWorldBoundary: drawing boundary of size ${width}x${height}`
    );

    this.graphics.setStrokeStyle({ width: 3, color: COLORS.WORLD_BOUNDARY });
    this.graphics.rect(topLeft.x, topLeft.y, width, height);
    this.graphics.stroke();
  }

  /**
   * Render mouse position circle and cursor tile square
   */
  private renderMouseVisualizations(): void {
    if (this.mousePos.x < 0 || this.mousePos.y < 0) return;

    const { COLORS } = VisualDebugLayer;
    const { DISPLAY_TILE_SIZE } = COORDINATE_SYSTEM;

    console.log(
      `[VisualDebugLayer] renderMouseVisualizations: mouse at world (${this.mousePos.x.toFixed(2)}, ${this.mousePos.y.toFixed(2)})`
    );

    // 1. Continuous mouse position circle (blue) - follows exact floating point position
    const mouseDisplay = CoordinateConverter.worldToDisplay(this.mousePos);

    this.graphics.setStrokeStyle({ width: 2, color: COLORS.MOUSE_CIRCLE });
    this.graphics.beginPath();
    this.graphics.circle(mouseDisplay.x, mouseDisplay.y, DISPLAY_TILE_SIZE / 3);
    this.graphics.stroke();

    // 2. Grid-snapped cursor tile square (yellow) - highlights the tile
    const gridPos = CoordinateConverter.getGridPosition(this.mousePos);
    const tileDisplay = CoordinateConverter.gridToDisplay(gridPos);

    this.graphics.setStrokeStyle({ width: 2, color: COLORS.CURSOR_TILE });
    this.graphics.rect(tileDisplay.x, tileDisplay.y, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE);
    this.graphics.stroke();

    // 3. 8x8 Sub-grid snapping visualization (always visible when debug is on)
    const sub8Pos = CoordinateConverter.snapToSubGrid8(this.mousePos);
    const sub8Display = CoordinateConverter.worldToDisplay(sub8Pos);

    const HALF_SUB_SIZE = DISPLAY_TILE_SIZE / 8 / 2; // 4px

    this.graphics.setStrokeStyle({ width: 1, color: COLORS.CURSOR_TILE, alpha: 0.5 });
    this.graphics.beginPath();

    // Draw X
    // Line 1: Top-Left to Bottom-Right
    this.graphics.moveTo(sub8Display.x - HALF_SUB_SIZE, sub8Display.y - HALF_SUB_SIZE);
    this.graphics.lineTo(sub8Display.x + HALF_SUB_SIZE, sub8Display.y + HALF_SUB_SIZE);

    // Line 2: Top-Right to Bottom-Left
    this.graphics.moveTo(sub8Display.x + HALF_SUB_SIZE, sub8Display.y - HALF_SUB_SIZE);
    this.graphics.lineTo(sub8Display.x - HALF_SUB_SIZE, sub8Display.y + HALF_SUB_SIZE);

    this.graphics.stroke();

    // 4. Render coordinate label for mouse
    this.renderCoordinateLabel(mouseDisplay.x, mouseDisplay.y, this.mousePos.x, this.mousePos.y);
  }
}
