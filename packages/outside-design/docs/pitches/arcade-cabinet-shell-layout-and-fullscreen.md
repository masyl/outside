---
Title: "Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)"
Category: Platform
Summary: Add a cabinet shell around Arcade Player with default 80/20 framing, optional fullscreen gameplay, and a clear game-first entry flow.
---

# Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)

## Motivation

After runtime foundation is in place, players still need a cabinet experience that frames gameplay,
branding, and basic utility controls without slowing entry.

This phase delivers a practical shell UX: gameplay-first, near-fullscreen by default, and able to
switch into fully immersive mode.

## Solution

Introduce a `Cabinet` shell package that wraps `Arcade Player` in a structured app frame.

The shell defaults to an 80/20 layout (gameplay focus + cabinet UI region) and supports a 100%
fullscreen gameplay mode. This pitch focuses on layout and interaction behavior, not deep theming
or publishing.

## Inclusions

- `Cabinet` shell package boundary around Arcade Player runtime.
- Default 80/20 cabinet layout for gameplay and shell UI regions.
- Optional 100% fullscreen gameplay mode.
- Shell state/controls needed to enter and exit fullscreen cleanly.
- Basic cabinet frame and navigation scaffolding around gameplay.
- UX flow that keeps launch-to-play fast while exposing shell utilities.

## Exclusions

- Theme asset/config system internals (palette, fonts, logos, key images).
- Metadata-driven generation of support pages.
- PWA manifest/offline behavior requirements.
- Publisher packaging and deployment automation.
- Controller input implementation itself (provided by another library).
- Mesh-native distribution architecture.
- Account systems, cloud save, and social features.
- Multi-game marketplace or discovery platform.
- Monetization and billing flows.

## Implementation Details

- Keep shell layout regions explicit so later theming/content work can plug in without rewriting
  runtime integration.
- Treat fullscreen as a shell concern layered above the stable runtime from series 1.

## Missing Prerequisites

- [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)

## Next Logical Pitches

- [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
- [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)

## Open Questions

- Should the 80/20 layout be fixed or configurable per cabinet profile in first release?
- Should fullscreen mode hide all shell controls, or keep a minimal exit affordance visible?

## Series Context

This is the second pitch in the Arcade Player series. It turns the runnable runtime into a usable
cabinet experience with deliberate layout and fullscreen behavior.

## Related Pitches

- **Prerequisite**: [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)
- **Next**: [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
- **Follow-up**: [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)
