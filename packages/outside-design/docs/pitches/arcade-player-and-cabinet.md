---
Title: Arcade Player and Cabinet
Category: Platform
Summary: Umbrella index for the Arcade Player 4-pitch series covering runtime, cabinet shell UX, branding/PWA content, and publishing automation.
---

# Arcade Player and Cabinet

This document is the umbrella index for the Arcade Player series.

The original combined pitch was split into four ordered pitches so each milestone is testable,
tangible, and can be delivered incrementally.

## Arcade Player Series Sequence

1. [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)
2. [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
3. [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
4. [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)

## Split Rationale

- Start with a runnable standalone player first.
- Add cabinet shell UX in a separate step.
- Add white-label branding and PWA/content behavior after shell foundations exist.
- Finish with publisher/deployment automation once the artifact contract is stable.

## Shared Out-of-Scope Boundaries

- Controller input implementation itself (provided by another library).
- Mesh-native distribution architecture.
- Account systems, cloud save, and social features.
- Multi-game marketplace or discovery platform.
- Monetization and billing flows.
