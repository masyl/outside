feat(timeline): complete keystrokes integration with UI improvements

Add keyboard interface for all timeline controls using modifier key pattern.

Timeline Keystrokes:
- Alt+Space: Toggle play/pause
- Alt+Up/Down: Step forward/backward (inverted: Up=forward)
- Alt+Left/Right: Scrub timeline (1 second = 8 steps)
- Alt+Home: Jump to LevelStart (time travel to post-init)
- Alt+End: Jump to end of timeline

Debug Controls:
- Alt+R: Full reset (clears events, reinitializes level)
- Alt+F: Freeze/Unfreeze bot autonomy
- Alt+D: Toggle debug panel visibility

Additional Improvements:
- Mac compatibility fixes (event.code for Alt+R/F/Home/End/D)
- Debug panel enhancements (Minecraft font, 16px, title, Alt+D toggle)
- Bot creation fixes (invisible until placed, optional position)
- LevelStart tagging system for time travel
- Reset vs Time Travel distinction (Alt+R vs Alt+Home)
- Improved keystroke help menu readability
- Scrubbing changed to 1 second (8 steps) from 50 steps

Technical:
- Added Position null checks in KeyboardHandler
- Updated tests for optional bot positions
- Removed DebugMenu component
- All 139 tests passing

This completes local/host mode timeline experience with improved UX and Mac compatibility.

Tags: timeline-keystrokes-integration
Related: timeline-playback-controls
