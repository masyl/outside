---
Title: "Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)"
Category: Platform
Summary: Create a Cabinet Publisher pipeline that assembles runtime, shell, and branding inputs into deployable cabinet artifacts for selected targets.
---

# Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)

## Motivation

Manual cabinet assembly and deployment does not scale once multiple games, brands, and environments
exist. A repeatable pipeline is required to produce consistent outputs and reduce release friction.

This final series phase turns the previous cabinet work into a practical release workflow.

## Solution

Introduce a `Cabinet Publisher` package that accepts validated cabinet inputs and produces complete
deployable outputs for supported targets.

The publisher should automate assembly, validation, and target-specific deployment handoff while
keeping runtime/shell/branding responsibilities in their own packages.

## Inclusions

- `Cabinet Publisher` package boundary and command surface.
- Input contract for runtime, shell, branding, and metadata artifacts.
- Assembly pipeline that produces a complete cabinet output from validated inputs.
- Validation for required assets/configuration before build and publish.
- Deployment target abstraction and first-target support for release handoff.
- Clear output artifact and release metadata expectations.

## Exclusions

- New runtime features outside published artifact contracts.
- New shell UX features beyond what series 2 defines.
- New branding/content/PWA features beyond what series 3 defines.
- Marketplace/discovery, accounts/social, and monetization systems.
- Multi-game launcher orchestration in this phase.

## Implementation Details

- Keep publisher stages explicit: validate -> assemble -> package -> deploy handoff.
- Keep target-specific deployment logic behind adapters so additional targets can be added without
  changing core assembly behavior.

## Missing Prerequisites

- [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)
- [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
- [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
- Decision on initial mandatory deployment targets.

## Next Logical Pitches

- Cabinet theme packs (genre or brand-specific templates).
- Multi-game cabinet launcher mode.
- Optional analytics hooks for engagement and input-device usage.
- Optional cloud-sync plugin on top of local-first persistence.

## Open Questions

- Which deployment targets are mandatory in the first release?
- What target-specific secrets/config strategy should publisher workflows assume?
- Should publisher support preview/staging channels in v1, or production-only handoff?

## Series Context

This is the fourth and final pitch in the Arcade Player series. It operationalizes the runtime,
shell, and branding work into a repeatable publishing and deployment workflow.

## Related Pitches

- **Prerequisite**: [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)
- **Prerequisite**: [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
- **Prerequisite**: [Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)](../pitches/arcade-cabinet-branding-pwa-and-content.md)
