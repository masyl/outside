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
    keys: ['Alt + D', 'Alt + Esc'],
    description: 'Toggle debug panel',
    category: 'Debug',
  },
  {
    keys: ['Shift + G'],
    description: 'Toggle sub-grid (8x8) in debug mode',
    category: 'Debug',
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
    keys: ['Alt + R'],
    description: 'Full reset (clear events, reset step count, reinitialize level)',
    category: 'Debug',
  },
  {
    keys: ['Alt + F'],
    description: 'Freeze/Unfreeze bots',
    category: 'Debug',
  },
  {
    keys: ['Alt + Space'],
    description: 'Toggle play/pause',
    category: 'Timeline',
  },
  {
    keys: ['Alt + ↑', 'Alt + ↓'],
    description: 'Step forward/backward one event',
    category: 'Timeline',
  },
  {
    keys: ['Alt + ←', 'Alt + →'],
    description: 'Scrub timeline (1 second)',
    category: 'Timeline',
  },
  {
    keys: ['Alt + Home'],
    description: 'Time travel to level start (after initialization)',
    category: 'Timeline',
  },
  {
    keys: ['Alt + End'],
    description: 'Time travel to end of history',
    category: 'Timeline',
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
      font-family: 'Minecraft', monospace;
      font-size: 16px;
      padding: 20px;
      border: 2px solid #00ff00;
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
    modifierNote.style.cssText = `
      font-size: 16px;
      color: #888;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #00ff00;
      font-style: italic;
    `;
    modifierNote.textContent =
      'Note: On Mac, use Option key instead of Alt for the shortcuts above';
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
    // Note: Modifier info is now shown at the bottom of the overlay instead of per-item
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
