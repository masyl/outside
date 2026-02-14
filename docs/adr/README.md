# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Outside project. ADRs document significant architectural decisions, design choices, and technical direction changes in a lightweight, version-controlled format.

## Format

We use the MADR (Markdown Architecture Decision Records) format. Each ADR includes:

- **Status:** Proposed, Accepted, Deprecated, Superseded
- **Context:** Why this decision was needed
- **Decision:** What was decided
- **Consequences:** Positive and negative impacts
- **Alternatives Considered:** Other options evaluated
- **Related Decisions:** Links to connected ADRs

## ADRs in This Project

| ID | Title | Status |
|---|---|---|
| [ADR-001](ADR-001-adopt-architectural-decision-records.md) | Adopt Architectural Decision Records | Accepted |
| [ADR-002](ADR-002-adopt-smithery-for-unified-mcp-and-skill-management.md) | Adopt Smithery for Unified MCP and Skill Management | Accepted |

## Adding a New ADR

1. Create a new file: `ADR-NNN-kebab-case-title.md`
2. Use the MADR template (see existing ADRs)
3. Include a descriptive title and status
4. Update this README with a link to the new ADR
5. Commit the ADR with a commit message like: `docs(adr): add ADR-NNN: {title}`

## Discovering ADRs

- Browse this directory for the complete list
- Use search to find decisions related to a specific technology or concern
- Check the "Related Decisions" section in each ADR for connected decisions

## More Information

- [MADR template documentation](https://adr.github.io/madr/)
- [Architecture Decision Records overview](https://adr.github.io/)
