# Implementation Plan: Adding Storybook to the project for component testing

## Overview

This implementation plan details the step-by-step approach to add Storybook as a separate workspace package in the monorepo. The key architectural decision is to use commands for all state manipulation, including world size configuration, following the existing game's command-driven architecture.

## Architectural Principles

1. **Command-Driven State**: All state initialization and modifications must use commands
2. **Natural World Creation**: Grid instantiation follows the natural world creation process
3. **Separation of Concerns**: Storybook wrappers never bleed into game code
4. **Deterministic Stories**: Use commands and seeds for reproducible states

## Phase 1: Workspace Setup

### Checklist

- [x] Create `outside-storybook` workspace package
- [x] Configure `package.json` with Storybook dependencies
- [x] Add Storybook scripts (`storybook`, `build-storybook`)
- [x] Update monorepo configuration for new workspace (covered by `outside-*`)
- [x] Configure `turbo.json` with Storybook tasks
- [x] Add `tsconfig.json` and `tsconfig.node.json`

## Phase 2: Command System Extensions

### Checklist

- [x] Add `set-world-size` command to parser
- [x] Add `set-seed` command to parser
- [x] Add `reset-world` command to parser
- [x] Add new actions for world configuration
- [x] Add reducer cases for new commands
- [x] Ensure grid rebuild happens via commands only

### Reference Commands

- `set-world-size <width> <height>` - Configure world dimensions
- `set-seed <seed>` - Set deterministic seed
- `reset-world` - Create fresh world with current settings

## Phase 3: DOM/Canvas Wrapper Architecture

### Checklist

- [x] Implement `PixiContainerWrapper` (isolated PIXI application)
- [x] Implement `StoreWrapper` (command-driven initialization)
- [ ] Implement `CommandExecutionWrapper` (sequenced commands)

## Phase 4: Asset Management

### Checklist

- [ ] Create Storybook asset loader singleton
- [ ] Add graceful fallback rendering
- [ ] Add global asset-loading decorator
- [ ] Document asset usage conventions

## Phase 5: Component Stories Implementation

### Checklist

- [ ] Debug overlay stories (default + variants)
- [ ] Debug menu stories (controls + interactions)
- [ ] Connection overlay stories (status variants)
- [ ] Bot sprite stories (directions, selection, animations)
- [ ] Terrain stories (types + combinations)
- [x] World configuration examples (small grids)
- [ ] Interactive command sequences (movement, placement)

## Phase 6: Development Workflow

### Checklist

- [ ] Add “how to run Storybook” instructions
- [ ] Add story creation templates
- [ ] Document command-driven story setup
- [ ] Add best practices for assets and performance

## Implementation Details

### Command-Driven Architecture

All story setups will use command sequences like:

```typescript
const setupCommands = [
  'set-world-size 10 5',
  'set-seed 12345',
  'create bot testbot',
  'create terrain grass ground 0 0 10 5',
  'place testbot 5 2',
];
```

### Story Structure Pattern

```typescript
// Each story follows this pattern
<StoreWrapper initialCommands={setupCommands}>
  {(store) => (
    <CommandExecutionWrapper store={store} commands={interactionCommands}>
      <PixiContainerWrapper width={640} height={320}>
        {(app) => renderComponents(app, store)}
      </PixiContainerWrapper>
    </CommandExecutionWrapper>
  )}
</StoreWrapper>
```

### File Organization

```
outside-storybook/
├── .storybook/
│   ├── main.ts
│   ├── preview.ts
│   └── decorators/
├── src/
│   ├── components/
│   │   ├── wrappers/
│   │   └── stories/
│   └── assets/
└── docs/
    └── workflow.md
```

## Success Metrics

- All stories use command-driven initialization
- No artificial state mocking
- Clean separation between Storybook and game code
- Reproducible story states
- Component coverage > 90%

## Next Steps After Implementation

1. Automated visual regression testing
2. Component library documentation website
3. Design system establishment
4. Performance monitoring integration
