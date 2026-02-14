---
Name: ADR-003: Select bitECS as Reference ECS Implementation
Status: Accepted
---

# ADR-003: Select bitECS as Reference ECS Implementation

**Context:**

The Outside project requires a clear separation between the game world simulation (data-driven, ECS-based) and the viewport rendering/UI layer (object-oriented, React-based). This architectural boundary is fundamental to the project's goals of creating a headless world simulation core that is decoupled from rendering and instrumented for external control and observation.

To establish this boundary effectively, we needed to select a production-grade ECS (Entity Component System) library that would serve as the reference implementation for the world simulation layer. The choice of ECS library significantly impacts:

- **Performance**: Simulation speed and memory efficiency in a JavaScript/TypeScript environment
- **Composability**: Ability to dynamically load, unload, and reload ECS elements (components, systems)
- **Developer experience**: API clarity, documentation, and community support
- **Architectural discipline**: Enforcing clear separation of concerns

**Decision:**

We adopt **bitECS** as the reference ECS implementation and library for the Outside project's world simulation core.

BitECS was selected after comparative analysis of major TypeScript/JavaScript ECS libraries (Becsy, ECSY, Ape-ECS, and others) based on:

1. **Adoption & Maturity**: 1,287 GitHub stars, 103 forks, thousands of weekly npm downloads—the most widely adopted ECS library in the JavaScript ecosystem
2. **Performance**: Proven data-oriented architecture with minimal footprint (~5 KB gzipped)
3. **Flexibility**: Minimal, unopinionated design that supports serialization, prefab systems, and entity relations
4. **Sustainability**: Active development with recent alpha releases; strong community engagement and documentation
5. **Philosophy alignment**: The maintainer's technical worldview prioritizes performance, simplicity, and composability—values that align with the Outside project's goals

**Implementation:**

- BitECS serves as the reference implementation for all ECS elements (components, systems, entities)
- The simulation core is built using bitECS as the foundation
- Architectural patterns and systems are designed to be compatible with bitECS's data-oriented approach
- Dynamic loading/unloading of systems and components leverages bitECS's composability
- Instrumentation and external control APIs work with bitECS's entity/component queries

**Consequences:**

**Positive:**
- Access to the most mature and battle-tested ECS library in JavaScript
- Strong performance characteristics suitable for real-time simulations
- Minimal dependencies and small bundle footprint
- Large community with extensive third-party examples and educational resources
- Clear separation between ECS simulation logic and React UI reduces performance conflicts
- External tooling (debug panels, timeline, agents) can observe and control the simulation without performance impacts
- Simpler development of tooling since UI is React-based (agents are more effective at React development)

**Negative:**
- Less opinionated library requires more architectural discipline to maintain patterns
- Community-maintained project with single primary contributor (sustainability risk, though mitigated by active development)
- Developers unfamiliar with bitECS or low-level ECS patterns may have learning curve

**Alternatives Considered:**

- **Becsy**: Production TypeScript ECS with multithreading support and strict type safety. Rejected because: smaller ecosystem, less proven in production game scenarios, overhead of multithreading not needed for current architecture
- **ECSY**: Mozilla's entity management library with WebXR focus. Rejected because: smaller adoption, less performance-optimized for high-frequency simulations
- **Ape-ECS**: Legacy library with last major update ~2020. Rejected because: inactive maintenance, smaller community
- **Build custom ECS**: Rolling our own ECS system. Rejected because: high development cost, maintenance burden, losing access to proven patterns and community knowledge

**Related Decisions:**
- ADR-001: Adopt Architectural Decision Records
- ADR-002: Adopt Smithery for unified MCP and skill management
- Architecture document: "[Choosing an ECS Library](../packages/outside-design/docs/architecture/choosing-ecs-library.md)"
- Reference: "[TypeScript ECS Libraries Comparison](../packages/outside-design/docs/architecture/typescript-ecs-libraries-comparison.md)"

**Tracking:**
- BitECS version: Core reference for all world simulation systems
- Migration path: If bitECS is discontinued, Becsy is the recommended fallback due to similar philosophy and production-readiness
