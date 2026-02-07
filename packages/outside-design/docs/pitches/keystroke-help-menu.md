---
Title: "Keystroke Help Menu (Timeline series: 1)"
Category: Timeline
DeliveryLink: /deliveries/2026-01-16-1430-keystroke-help-menu/
---

# Keystroke Help Menu (Timeline series: 1)

## Motivation

Developers and users need a quick reference for available keyboard shortcuts in the game. Currently, keystrokes are scattered throughout the codebase with no central documentation, making it difficult to discover and remember controls. A help menu activated by "?" will provide instant access to all available shortcuts.

## Solution

Implement a DOM-based help overlay that displays all available keyboard shortcuts in a clean, readable format. The overlay will appear when the "?" key is pressed and dismiss with ESC or another "?" press. This will establish the modifier key pattern (Option/Alt) for advanced controls needed in subsequent timeline features.

## Inclusions

- DOM-based help overlay (similar to ConnectionOverlay)
- "?" key handler to toggle overlay visibility
- ESC key handler to dismiss overlay
- Table format displaying all current keystrokes:
  - Bot selection: Tab, Shift+Tab
  - Bot movement: Arrow keys (when bot selected)
  - Debug menu: CMD+ESC / CTRL+ESC
  - Debug menu shortcuts: R (reset), A (autonomy)
- Styling matching existing debug aesthetic (monospace font, dark theme)
- Help text for modifier keys (Option on Mac, Alt on Windows)
- Accessibility: Focus management for keyboard navigation

## Exclusions

- Future timeline keystrokes (will be added in Timeline Keystrokes Integration)
- Advanced keystroke management features (filtering, categories)
- Persistent user preferences

## Implementation Details

Create a new `KeystrokeOverlay` class in `packages/outside-client/src/debug/keystrokeOverlay.ts` following the pattern of `ConnectionOverlay`. The class will handle DOM element creation, styling, show/hide logic, and keyboard event listeners. Register the "?" handler in `KeyboardHandler` with proper event prevention to avoid browser conflicts.

## Related Pitches

- **Next**: [Timeline Engine Core (Timeline series: 2)](../pitches/timeline-engine-core.md)
- **Depends on**: None (foundational feature)

## Prerequisites

None - this establishes the keystroke documentation foundation for all future features.

## Next Logical Pitches

- [Timeline Engine Core (Timeline series: 2)](../pitches/timeline-engine-core.md)

## Open Questions

None

## Timeline Series Context

This is the first deliverable in the Timeline Controls series. It establishes the modifier key pattern and keystroke documentation infrastructure that will be used by all subsequent timeline features.
