import { Graphics, Text, TextStyle, type Container } from 'pixi.js';

/**
 * Lightweight debug HUD for renderer diagnostics.
 */
export class PixiDebugOverlay {
  private label?: Text;
  private marker?: Graphics;
  private enabled = false;

  /**
   * @param stage `Container` that owns overlay display objects.
   */
  constructor(private readonly stage: Container) {}

  /**
   * Enables or disables the overlay.
   *
   * @param enabled `boolean` flag controlling visibility/lifecycle.
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) {
      if (!this.marker) {
        this.marker = new Graphics();
        this.marker.rect(10, 10, 120, 80).fill(0xff00ff);
        this.marker.zIndex = 9999;
        this.stage.addChild(this.marker);
      }
      if (!this.label) {
        this.label = new Text({
          text: 'renderer init',
          style: new TextStyle({
            fill: 0xffcc00,
            fontFamily: 'monospace',
            fontSize: 12,
            stroke: { color: 0x000000, width: 2 },
          }),
        });
        this.label.x = 10;
        this.label.y = 100;
        this.label.zIndex = 9999;
        this.stage.addChild(this.label);
      }
      return;
    }

    this.marker?.destroy();
    this.marker = undefined;
    this.label?.destroy();
    this.label = undefined;
  }

  /**
   * @returns `boolean` whether debug mode is enabled.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Updates camera text diagnostics.
   *
   * @param worldX `number` center X in world tile units.
   * @param worldY `number` center Y in world tile units.
   * @param screenWidth `number` viewport width in pixels.
   * @param screenHeight `number` viewport height in pixels.
   * @param rootX `number` root container X in pixels.
   * @param rootY `number` root container Y in pixels.
   */
  setCenterLabel(
    worldX: number,
    worldY: number,
    screenWidth: number,
    screenHeight: number,
    rootX: number,
    rootY: number
  ): void {
    if (!this.label) return;
    this.label.text =
      `center=(${worldX.toFixed(2)}, ${worldY.toFixed(2)}) ` +
      `screen=(${screenWidth}x${screenHeight}) ` +
      `root=(${rootX.toFixed(1)}, ${rootY.toFixed(1)})`;
  }

  /**
   * Updates per-frame entity/layer counters.
   *
   * @param message `string` preformatted diagnostic line.
   */
  setStatsLabel(message: string): void {
    if (!this.label) return;
    this.label.text = message;
  }

  /**
   * Destroys overlay display objects.
   */
  destroy(): void {
    this.setEnabled(false);
  }
}
