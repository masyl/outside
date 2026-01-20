---
Title: Debug Overlay Object Counts
DeliveryDate: 2026-01-09
Summary: "Updated the Debug Overlay to display separate counts for Surface objects (bots) and Ground objects (terrain). Resolved an issue where object counts were inaccurate. The overlay now displays Objects: X (Surf) / Y (Gnd)."
Status: DONE
Branch: 
Commit: 
---

# Debug Overlay Object Counts

Updated the Debug Overlay to differentiate between Surface objects (bots, items) and Ground objects (terrain). This addresses a bug where terrain objects were missing from the total object count, providing a more accurate view of the game state complexity.

The debug overlay now shows separate counts for Surface objects and Ground objects in the format `Objects: X (Surf) / Y (Gnd)`. This resolves the issue where object counts were inaccurate and provides better visibility into both the surface layer (bots/items) and ground layer (terrain) complexity.

[View full plan →](./plan.md)
