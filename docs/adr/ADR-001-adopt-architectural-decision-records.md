# ADR-001: Adopt Architectural Decision Records

**Status:** Accepted

**Context:**

As the Outside project grows in complexity across multiple packages and systems (renderer, test-player, simulator, etc.), significant architectural decisions are made but often remain implicit or scattered across commit messages, PRs, and documentation. Without a formal decision-making record, future developers cannot understand the rationale behind key choices, making it difficult to:

- Understand why specific architectural patterns were chosen
- Avoid revisiting already-considered alternatives
- Maintain consistency in decision-making across the codebase
- Document trade-offs and constraints that informed decisions
- Onboard new team members and collaborators

**Decision:**

We adopt Architecture Decision Records (ADRs) as a lightweight, version-controlled method for capturing significant architectural decisions. We will use the MADR (Markdown Architecture Decision Records) format, which provides a consistent structure while remaining easy to read and maintain.

ADRs will be stored in `docs/adr/` with filenames following the pattern `ADR-NNN-kebab-case-title.md`, where NNN is a zero-padded sequence number.

**Consequences:**

**Positive:**
- Decisions are recorded in a discoverable, version-controlled location alongside code
- MADR format provides a consistent structure that aids understanding
- Historical context is preserved, preventing repeated debate over settled decisions
- Easier to trace why specific technologies (e.g., Smithery, MCP) were adopted
- Clear record of trade-offs and rejected alternatives

**Negative:**
- Requires discipline to keep ADRs updated as decisions evolve
- Potential for ADRs to become outdated if not actively maintained
- Initial overhead in establishing the practice and discipline

**Alternatives Considered:**
- Wiki-based documentation: Less version-controlled, harder to track changes
- RFC process: More formal than needed for this project's current scale
- Commit message conventions only: Information scattered, not discoverable

**Related Decisions:**
- ADR-002: Adoption of Smithery for unified MCP and skill management
