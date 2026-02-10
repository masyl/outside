# Outside Game - Monorepo

A monorepo for the Outside game project, containing all tiers of the architecture.

## Structure

```
outside/
├── packages/outside-client/    # Client application
├── packages/outside-core/      # Core game logic and shared code
├── packages/outside-design/    # Design system and UI components
├── packages/outside-doc/       # Documentation
└── packages/outside-server/    # Server/backend
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Run all projects

```bash
pnpm dev
```

### Run a specific project

```bash
cd packages/outside-client && pnpm dev
# or
pnpm --filter outside-client dev
```

### Build all projects

```bash
pnpm build
```

### Build a specific project

```bash
pnpm --filter outside-core build
```

### Run tests

```bash
pnpm test
```

### Run tests with coverage

```bash
pnpm test:coverage
```

### Run tests for a specific project

```bash
cd packages/outside-core && pnpm test
# or
pnpm --filter outside-core test
```

## Available Scripts

- `pnpm dev` - Start all projects in development mode
- `pnpm build` - Build all projects
- `pnpm test` - Run tests for all projects
- `pnpm test:coverage` - Run tests with coverage reports
- `pnpm lint` - Lint all projects
- `pnpm clean` - Clean all build artifacts and node_modules
- `pnpm format` - Format code with Prettier

## Project-Specific Commands

Use `pnpm --filter <project-name> <command>` to run commands for specific projects:

```bash
# Example: Run dev server for client only
pnpm --filter outside-client dev

# Example: Build core only
pnpm --filter outside-core build
```

## Tech Stack

- **Package Manager**: pnpm (workspaces)
- **Build System**: Turborepo
- **Language**: TypeScript
- **Node.js**: >= 18.0.0
- **Testing**: Vitest with v8 coverage provider
- **Test Environment**: jsdom for browser API mocking

## Testing

### Test Framework

This project uses **Vitest** as the primary testing framework with the following features:

- **TypeScript Support**: Zero configuration for TypeScript projects
- **Monorepo Integration**: Parallel test execution across all packages via Turbo
- **Code Coverage**: v8 provider with configurable thresholds (80%+ for critical paths)
- **Browser Environment**: jsdom with Canvas API mocking for client-side tests
- **Fast Execution**: Core package tests run in under 1 second

### Test Structure

Each package includes its own test configuration and test files:

- **packages/outside-core/**: Core game logic and utilities tests (node environment)
- **packages/outside-client/**: Client application tests with browser API mocking
- **outside-\***: Other packages follow the same pattern

### Coverage Reports

Coverage reports are generated in multiple formats:

- Text output in terminal
- HTML reports for detailed viewing
- LCOV format for CI/CD integration

Coverage thresholds are enforced at 80%+ for statements, branches, functions, and lines.

## Component Testing

### Storybook

This project includes **Storybook** for component testing and documentation. Storybook enables isolated development and testing of UI components with real game states.

- **Pixi.js Integration**: Game components use Pixi.js rendering wrapped in React for testability
- **Command-Driven Testing**: Components are tested using the game's command system for deterministic states
- **Real Game Logic**: No artificial mocking - all test states are created through actual game commands

[**Storybook Documentation**](./packages/outside-design/docs/storybook.md) - Complete setup and development guide

### Development Workflow

1. Clone the repository
2. Run `pnpm install` to install all dependencies
3. Run `pnpm dev` to start all projects
4. Run `pnpm test` to execute the test suite
5. Each project can be developed independently or together
6. Check coverage with `pnpm test:coverage` before commits

## Git Workflow: Trunk-Based Development with Squash Merge

This project follows **Trunk-Based Development with Squash Merge** to enable frequent production deployments and maintain a clean git history.

### Core Principles

- **Main branch is always production-ready**: Every commit on `main` can be deployed
- **Short-lived feature branches**: Branches exist for hours/days, not weeks
- **Single commit per feature**: Use squash merge to collapse all work into one clean commit
- **Continuous integration**: All changes integrate frequently to minimize conflicts

### Branching Strategy

```
main (production-ready, auto-deployed)
├── feature/add-user-authentication
├── bugfix/login-validation-error
└── refactor/database-connection
```

### Workflow

1. **Start New Work**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Development**
   - Commit frequently with descriptive messages
   - Keep changes focused and atomic
   - Run tests and linting locally

3. **Merge to Main**
   - Create pull request targeting `main`
   - Ensure CI/CD checks pass
   - Use **Squash and Merge** to create single commit
   - Delete feature branch after merge

### Branch Naming

- `feature/feature-name` - New features
- `bugfix/issue-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `hotfix/critical-fix` - Production hotfixes

