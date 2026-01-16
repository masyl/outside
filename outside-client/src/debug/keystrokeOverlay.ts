interface KeystrokeEntry {
  keys: string[];
  description: string;
  modifier?: string;
  category?: string;
}

const KEYSTROKES: KeystrokeEntry[] = [
  {
    keys: ['?', 'ESC'],
    description: 'Toggle this help menu',
  },
  {
    keys: ['Tab', 'Shift+Tab'],
    description: 'Cycle to next/previous bot',
    category: 'Bot Selection',
  },
  {
    keys: ['↑', '↓', '←', '→'],
    description: 'Move selected bot',
    category: 'Bot Movement',
  },
  {
    keys: ['CMD+ESC', 'CTRL+ESC'],
    description: 'Open debug menu',
    modifier: 'CMD on Mac, CTRL on Windows',
    category: 'Debug',
  },
  {
    keys: ['R (in debug menu)'],
    description: 'Reset level',
    category: 'Debug',
  },
  {
    keys: ['A (in debug menu)'],
    description: 'Toggle autonomy',
    category: 'Debug',
  },
];

/**
 * Overlay for displaying keyboard shortcuts
 */
export class KeystrokeOverlay {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'keystroke-overlay';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      z-index: 10002;
      display: none;
    `;

    this.renderContent();

    document.body.appendChild(this.container);

    this.setupClickOutsideToClose();
  }

  /**
   * Render overlay content with keystrokes
   */
  private renderContent(): void {
    const title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    this.container.appendChild(title);

    const table = this.createKeystrokeTable();
    this.container.appendChild(table);

    const modifierNote = document.createElement('div');
    modifierNote.className = 'modifier-note';
    modifierNote.textContent = 'Use Option on Mac or Alt on Windows for advanced controls';
    this.container.appendChild(modifierNote);
  }

  /**
   * Create keystroke table
   */
  private createKeystrokeTable(): HTMLTableElement {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    `;

    KEYSTROKES.forEach((keystroke) => {
      const row = this.createKeystrokeRow(keystroke);
      table.appendChild(row);
    });

    return table;
  }

  /**
   * Create a keystroke table row
   */
  private createKeystrokeRow(keystroke: KeystrokeEntry): HTMLTableRowElement {
    const row = document.createElement('tr');

    const keyCell = document.createElement('td');
    keyCell.style.cssText = `
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #00ff00;
      vertical-align: top;
      font-weight: bold;
      white-space: nowrap;
    `;
    keyCell.textContent = keystroke.keys.join(', ');
    row.appendChild(keyCell);

    const descCell = document.createElement('td');
    descCell.style.cssText = `
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #00ff00;
    `;
    descCell.textContent = keystroke.description;
    if (keystroke.modifier) {
      const modifier = document.createElement('div');
      modifier.style.cssText = `
        font-size: 12px;
        color: #888;
        margin-top: 4px;
        font-style: italic;
      `;
      modifier.textContent = keystroke.modifier;
      descCell.appendChild(modifier);
    }
    row.appendChild(descCell);

    return row;
  }

  /**
   * Show overlay
   */
  show(): void {
    this.container.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide overlay
   */
  hide(): void {
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Toggle overlay visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Setup click outside to close
   */
  private setupClickOutsideToClose(): void {
    document.addEventListener('click', (event) => {
      if (this.isVisible && !this.container.contains(event.target as Node)) {
        this.hide();
      }
    });
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
