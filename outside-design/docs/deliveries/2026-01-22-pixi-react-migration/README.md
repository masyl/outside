---
Title: PixiJS React Migration
DeliveryDate: 2026-01-22
Summary: Migrated imperative PixiJS UI components (DebugPanel, KeystrokeHelp, Timeline) to React using @pixi/react. Introduced React infrastructure with GameRoot.tsx component and preserved performance by keeping GameRenderer imperative.
Status: DONE
Branch: refactor/pixi-react
---

# PixiJS React Migration

## Overview

Migrated the application's UI layer from imperative PixiJS code to declarative React components using `@pixi/react`. This migration improves code organization, state management, and UI composition while maintaining game performance.

## What Was Delivered

### Infrastructure

- **GameRoot.tsx**: Main React entry point component
- **pixi-setup.ts**: PixiJS type extensions for React compatibility
- **React integration**: Enabled JSX in tsconfig.json, installed React v19 and @pixi/react v8

### Component Migrations

1. **DebugPanel**: Migrated from HTML-based DebugOverlay to Pixi-based React component
   - Uses React state management (`debugStore.ts`)
   - Static bridge interface (`debugBridge.ts`) for imperative code integration
   - Renders stats using Pixi graphics and text components

2. **KeystrokeHelp**: Migrated from HTML overlay to React component
   - State management via `keystrokeStore.ts`
   - Static bridge interface (`keystrokeBridge.ts`)
   - Renders keyboard shortcuts using Pixi components

3. **Timeline**: Migrated from imperative TimelineBar to declarative React component
   - React state for position and playback state
   - Interactive timeline with drag-to-scrub functionality
   - Proper prop passing through component hierarchy

### Performance Strategy

- **LevelViewport.tsx**: Wraps the imperative `GameRenderer` class
  - Rendering loop runs outside React's render cycle
  - React handles app initialization and UI overlay management
  - Preserved existing performance characteristics

## Files Changed

### New Files

- `src/components/GameRoot.tsx`
- `src/components/LevelViewport.tsx`
- `src/components/DebugPanel.tsx`
- `src/components/KeystrokeHelp.tsx`
- `src/components/Timeline.tsx`
- `src/hooks/useStore.ts`
- `src/debug/debugStore.ts`
- `src/debug/debugBridge.ts`
- `src/debug/keystrokeStore.ts`
- `src/debug/keystrokeBridge.ts`
- `src/pixi-setup.ts`
- `src/pixi-react.d.ts`

### Modified Files

- `src/main.ts`: Integrated React root and component rendering
- `src/input/keyboardHandler.ts`: Updated for React bridge integration
- `src/renderer/visualDebugLayer.ts`: Reduced console spam

### Deleted Files

- `src/debug/overlay.ts` (replaced by DebugPanel)
- `src/debug/keystrokeOverlay.ts` (replaced by KeystrokeHelp)
- `src/ui/timelineBar.ts` (replaced by Timeline)

## Bug Fixes

1. **React version mismatch**: Upgraded from v18 to v19 for compatibility with @pixi/react v8
2. **@pixi/react intrinsic elements**: Fixed type errors for Pixi components
3. **GameRoot initialization**: Added proper hook usage for app instance
4. **Timeline integration**: Fixed prop passing chain (main.ts → GameRoot → Timeline)
5. **Console spam**: Reduced noisy logging in debug components
6. **Bot autonomy crash**: Added guard for missing bot positions

## Testing

- All 151 tests passing
- Build successful with TypeScript compilation
- No lint errors

## Technical Decisions

### Why Keep GameRenderer Imperative?

The `GameRenderer` handles:

- Asset loading and caching
- Complex sprite animations
- Camera interpolation
- Performance-critical rendering loop

Keeping it imperative ensures:

- 60 FPS performance maintained
- No unnecessary React re-renders
- Minimal refactoring of existing logic

### Why Use Static Bridges?

Static bridges (`debugBridge.ts`, `keystrokeBridge.ts`) provide:

- Clean separation between imperative and React code
- Type-safe communication layer
- No need for full rewrite of imperative systems

## Future Considerations

Potential future improvements:

- Extract `GameRenderer` logic into custom hooks for gradual migration
- Implement React Context for deeper component integration
- Consider Zustand or Jotai for complex state management
- Add Storybook stories for new React components

## Dependencies Added

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@pixi/react": "^8.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.9",
    "@types/react-dom": "^19.2.9"
  }
}
```
