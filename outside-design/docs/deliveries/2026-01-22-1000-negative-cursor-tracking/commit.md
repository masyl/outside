Fix debug cursor tracking in negative coordinates

Allow the visual debug cursor to render when the mouse moves into negative world space by switching from a negative-value guard to an explicit unset state.

- Store mouse position as nullable until the first pointer move
- Render cursor visuals and labels for negative grid positions
- Document the pitch, plan, and delivery reports

Tags: delivery/2026-01-22-1000-negative-cursor-tracking
