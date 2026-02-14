# Architecture Decision Records

Architecture Decision Records (ADRs) document significant architectural decisions, design choices, and technical direction changes for the Outside project. We use the MADR (Markdown Architecture Decision Records) format to maintain a lightweight, version-controlled record of important decisions.

## Why ADRs?

As the project grows in complexity across multiple systems and packages, significant decisions are made but can become implicit or scattered across commit messages and documentation. ADRs help us:

- **Preserve rationale**: Understand why specific architectural patterns were chosen
- **Avoid revisiting settled decisions**: Reference past decisions without rehashing debates
- **Document trade-offs**: Capture constraints and alternatives that informed decisions
- **Enable knowledge transfer**: Help new team members understand the project's evolution
- **Track evolution**: See how architectural thinking has evolved over time

## All Architecture Decision Records

<ADRsList />

## Adding a New ADR

To propose a new architectural decision:

1. Create a new file in `docs/adr/` following the naming pattern: `ADR-NNN-kebab-case-title.md`
2. Use the MADR template with sections for Context, Decision, and Consequences
3. Include status (Proposed, Accepted, Deprecated, Superseded)
4. Link related ADRs in the "Related Decisions" section
5. Commit the ADR with a clear commit message

## Resources

- [MADR Template Documentation](https://adr.github.io/madr/)
- [Architecture Decision Records Overview](https://adr.github.io/)
- [Project ADR Directory](/../../docs/adr/README.md)
