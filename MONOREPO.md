# Monorepo Architecture Guide

This document explains the monorepo structure for AI agents and developers.

## Overview

This is a **pnpm workspace monorepo** managed by **Turborepo**. All projects share:

- Single `node_modules` at root (with workspace hoisting)
- Shared TypeScript configuration patterns
- Unified build and dev scripts
- Cross-package dependencies via workspace protocol

## Project Structure

```
outside/
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # Workspace definition
├── turbo.json                # Turborepo pipeline config
├── .gitignore                # Git ignore rules
├── .cursorignore            # AI context reduction
│
├── outside-core/            # 🎯 SHARED CODE - Core game logic
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts
│
├── outside-client/          # 🖥️ CLIENT - Frontend application
│   └── package.json
│
├── outside-server/          # 🖥️ SERVER - Backend application
│   └── package.json
│
├── outside-design/          # 🎨 DESIGN - UI components & design system
│   └── package.json
│
└── outside-doc/             # 📚 DOCS - Documentation
    └── package.json
```

## Package Dependencies

### Dependency Flow

```
outside-core (no dependencies on other packages)
    ↑
    ├── outside-client depends on @outside/core
    ├── outside-server depends on @outside/core
    └── outside-design depends on @outside/core
```

### Workspace Protocol

Packages reference each other using `workspace:*`:

```json
{
  "dependencies": {
    "@outside/core": "workspace:*"
  }
}
```

## Working with Projects

### Single Project Context

When working on a specific project, focus on:

- That project's `package.json` and scripts
- That project's source code
- Dependencies it declares (including `@outside/core`)

### Cross-Project Changes

- Changes to `@outside/core` affect all dependent packages
- Use `pnpm build` to rebuild dependencies
- Turborepo handles dependency ordering automatically

## Common Commands

```bash
# Install all dependencies
pnpm install

# Run all projects
pnpm dev

# Run specific project
pnpm --filter @outside/client dev

# Build all (with dependency ordering)
pnpm build

# Build specific project
pnpm --filter @outside/core build
```

## AI Context Optimization

The `.cursorignore` file excludes:

- `node_modules/` - Reduces context size
- Build outputs (`dist/`, `build/`, etc.)
- Lock files
- Logs

When working on a project:

1. Focus on that project's directory
2. Reference `@outside/core` as a dependency (don't need full source)
3. Use project-specific `package.json` for scripts and deps

## Git Workflow

- **Single repository** - All projects in one repo
- **Single commit** - Can commit changes across projects together
- **Branch strategy** - Use feature branches for cross-project features
- **CI/CD** - Turborepo can run tasks in parallel with caching

## Adding a New Package

1. Create folder: `outside-<name>/`
2. Add `package.json` with name `@outside/<name>`
3. Add to workspace (already matches `outside-*` pattern)
4. Run `pnpm install` to link workspace packages
5. Update `turbo.json` if new task types needed

## Best Practices

1. **Shared code** → `@outside/core`
2. **Project-specific** → Keep in that project
3. **Dependencies** → Declare in project's `package.json`
4. **Scripts** → Use Turborepo pipeline for orchestration
5. **Types** → Share via `@outside/core` exports
