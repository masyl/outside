Implement timeline keystrokes integration

Add keyboard interface for all timeline controls using modifier key pattern.

- Added Option/Alt + Space handler for play/pause toggle
- Added Option/Alt + Up/Down handlers for step-by-step navigation
- Added Option/Alt + Left/Right handlers for timeline scrubbing (50 steps)
- Added Option/Alt + Home/End handlers for jumping to start/end
- Implemented helper methods for all timeline keystrokes
- Added component properties to KeyboardHandler (TimelineManager, GameLoop, HostMode)
- Mapped existing debug keystrokes to modifier pattern
- Updated keystroke help menu with all timeline controls
- Restricted timeline keystrokes to host mode only

This completes local/host mode timeline experience, providing intuitive keyboard control for all time travel features.
