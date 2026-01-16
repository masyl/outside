# Storybook Component Testing

## Architecture Overview

### Pixi.js + React Integration

The **Outside** game uses Pixi.js as its rendering engine for high-performance 2D graphics. To enable component testing with Storybook, we wrap PIXI applications in React components. This approach allows us to:

- Test game components in isolation without running the full game
- Leverage Storybook's powerful development and documentation features
- Maintain the performance benefits of Pixi.js while gaining React's testability
- Create reproducible component states for consistent testing

The wrapping pattern isolates each PIXI application instance, preventing interference between stories while providing the full Pixi rendering capabilities within Storybook's React environment.

### Command-Driven Testing

All component testing uses a command-driven architecture. Commands are text-based instructions that modify game state deterministically. This approach provides:

- **Reproducible States**: Every story starts from a well-defined game state
- **No Artificial Mocking**: States are created through real game logic, not fake data
- **Deterministic Testing**: Same commands always produce the same result
- **Natural Workflow**: Tests follow the same patterns as actual gameplay

Commands enable Storybook to configure worlds, place objects, and set up scenarios exactly as they would occur in the actual game.

## How to Run Storybook

### Quick Start

```bash
# 1. Install dependencies (if not done)
pnpm install

# 2. Start Storybook
pnpm --filter outside-storybook storybook

# 3. Open browser to http://localhost:6007
```

### Available Commands

- **Start Storybook**: `pnpm --filter outside-storybook storybook` (port 6007)
- **Build Storybook**: `pnpm --filter outside-storybook build-storybook`
- **Dev Server**: `pnpm --filter outside-storybook dev` (Vite dev server on port 5173)

### Alternative Methods

```bash
# Navigate to directory first
cd outside-storybook
pnpm storybook
pnpm build-storybook
```

## Command Pattern

### Available Commands

| Command                                               | Description                                    | Example                                |
| ----------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `create bot <id>`                                     | Creates a new bot object                       | `create bot testbot`                   |
| `create terrain <type> <id> <x> <y> <width> <height>` | Creates terrain objects                        | `create terrain grass ground 0 0 10 5` |
| `place <id> <x> <y>`                                  | Places an object at specific coordinates       | `place testbot 5 2`                    |
| `move <id> <direction> <distance>`                    | Moves objects in cardinal directions           | `move testbot north 3`                 |
| `set-world-size <width> <height>`                     | Configures world dimensions                    | `set-world-size 10 5`                  |
| `set-seed <seed>`                                     | Sets deterministic seed for reproducible state | `set-seed 12345`                       |
| `reset-world`                                         | Creates fresh world with current settings      | `reset-world`                          |

### Usage in Stories

Stories use `initialCommands` arrays to configure test scenarios:

```typescript
const setupCommands = [
  'set-world-size 10 5',
  'set-seed 12345',
  'create bot testbot',
  'create terrain grass ground 0 0 10 5',
  'place testbot 5 2',
];
```

This command sequence creates a deterministic world state that can be reliably tested and documented.

## File Structure

```
outside-storybook/
├── .storybook/
│   ├── main.ts          # Main Storybook configuration
│   ├── preview.ts       # Global decorators and parameters
│   └── decorators/      # Custom decorators
├── src/
│   ├── components/
│   │   └── wrappers/    # React wrappers for PIXI applications
│   │       ├── StoreWrapper.tsx
│   │       ├── PixiContainerWrapper.tsx
│   │       └── CommandExecutionWrapper.tsx
│   └── stories/         # Component stories
└── vite.config.ts       # Vite configuration
```

## Development Workflow

### Creating New Stories

1. **Define Command Sequence**: Use `initialCommands` to set up the initial state
2. **Wrap Components**: Use the provided wrapper components for proper isolation
3. **Ensure Determinism**: Always include `set-seed` for reproducible results
4. **Test Interactions**: Use `CommandExecutionWrapper` for interactive stories

### Best Practices

- Always use commands for state initialization - never artificial mocking
- Include seeds for deterministic behavior in random processes
- Test components with various world sizes and configurations
- Keep stories focused on specific components or interactions
- Use wrapper components to maintain clean separation between Storybook and game code

This architecture ensures that all component tests reflect real game behavior while providing the development productivity of modern React testing tools.
