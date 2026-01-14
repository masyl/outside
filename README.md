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

- **outside-client/**: Client application code
- **outside-core/**: Core game logic and shared code
- **outside-design/**: Design system and UI components
- **outside-doc/**: Documentation
- **outside-server/**: Server/backend code

AI agents should respect these boundaries and only modify files within the appropriate project scope unless cross-project changes are explicitly required.

### AI Agent Workflow Integration

This monorepo follows trunk-based development workflow:

- Each project has clear boundaries for focused development
- Shared code is centralized in `outside-core`
- Projects can be developed independently or together
- File context optimization reduces unnecessary AI overhead
- Follows the branching workflow documented above

## AI/Cursor Context

This monorepo is optimized for AI-assisted development with clear project structure and workflow guidelines.
