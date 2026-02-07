---
Title: Bot Autonomy
DeliveryDate: 2026-01-09
Summary: Implemented seeded, autonomous movement for bots. Bots now randomly explore the map (or wait) based on a deterministic random number generator. The master seed is persisted in the world state, ensuring consistent behavior across reloads. Also includes fixes for legacy save states and console log cleanup.
Status: DONE
Branch:
Commit:
---

# Bot Autonomy

Implemented basic autonomous behavior for bots, allowing them to move randomly without player input. This system is deterministic, powered by a seeded random number generator (LCG) derived from a persistent master seed in the world state.

Bots now randomly decide to move (up/down/left/right) or wait each turn. The master seed is stored in WorldState and persisted/restored with game saves, ensuring consistent behavior across reloads. The system includes logic to auto-generate seeds for old save states that lacked them, and basic conflict resolution to prevent command queue backup.

[View full plan →](./plan.md)
