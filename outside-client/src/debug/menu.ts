import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from '@pixi/ui';
import { Application } from 'pixi.js';

export interface DebugMenuCallbacks {
  onResetLevel?: () => void;
  onToggleAutonomy?: () => void;
  isAutonomyEnabled?: () => boolean;
}

/**
 * Debug menu that can be opened with CMD+ESC and closed with ESC
 */
export class DebugMenu {
  private app: Application;
  private container: Container;
  private isOpen: boolean = false;
  private callbacks: DebugMenuCallbacks;
  private resetButton: Button | null = null;
  private autonomyButton: Button | null = null;
  private autonomyButtonText: Text | null = null;

  constructor(app: Application, callbacks: DebugMenuCallbacks = {}) {
    this.app = app;
    this.callbacks = callbacks;
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 10000;

    this.setupMenu();
    this.setupKeyboardHandlers();

    app.stage.addChild(this.container);
  }

  private setupMenu(): void {
    // Create background with rounded corners
    const background = new Graphics();
    background.beginFill(0x1a1a1a);
    background.drawRoundedRect(0, 0, 400, 300, 8); // 8px corner radius
    background.endFill();
    background.lineStyle(2, 0x00ff00);
    background.drawRoundedRect(0, 0, 400, 300, 8);
    this.container.addChild(background);

    // Create title
    const titleStyle = new TextStyle({
      fontFamily: 'Courier New',
      fontSize: 20,
      fill: 0x00ff00,
      fontWeight: 'bold',
    });
    const title = new Text({ text: 'Debug Menu', style: titleStyle });
    title.x = 20;
    title.y = 20;
    this.container.addChild(title);

    // Create reset level button with rounded corners
    const buttonBackground = new Graphics();
    buttonBackground.beginFill(0x333333);
    buttonBackground.drawRoundedRect(0, 0, 200, 40, 6); // 6px corner radius for buttons
    buttonBackground.endFill();
    buttonBackground.lineStyle(1, 0x00ff00);
    buttonBackground.drawRoundedRect(0, 0, 200, 40, 6);

    const buttonText = new Text({
      text: 'Reset Level (Alt+R)',
      style: new TextStyle({
        fontFamily: 'Courier New',
        fontSize: 14,
        fill: 0x00ff00,
      }),
    });
    buttonText.x = 10;
    buttonText.y = 10;

    const buttonView = new Container();
    buttonView.addChild(buttonBackground);
    buttonView.addChild(buttonText);

    this.resetButton = new Button(buttonView);
    this.resetButton.onPress.connect(() => {
      if (this.callbacks.onResetLevel) {
        this.callbacks.onResetLevel();
      }
    });

    // Make button interactive
    buttonView.eventMode = 'static';
    buttonView.cursor = 'pointer';

    buttonView.x = 100;
    buttonView.y = 100;
    this.container.addChild(buttonView);

    // Create toggle autonomy button with rounded corners
    const autonomyButtonBackground = new Graphics();
    autonomyButtonBackground.beginFill(0x333333);
    autonomyButtonBackground.drawRoundedRect(0, 0, 200, 40, 6); // 6px corner radius for buttons
    autonomyButtonBackground.endFill();
    autonomyButtonBackground.lineStyle(1, 0x00ff00);
    autonomyButtonBackground.drawRoundedRect(0, 0, 200, 40, 6);

    this.autonomyButtonText = new Text({
      text: this.getAutonomyButtonText(),
      style: new TextStyle({
        fontFamily: 'Courier New',
        fontSize: 14,
        fill: 0x00ff00,
      }),
    });
    this.autonomyButtonText.x = 10;
    this.autonomyButtonText.y = 10;

    const autonomyButtonView = new Container();
    autonomyButtonView.addChild(autonomyButtonBackground);
    autonomyButtonView.addChild(this.autonomyButtonText);

    this.autonomyButton = new Button(autonomyButtonView);
    this.autonomyButton.onPress.connect(() => {
      if (this.callbacks.onToggleAutonomy) {
        this.callbacks.onToggleAutonomy();
        this.updateAutonomyButtonText();
      }
    });

    autonomyButtonView.eventMode = 'static';
    autonomyButtonView.cursor = 'pointer';

    autonomyButtonView.x = 100;
    autonomyButtonView.y = 160;
    this.container.addChild(autonomyButtonView);
  }

  private getAutonomyButtonText(): string {
    const isEnabled = this.callbacks.isAutonomyEnabled ? this.callbacks.isAutonomyEnabled() : false;
    return `Bot Autonomy: ${isEnabled ? 'ON (A)' : 'OFF (A)'}`;
  }

  private updateAutonomyButtonText(): void {
    if (this.autonomyButtonText) {
      this.autonomyButtonText.text = this.getAutonomyButtonText();
    }
  }

  private setupKeyboardHandlers(): void {
    window.addEventListener('keydown', (event) => {
      // CMD+ESC (Mac) or CTRL+ESC (Windows/Linux) to open
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (isModifierPressed && event.key === 'Escape') {
        event.preventDefault();
        this.open();
      } else if (!isModifierPressed && event.key === 'Escape' && this.isOpen) {
        event.preventDefault();
        this.close();
      } else if (event.altKey && (event.key === 'r' || event.key === 'R')) {
        event.preventDefault();
        if (this.callbacks.onResetLevel) {
          console.log('[Debug] Reset level (Alt+R)');
          this.callbacks.onResetLevel();
        }
      } else if (
        this.isOpen &&
        (event.key === 'a' || event.key === 'A') &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        if (this.callbacks.onToggleAutonomy) {
          this.callbacks.onToggleAutonomy();
          this.updateAutonomyButtonText();
        }
      }
    });
  }

  open(): void {
    this.isOpen = true;
    this.container.visible = true;
    this.updatePosition();
    this.updateAutonomyButtonText();
  }

  close(): void {
    this.isOpen = false;
    this.container.visible = false;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private updatePosition(): void {
    // Center the menu on screen
    this.container.x = (this.app.screen.width - 400) / 2;
    this.container.y = (this.app.screen.height - 300) / 2;
  }

  /**
   * Update menu position when window is resized
   */
  onResize(): void {
    if (this.isOpen) {
      this.updatePosition();
    }
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.app.stage.removeChild(this.container);
    this.container.destroy();
  }
}
