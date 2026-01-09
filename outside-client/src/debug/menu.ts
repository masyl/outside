import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Button } from '@pixi/ui';
import { Application } from 'pixi.js';

export interface DebugMenuCallbacks {
  onResetLevel?: () => void;
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
    // Create background
    const background = new Graphics();
    background.rect(0, 0, 400, 300);
    background.fill(0x1a1a1a);
    background.stroke({ width: 2, color: 0x00ff00 });
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

    // Create reset level button
    const buttonBackground = new Graphics();
    buttonBackground.rect(0, 0, 200, 40);
    buttonBackground.fill(0x333333);
    buttonBackground.stroke({ width: 1, color: 0x00ff00 });

    const buttonText = new Text({ 
      text: 'Reset Level (R)', 
      style: new TextStyle({
        fontFamily: 'Courier New',
        fontSize: 14,
        fill: 0x00ff00,
      })
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

    this.resetButton.x = 100;
    this.resetButton.y = 100;
    this.container.addChild(this.resetButton.view);
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
      } else if (this.isOpen && event.key === 'r' && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        if (this.callbacks.onResetLevel) {
          this.callbacks.onResetLevel();
        }
      }
    });
  }

  open(): void {
    this.isOpen = true;
    this.container.visible = true;
    this.updatePosition();
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
