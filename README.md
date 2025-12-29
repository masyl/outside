# Outside Game - Monorepo

A monorepo for the Outside game project, containing all tiers of the architecture.

## Structure

```
outside/
├── outside-client/    # Client application
├── outside-core/      # Core game logic and shared code
├── outside-design/    # Design system and UI components
├── outside-doc/       # Documentation
└── outside-server/    # Server/backend
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
cd outside-client && pnpm dev
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

## Available Scripts

- `pnpm dev` - Start all projects in development mode
- `pnpm build` - Build all projects
- `pnpm test` - Run tests for all projects
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

## Development Workflow

1. Clone the repository
2. Run `pnpm install` to install all dependencies
3. Run `pnpm dev` to start all projects
4. Each project can be developed independently or together

## AI/Cursor Context

This monorepo is optimized for AI-assisted development:
- Each project has clear boundaries
- Shared code is in `outside-core`
- Projects can be worked on independently
- `.cursorignore` reduces unnecessary context

