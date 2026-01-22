# Agent Skills Index

This directory contains Agent skills that implement the Outside project's development workflows.

## Skill Categories

### Wrapup Process Skills

The following skills implement the 9-step wrapup process documented in `/outside-design/docs/wrapup.md`:

#### Core Wrapup Skills

1. **[wrapup-prerequisites](./wrapup-prerequisites.skill)** - Validates pre-requisites before starting wrapup
2. **[wrapup-folder-setup](./wrapup-folder-setup.skill)** - Creates delivery folder structure
3. **[plan-update](./plan-update.skill)** - Updates implementation plan to reflect reality
4. **[testing-report](./testing-report.skill)** - Generates comprehensive testing report
5. **[delivery-summary](./delivery-summary.skill)** - Creates detailed delivery report
6. **[pitch-relocation](./pitch-relocation.skill)** - Copies original pitch to delivery folder
7. **[commit-preparation](./commit-preparation.skill)** - Prepares commit message and tags
8. **[delivery-readme](./delivery-readme.skill)** - Creates README.md with frontmatter
9. **[delivery-index-update](./delivery-index-update.skill)** - Updates deliveries list index

#### Workflow Skills

10. **[wrapup-workflow](./wrapup-workflow.skill)** - Complete 9-step wrapup workflow that orchestrates all skills

## Usage Patterns

### Complete Wrapup Workflow

Use `wrapup-workflow` for the complete 9-step process:

```bash
skill run wrapup-workflow \
  --deliveryName="feature-name" \
  --branchName="feature/branch-name"
```

### Individual Skill Usage

Skills can be run individually for partial wrapups or specific tasks:

```bash
skill run wrapup-prerequisites --branchName="feature/branch-name"
skill run testing-report --deliveryPath="path/to/delivery" --testedFeatures="feature1,feature2"
```

## Skill Integration

### Workflow Dependencies

Skills are designed to work in sequence:

- Each skill produces outputs that feed into the next skill
- Error handling is built-in with appropriate recovery strategies
- Human confirmation points ensure quality and accuracy

### Project Integration

Skills integrate with existing project tooling:

- Use build commands from `AGENTS.md`
- Follow delivery structure from `wrapup.md`
- Respect project boundaries and conventions

### Quality Gates

Skills enforce project quality standards:

- 80%+ test coverage threshold
- Build status validation
- Documentation completeness checks
- Human approval at critical points

## Skill Format

Each skill follows a standardized JSON format:

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Skill description",
  "category": "wrapup|workflow",
  "metadata": {...},
  "inputs": {...},
  "outputs": {...},
  "steps": [...],
  "errorHandling": {...},
  "examples": {...}
}
```

## Implementation Status

- ✅ All 9 core wrapup skills implemented
- ✅ Complete workflow skill implemented
- ✅ Error handling and validation included
- ✅ Integration points defined
- ✅ Usage examples provided

## Future Extensions

### Pitch Phase Skills

Planned skills for the pitch phase:

- `pitch-creation` - Create pitches from ideation
- `pitch-review` - Review pitches against criteria
- `pitch-amendment` - Handle scope changes during implementation

### Quality Assurance Skills

Planned skills for enhanced quality:

- `quality-gates` - Comprehensive quality validation
- `code-review-automation` - Automated code review checks
- `performance-analysis` - Performance impact assessment

### Project Management Skills

Planned skills for project coordination:

- `delivery-tracking` - Track delivery progress and status
- `milestone-management` - Handle milestone-based planning
- dependency-resolution` - Manage cross-delivery dependencies

## Notes

- Skills are user-initiated, never automatic
- All skills can be run independently or as workflows
- Integration with existing project tooling is maintained
- Quality gates and human confirmation points are preserved
- Skills are designed to be safe to retry on failure
