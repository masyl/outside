/**
 * Overlay for displaying connection status and warnings
 */
export class ConnectionOverlay {
  private container: HTMLDivElement;
  private messageElement: HTMLDivElement;

  constructor() {
    // Create container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.85);
      color: #ff3333;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      padding: 20px 40px;
      border: 2px solid #ff3333;
      border-radius: 4px;
      z-index: 10001;
      text-align: center;
      display: none;
      box-shadow: 0 0 20px rgba(255, 51, 51, 0.3);
    `;

    // Create message element
    this.messageElement = document.createElement('div');
    this.container.appendChild(this.messageElement);

    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Show message
   */
  show(message: string): void {
    this.messageElement.textContent = message;
    this.container.style.display = 'block';
  }

  /**
   * Hide overlay
   */
  hide(): void {
    this.container.style.display = 'none';
  }

  /**
   * Remove overlay
   */
  dispose(): void {
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
