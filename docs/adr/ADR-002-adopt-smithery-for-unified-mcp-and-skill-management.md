---
name: "ADR-002: Adopt Smithery for Unified MCP and Skill Management"
status: Accepted
---

# ADR-002: Adopt Smithery for Unified MCP and Skill Management

**Context:**

The Outside project uses multiple agent vendors (Claude, Cursor, Gemini, OpenAI Codex) and maintains custom skills for specialized workflows (pitch creation, implementation planning, delivery management, rigorous testing). Additionally, the project needs access to external capabilities through Model Context Protocol (MCP) servers.

Before Smithery adoption:
- Skills were manually created and synced to vendor-specific folders
- MCP connections required vendor-specific configuration files
- No unified way to discover or manage community MCP servers
- Each vendor had different configuration patterns and file locations
- Onboarding new MCP capabilities required manual setup across multiple config files

**Decision:**

Adopt Smithery as the central platform for:

1. **MCP Server Discovery & Management:** Use Smithery as the primary registry for discovering, installing, and managing MCP servers across all vendors
2. **Skill Publishing:** Host project skills on Smithery for broader discoverability and reusability
3. **Unified Configuration:** Leverage Smithery CLI and infrastructure to manage MCP connections across Claude, Cursor, Gemini, and OpenAI agents from a single source
4. **Smithery Integration:** Install `@smithery/cli` as a workspace dependency to enable skill and MCP server management

**Implementation:**

- Install `@smithery/cli` (completed)
- Create ADR skill definition and document ADRs using Smithery's ADR skill pattern
- Configure MCP connections through both `opencode.jsonc` and Smithery CLI where applicable
- Document Smithery-managed MCP servers and their endpoints in the project README
- Use Smithery to discover and add community MCP servers (web search, database tools, etc.) as needed

**Consequences:**

**Positive:**
- Centralized MCP server registry eliminates manual discovery and vendor-specific configuration
- Access to 7,300+ community MCP servers through Smithery marketplace
- Standardized skill structure across all vendors using Smithery's conventions
- Simplified onboarding for developers: a single install command for new capabilities
- Automatic OAuth handling and credential management through Smithery's managed service
- Version control for skill and MCP configurations in the project repo

**Negative:**
- Dependency on Smithery's infrastructure and availability
- Learning curve for new team members unfamiliar with Smithery
- Potential for vendor lock-in if Smithery conventions diverge from other platforms
- Smithery's rate limiting (429 errors) occasionally blocks discovery of new skills/servers

**Alternatives Considered:**
- Manual vendor-specific MCP configuration: More flexible but scales poorly
- Building custom MCP server management tooling: High maintenance overhead, duplicates Smithery's work
- Using Smithery for MCP only (not skills): Loses integration benefits and doesn't address skill management

**Related Decisions:**
- ADR-001: Adopt Architectural Decision Records
- `write-skill` skill: Established canonical skill creation workflow to prevent vendor-specific implementations
- `sync-vendor-skills` script: Continues to work alongside Smithery for existing project skills
