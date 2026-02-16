---
Title: "Arcade Player Runtime Foundation (Arcade Player series: 1)"
Category: Platform
Summary: Establish a standalone Arcade Player runtime that boots and runs an Outdoor game quickly with minimal configuration.
---

# Arcade Player Runtime Foundation (Arcade Player series: 1)

## Motivation

Outdoor can already power mini-games, but distribution is still tied to broader project workflows.
Before designing cabinet UX or automation, we need a reliable, standalone runtime that can launch a
game quickly with minimal setup.

This first milestone creates the smallest end-to-end playable outcome and gives later pitches a
stable base.

## Solution

Define an `Arcade Player` runtime package that combines simulator, renderer, and game configuration
into one self-contained web app entry point.

The runtime should prioritize low time-to-fun defaults and a minimal launch contract so game
profiles can be loaded consistently by later cabinet and publisher layers.

## Inclusions

- `Arcade Player` package boundary for standalone runtime execution.
- Runtime boot flow that wires simulator, renderer, and game config into one app entry.
- Minimal runtime configuration contract required to launch a game.
- Default startup behavior optimized for fast entry into gameplay.
- A reference runnable setup proving the runtime can launch and play a game end to end.
- Documentation of runtime inputs/outputs consumed by later cabinet pitches.

## Exclusions

- Cabinet shell/chrome and layout behavior.
- 80/20 cabinet layout and fullscreen shell controls.
- Theme customization, metadata-driven support pages, and PWA content.
- Publisher packaging and deployment automation.
- Controller input implementation itself (provided by another library).
- Mesh-native distribution architecture.
- Account systems, cloud save, and social features.
- Multi-game marketplace or discovery platform.
- Monetization and billing flows.

## Implementation Details

- Keep the runtime contract intentionally small so later pitches can compose around it.
- Prefer composing existing runtime pieces instead of adding game-specific forks.

## Missing Prerequisites

- Stable integration contract for the external controller library (event model and mappings).

## Next Logical Pitches

- [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
- [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
- [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)

## Open Questions

- What exact fields are mandatory in the minimum runtime configuration for first release?
- Should series 1 support one canonical game profile only, or a small profile set?

## Series Context

This is the first pitch in the Arcade Player series. It delivers the first runnable standalone
milestone and establishes the runtime contract used by all following pitches.

## Related Pitches

- **Next**: [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
- **Follow-up**: [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
- **Follow-up**: [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)