### Commit Guidelines

- Feature branches: Frequent, detailed commits
- Main branch: Clean, atomic commits via squash merge
- PR title should be the final commit message

### AI Agent Instructions

When working with AI agents (Cursor, GitHub Copilot, etc.):

**Starting New Work:**

- AI agents should always propose creating a new branch when starting a new feature or significant change
- Use the branch naming conventions above
- Example: "Would you like me to create a feature branch for this work?"

**Completing Work:**

- AI agents should propose a merge after completing the "wrapup" step
- Include a summary of changes and suggest PR title
- Example: "This feature is complete. Would you like me to create a pull request with squash merge?"

## Development Guidelines for AI Agents

### File Context Management

When working with this monorepo, focus on relevant files and exclude:

- `node_modules/` directories
- Build outputs: `dist/`, `build/`, `.next/`, `out/`, `.turbo/`, `coverage/`
- Lock files: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`
- Log files: `*.log`, `logs/`

This reduces AI context and improves response quality.

### Project Boundaries

- **packages/outside-client/**: Client application code
- **packages/outside-core/**: Core game logic and shared code
- **packages/outside-design/**: Design system and UI components
- **packages/outside-doc/**: Documentation
- **packages/outside-server/**: Server/backend code

AI agents should respect these boundaries and only modify files within the appropriate project scope unless cross-project changes are explicitly required.

### AI Agent Workflow Integration

This monorepo follows trunk-based development workflow:

- Each project has clear boundaries for focused development
- Shared code is centralized in `outside-core`
- Projects can be developed independently or together
- File context optimization reduces unnecessary AI overhead
- Follows the branching workflow documented above

### Design Process and Pitch Documentation

When proposing new features or system changes, AI agents should follow the documented design process:

- **Design Process Documentation**: See `packages/outside-design/docs/design-process/` for complete methodology
- **Pitch Phase**: See `packages/outside-design/docs/design-process/pitch-phase.md` for pitch format requirements
- **AI Agent Instructions**: See `packages/outside-design/docs/ai-agent-instructions.md` for detailed workflow guidance
- **Existing Pitches**: Reference `packages/outside-design/docs/pitches/` for format examples

AI agents must use the standard pitch template before implementing new features or system modifications.

## Testing Guidelines for AI Agents

When working with this codebase, AI agents should follow these testing practices:

### Writing Tests

- **Core Logic**: Test all utility functions and game logic with edge cases
- **Deterministic Behavior**: Use seeded random generators for reproducible tests
- **Browser APIs**: Mock Canvas, WebGL, and other browser APIs as needed
- **Coverage**: Maintain 80%+ coverage for new code
- **Performance**: Keep test execution fast (< 1 second for unit tests)

### Test Files Location

- Place test files alongside source files with `.test.ts` extension
- Example: `src/utils/random.test.ts` tests `src/utils/random.ts`
- Integration tests can be placed in `test/` directories

### Running Tests

Before committing changes:

1. Run `pnpm test` to ensure all tests pass
2. Run `pnpm test:coverage` to verify coverage
3. Fix any failing tests or coverage gaps
4. Commit with descriptive messages including test improvements

## AI/Cursor Context

This monorepo is optimized for AI-assisted development with clear project structure, comprehensive testing infrastructure, and workflow guidelines.

## AI Skills

Skills live in `skills/` and are synced into vendor-specific folders with `pnpm run sync:skills`. See [Skills Sync Setup](./docs/skills-symlinks.md).
