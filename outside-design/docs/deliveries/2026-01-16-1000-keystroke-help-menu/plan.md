## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Commit Message**: [commit.md](./commit.md)

# Implementation Plan: Keystroke Help Menu

## Overview

This plan details the implementation of a DOM-based help overlay that displays all available keyboard shortcuts. This establishes the modifier key pattern (Option/Alt) that will be used throughout the timeline controls series.

## Architectural Principles

1. **DOM-Based Overlay**: Follow existing ConnectionOverlay pattern for consistency
2. **Modifier Key Pattern**: Establish Option/Alt modifier for advanced controls
3. **Accessibility**: Proper keyboard navigation and focus management
4. **Clean Integration**: Minimal changes to existing systems

## File Structure

```
outside-client/src/
├── debug/
│   ├── keystrokeOverlay.ts  # New: Keystroke overlay component
│   └── menu.ts              # Modify: Update existing debug keystrokes
└── input/
    └── keyboardHandler.ts    # Modify: Add "?" handler
```

## Implementation Steps

### Phase 1: Keystroke Overlay Component

**Create `keystrokeOverlay.ts`**

- Class: `KeystrokeOverlay` following ConnectionOverlay pattern
- Constructor parameters:
  - `container`: HTMLElement for overlay
- Methods:
  - `show()`: Display overlay with visible styling
  - `hide()`: Hide overlay
  - `toggle()`: Switch between show/hide
  - `updateKeystrokes(keystrokes)`: Update displayed keystrokes
- DOM structure:
  - Container div with absolute positioning
  - Table format for keystroke display
  - Header with "Keyboard Shortcuts" title
  - Rows: Keystroke | Description
  - Footer with modifier key instructions
- Styling:
  - Dark theme matching debug aesthetic
  - Monospace font (e.g., 'Courier New', monospace)
  - High contrast colors (green/black)
  - Box shadow for visibility
  - z-index: 10002 (above debug overlay)

### Phase 2: Keystroke Data Structure

**Define keystroke interface in `keystrokeOverlay.ts`**

```typescript
interface KeystrokeEntry {
  keys: string[]; // e.g., ["Tab", "Shift+Tab"]
  description: string; // e.g., "Cycle to next/previous bot"
  modifier?: string; // e.g., "Option on Mac, Alt on Windows"
  category?: string; // e.g., "Bot Control"
}
```

**Create keystroke data array**

```typescript
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
```

### Phase 3: Keyboard Handler Integration

**Modify `keyboardHandler.ts`**

- Add "?" keystroke handler:
  ```typescript
  this.keyHandlers.set('?', (event) => {
    event.preventDefault();
    keystrokeOverlay.toggle();
  });
  ```
- Add ESC handler when overlay is visible:
  ```typescript
  if (keystrokeOverlay.isVisible) {
    this.keyHandlers.set('Escape', (event) => {
      keystrokeOverlay.hide();
    });
  }
  ```
- Pass keystroke data to overlay on initialization

### Phase 4: DOM Integration

**Modify `main.ts`**

- Create keystroke overlay container div
  ```javascript
  const keystrokeOverlayDiv = document.createElement('div');
  keystrokeOverlayDiv.id = 'keystroke-overlay';
  document.body.appendChild(keystrokeOverlayDiv);
  ```
- Initialize `KeystrokeOverlay` with container
- Pass instance to `KeyboardHandler` constructor
- Ensure overlay is hidden by default

### Phase 5: Styling

**CSS styling for keystroke overlay**

```css
#keystroke-overlay {
  position: absolute;
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
}

#keystroke-overlay.visible {
  display: block;
}

#keystroke-overlay h2 {
  margin: 0 0 15px 0;
  text-align: center;
  color: #00ff00;
}

#keystroke-overlay table {
  width: 100%;
  border-collapse: collapse;
}

#keystroke-overlay th,
#keystroke-overlay td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #00ff00;
}

#keystroke-overlay th {
  color: #00ff00;
  font-weight: bold;
}

#keystroke-overlay .modifier-note {
  margin-top: 15px;
  font-style: italic;
  color: #888;
  text-align: center;
}
```

### Phase 6: Existing Debug Keystroke Updates

**Update `menu.ts` debug keystrokes**

- Add modifier key pattern documentation
- Update keystroke help menu with R and A shortcuts
- Ensure consistency with overlay display

## Checklist

- [ ] Create `KeystrokeOverlay` class
- [ ] Define `KeystrokeEntry` interface
- [ ] Create keystroke data array with all current shortcuts
- [ ] Add "?" handler to `KeyboardHandler`
- [ ] Add ESC handler for overlay dismissal
- [ ] Create DOM container in `main.ts`
- [ ] Initialize overlay and pass to handlers
- [ ] Add CSS styling
- [ ] Test overlay toggle with "?" and ESC
- [ ] Verify all keystrokes display correctly
- [ ] Test focus management (clicking outside to close)
- [ ] Update pitches index

## Success Metrics

- Overlay appears/disappears with "?" and ESC keys
- All current keystrokes displayed in table format
- Styling matches debug aesthetic
- No conflicts with existing keyboard handlers
- Accessible and keyboard-navigable

## Notes

- This establishes the modifier key pattern that will be used in Timeline Keystrokes Integration (series: 5)
- Future timeline keystrokes will be added to the KEYSTROKES array
- Overlay should be dismissible by clicking outside the table

## Related Pitches

- **Next**: [Timeline Engine Core (Timeline series: 2)](../../pitches/timeline-engine-core.md)
- **Prerequisite**: None (foundational feature)
