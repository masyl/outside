---
Title: Timeline Storybook Integration
DeliveryDate: 2026-01-23
Summary: Add the timeline component to storybook in order to rebuild it using PixiUI components.
Status: TODO
Slug: timeline-storybook-integration
---

# Timeline Storybook Integration

**Deliverable**: Timeline Storybook Integration  
**Date**: 2026-01-23  
**Status**: TODO

## Summary

This deliverable stages the Timeline component in Storybook as a standalone component using Pixi-React conventions. The component will be isolated from the full application context, allowing for independent development and testing. Additionally, this deliverable provides recommendations for using PixiUI Slider to improve drag handling instead of relying on direct window event listeners.

## Files

- [plan.md](./plan.md) - Detailed implementation plan
- Delivered report (to be written): `delivered.md`

## Objectives

### Part 1: Storybook Integration

- Create a mock TimelineManager for Storybook testing
- Integrate Timeline component with Storybook using Pixi-React conventions
- Set up proper Pixi Application context in Storybook
- Create multiple story variants with interactive controls
- Enable standalone component development and testing

### Part 2: PixiUI Slider Recommendation

- Analyze current drag handling implementation
- Research PixiUI Slider API and integration patterns
- Provide detailed recommendations for replacing window event listeners
- Document migration path and implementation considerations

## Dependencies

- Timeline component (`outside-client/src/components/Timeline.tsx`) ✅
- TimelineManager (`outside-client/src/timeline/manager.ts`) ✅
- Storybook setup (`outside-storybook/`) ✅
- Pixi-React setup (`outside-client/src/pixi-setup.ts`) ✅
- @pixi/ui library ✅
