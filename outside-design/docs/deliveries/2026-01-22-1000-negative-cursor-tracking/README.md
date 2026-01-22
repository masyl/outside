---
title: Negative Coordinate Cursor Tracking
date: 2026-01-22
description: Allow the visual debug cursor to render in negative world coordinates.
tags: [debug, cursor-tracking, delivery/2026-01-22-1000-negative-cursor-tracking]
status: Done
---

# Negative Coordinate Cursor Tracking

Completion Date: 2026-01-22 10:00
Branch: [improved-level-boundaries](https://github.com/masyl/outside/tree/improved-level-boundaries)
Tag: [delivery/2026-01-22-1000-negative-cursor-tracking](https://github.com/masyl/outside/releases/tag/delivery/2026-01-22-1000-negative-cursor-tracking)

When the world center moved to (0, 0), the debug cursor stopped rendering in negative coordinates. This delivery replaces the negative guard with an explicit unset state so cursor visuals remain visible across the full coordinate space.

## Summary

- Debug cursor now renders in negative world coordinates.
- Mouse tracking uses a nullable sentinel instead of negative guards.
- Delivery documentation includes pitch, plan, and reports.

## Documents

- [Pitch](./pitch.md)
- [Plan](./plan.md)
- [Delivery Report](./delivered.md)
- [Testing Report](./testing.md)
- [Commit Preparation](./commit.md)
