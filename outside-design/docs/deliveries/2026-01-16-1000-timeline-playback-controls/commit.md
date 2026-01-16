Implement playback controls and game loop integration

Integrate Timeline Manager with Game Loop to support pause/resume, step-by-step execution, and playback state management.

- Added pause/resume/step methods to Game Loop
- Implemented playback state tracking (PLAYING, PAUSED, TRAVELING)
- Added bot autonomy control based on playback state
- Modified Host Mode to sync with playback state
- Implemented event queue clearing for timeline mode
- Added step-by-step execution for debugging
- Connected Timeline Manager with Game Loop and Host Mode

This enables users to control game playback state and step through time, providing foundation for timeline UI and keystrokes.
