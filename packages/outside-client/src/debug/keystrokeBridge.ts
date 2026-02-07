import { keystrokeStore } from './keystrokeStore';

export class KeystrokeBridge {
  static toggle(): void {
    keystrokeStore.toggle();
  }

  static show(): void {
    keystrokeStore.setVisible(true);
  }

  static hide(): void {
    keystrokeStore.setVisible(false);
  }

  static isVisible(): boolean {
    return keystrokeStore.getState().visible;
  }
}
