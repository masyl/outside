Implement timeline network synchronization

Add network synchronization for timeline features, enabling clients to follow host's timeline navigation.

- Added broadcastTimelineUpdate method to HostMode
- Added timeline position broadcasting to all clients
- Created ClientTimelineOverlay with 20% black background
- Added "Time travelling..." notice to client overlay
- Implemented client timeline update handler
- Added client timeline bar mirroring host's position
- Clients reconstruct state from their own event history
- Connected timeline components to ClientMode
- Restricted timeline controls to host mode only

This completes the Timeline Controls series, enabling multiplayer support for all time travel features with clients following host's timeline navigation.
