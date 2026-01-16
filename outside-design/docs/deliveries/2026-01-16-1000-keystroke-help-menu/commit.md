Implement keystroke help menu

Add DOM-based help overlay displaying all available keyboard shortcuts with toggle functionality.

- Created KeystrokeOverlay class for help menu UI
- Added "?" key handler to toggle overlay visibility
- Added ESC key handler to dismiss overlay
- Documented all existing keystrokes in table format
- Established modifier key pattern (Option/Alt) for advanced controls
- Styled overlay to match debug aesthetic
- Added to KeyboardHandler for easy access

This provides a central reference for all game shortcuts and establishes the pattern that will be used by timeline controls keystrokes.
