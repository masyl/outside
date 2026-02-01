# Agent Instructions

This document contains the core instructions for the AI agent working on this project.

## Agent Identity

- Name: Robi
- When user says "hi!", introduce yourself

## Design Process

Before implementing new features or system changes, consult the design process documentation at:

- [AI Agent Instructions](outside-design/docs/ai-agent-instructions.md)

## Pitches

Non trivial work typically starts by writing a pitch, before writing an implementation plan.

- [Design Process - Pitch Phase](outside-design/docs/design-process/pitch-phase.md)
- Find examples in the [Pitches Directory](outside-design/docs/pitches/)


## Build Commands

### Root Level Commands

```bash
# Development - Start all projects
pnpm dev

# Build all projects (with dependency ordering)
pnpm build

# Test all projects
pnpm test

# Test with coverage
pnpm test:coverage

# Format all code
pnpm format

# Clean all build artifacts
pnpm clean

# Lint (currently not configured)
pnpm lint
```

### Single Package Commands

```bash
# Run specific package commands
pnpm --filter outside-client dev
pnpm --filter outside-core build
pnpm --filter @outside/client test

# Change to package directory
cd outside-client && pnpm dev
```

### Test Commands - Single Tests

```bash
# Run specific test file
pnpm --filter outside-core test random.test.ts

# Run tests with pattern
pnpm --filter outside-client test --reporter=verbose

# Watch mode for single package
pnpm --filter outside-core test --watch
```

## Code Style Guidelines

### TypeScript Configuration

- **Strict Mode**: Enabled in all packages
- **Target**: ES2022 with ESNext modules (except server: CommonJS)
- **Module Resolution**: bundler (node for server)
- **Imports**: Use explicit imports, avoid wildcards
- **Exports**: Named exports preferred, default exports for main types

### Naming Conventions

- **Types/Interfaces**: PascalCase (`Position`, `GameObject`)
- **Functions/Variables**: camelCase (`createWorldState`, `isValidPosition`)
- **Constants**: UPPER_SNAKE_CASE (`COORDINATE_SYSTEM`, `DISPLAY_TILE_SIZE`)
- **Files**: kebab-case (`coordinate-system.ts`, `world-edge-cases.test.ts`)
- **Test Files**: `.test.ts` suffix alongside source files

### Import Organization

```typescript
// External dependencies first
import { describe, it, expect } from 'vitest';
import { Container, Graphics } from 'pixi.js';

// Internal dependencies second
import { Random } from './random';
import { Position, GameObject } from './types';
import { createWorldState } from './world';
```

### Code Patterns

- **Constants**: Use `as const` for immutable objects
- **Error Handling**: Graceful handling with early returns, avoid throwing for expected cases
- **Functions**: Pure functions preferred, clear input/output types
- **Objects**: Interface definitions for all complex data structures
- **Arrays**: Use typed arrays with explicit element types

### Documentation Style

```typescript
/**
 * Brief description of the function
 *
 * @param paramName - Description of parameter
 * @returns Description of return value
 * @example
 * const world = createWorldState(42);
 */
export function createWorldState(seed?: number): WorldState {
```

### Testing Patterns

```typescript
describe('Feature Being Tested', () => {
  let world: ReturnType<typeof createWorldState>;

  beforeEach(() => {
    world = createWorldState(42);
  });

  describe('Specific Functionality', () => {
    it('should do expected behavior', () => {
      // Arrange
      const input = setupData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Formatting Rules (Prettier)

- **Semicolons**: Required
- **Quotes**: Single quotes
- **Indentation**: 2 spaces (no tabs)
- **Line Width**: 100 characters
- **Trailing Commas**: ES5 compatible

### Error Handling Guidelines

- **Expected Cases**: Return early with default/null values
- **Exceptional Cases**: Throw descriptive errors
- **Validation**: Use TypeScript types for compile-time safety
- **Logging**: Avoid console.log in production code

### Project Boundaries

- **outside-core**: Shared logic, no UI/framework dependencies
- **outside-client**: Pixi.js rendering, Vite build system
- **outside-server**: Express.js, CommonJS modules
- **outside-design**: VitePress, Vue components
- **outside-storybook**: React/Storybook testing

### Testing Requirements

- **Coverage**: 80%+ threshold enforced (statements, branches, functions, lines)
- **Environment**: jsdom for client tests, node for server
- **Mocking**: Canvas/WebGL APIs mocked in test/setup.ts
- **Performance**: Unit tests should run in under 1 second

### Development Workflow

1. Install dependencies: `pnpm install`
2. Run tests before committing: `pnpm test && pnpm test:coverage`
3. Format code: `pnpm format`
4. Build all: `pnpm build`
5. Use feature branches for significant changes

### Git Integration

- **Branch Strategy**: Trunk-based development with squash merge
- **Commit Messages**: Feature branches: detailed, Main: atomic via squash
- **AI Agents**: Should propose branches for new features and PRs for completion
