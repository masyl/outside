---
title: 'Remove Legacy Animations'
delivery_date: '2026-01-23'
status: 'completed'
type: 'delivery'
related_issues: []
---

# Remove Legacy Animations

## Overview

Remove the problematic animation loop for bots and implement direct position updates without smooth transitions.

## Documents

- [Implementation Plan](./plan.md)

## Summary

✅ **Successfully removed legacy animation system** and replaced with direct position updates:

### Changes Made

- **Removed AnimationController** - eliminated complex animation state management
- **Removed animation loops** - cleaned up renderer and game loop animation code
- **Updated object positioning** - direct sprite position updates in `objects.ts`
- **Maintained coordinate system** - full compatibility with new coordinate system

### Results

- **Simplified codebase** - removed 200+ lines of complex animation logic
- **Eliminated weird behaviors** - no more animation edge cases or timing issues
- **Improved performance** - removed animation frame overhead
- **All tests pass** - maintained 100% test compatibility
- **Build success** - clean compilation without errors

### Migration Notes

Future animation system should:

- Integrate properly with coordinate system from the start
- Use modern animation patterns with clean separation of concerns
- Consider using the existing motion.dev library for camera animations as a model
