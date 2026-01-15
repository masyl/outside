# Implementation Plan: Adding Storybook to the project for component testing

## Overview

This implementation plan details the step-by-step approach to add Storybook as a separate workspace package in the monorepo. The key architectural decision is to use commands for all state manipulation, including world size configuration, following the existing game's command-driven architecture.

## Architectural Principles

1. **Command-Driven State**: All state initialization and modifications must use commands
2. **Natural World Creation**: Grid instantiation follows the natural world creation process
3. **Separation of Concerns**: Storybook wrappers never bleed into game code
4. **Deterministic Stories**: Use commands and seeds for reproducible states

## Phase 1: Workspace Setup (Day 1)

### 1.1 Create Storybook Package

- Create `outside-storybook` workspace package
- Configure package.json with Storybook dependencies
- Update monorepo configuration for new workspace
- Configure turbo.json with Storybook tasks

### 1.2 Basic Storybook Configuration

- Set up Storybook with Vite preset
- Configure TypeScript integration
- Set up essential addons (essentials, interactions, docs)

## Phase 2: Command System Extensions (Day 1-2)

### 2.1 New Commands for World Configuration

```typescript
// Add to command parser
| { type: 'set-world-size'; width: number; height: number }

// Add to command handlers
function handleSetWorldSize(state: WorldState, action: SetWorldSizeAction): WorldState {
  return {
    ...state,
    width: action.width,
    height: action.height,
    grid: createGrid(action.width, action.height)
  };
}
```

### 2.2 World Creation Commands

- `set-world-size <width> <height>` - Configure world dimensions
- `set-seed <seed>` - Set deterministic seed
- `reset-world` - Create fresh world with current settings

## Phase 3: DOM Wrapper Architecture (Day 2-3)

### 3.1 PIXI.js Container Wrapper

```typescript
// Creates isolated PIXI.js application for each story
interface PixiContainerWrapperProps {
  children: (app: Application) => void;
  width?: number;
  height?: number;
  backgroundColor?: number;
}
```

### 3.2 Store Integration Wrapper

```typescript
// Manages game store with command-driven state
interface StoreWrapperProps {
  children: (store: Store) => ReactNode;
  initialCommands?: string[];
}
```

### 3.3 Command Execution Wrapper

```typescript
// Executes commands sequentially with optional delays
interface CommandExecutionWrapperProps {
  store: Store;
  commands: string[];
  delay?: number;
  children: ReactNode;
}
```

## Phase 4: Asset Management (Day 3)

### 4.1 Storybook Asset Manager

- Singleton pattern for asset loading
- Graceful fallback to placeholder rendering
- Integration with existing PIXI.js asset system

### 4.2 Asset Loading Decorator

- Global decorator for asset preloading
- Loading states and error handling
- Performance optimization for story switching

## Phase 5: Component Stories Implementation (Day 3-5)

### 5.1 Debug Components (DOM-based)

- DebugOverlay stories with various stats
- DebugMenu interaction stories
- ConnectionOverlay status variations

### 5.2 Game Components (PIXI.js-based)

- Bot sprite stories (directions, states, animations)
- Terrain component stories (all types, combinations)
- World configuration examples

### 5.3 Interactive Stories

- Command execution sequences
- Bot movement demonstrations
- Terrain placement scenarios

## Phase 6: Development Workflow (Day 5)

### 6.1 Story Creation Templates

- Bot component story template
- Terrain component story template
- Interactive scenario template

### 6.2 Documentation

- Developer workflow guide
- Story creation best practices
- Asset usage guidelines

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

## Timeline

- **Day 1**: Workspace setup, command extensions, basic configuration
- **Day 2-3**: DOM wrapper architecture, asset management
- **Day 3-5**: Component stories implementation
- **Day 5**: Documentation and workflow finalization

## Next Steps After Implementation

1. Automated visual regression testing
2. Component library documentation website
3. Design system establishment
4. Performance monitoring integration
