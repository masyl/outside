Implement timeline engine core

Add core timeline engine for time navigation through event history with state caching and event limit enforcement.

- Created TimelineManager class with time navigation methods
- Enhanced event logging with step tracking and original value storage
- Implemented state reconstruction from event history
- Added 10,000 step limit with event collapse logic
- Added end state caching for quick navigation return
- Integrated TimelineManager with Store and EventLogger
- Created PlaybackState enum and timeline types

This provides foundational timeline infrastructure for all time travel features, supporting efficient navigation, state reconstruction, and memory management.
