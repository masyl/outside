feat(timeline): implement playback controls and game loop integration

- Added `PlaybackState` management (PLAYING, PAUSED, TRAVELING) to GameLoop, HostMode, and TimelineManager.
- Implemented `pause()`, `resume()`, and `step()` methods in GameLoop for fine-grained execution control.
- Integrated Bot Autonomy with playback state: bots now pause automatically during time travel.
- Enforced Event Queue isolation: new events are ignored during historical navigation to prevent state corruption.
- Stabilized Test Infrastructure: Configured Vitest for process isolation and suppressed console noise.
- Fixed Build Pipeline: Resolved Storybook entry point issues and documentation dead links.

This delivery fulfills the "Timeline Playback Controls" pitch, enabling time travel debugging and pause capabilities.

Ref: [pitch](../../pitches/timeline-playback-controls.md)
Ref: [plan](./plan.md)
