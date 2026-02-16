---
Title: "Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)"
Category: Platform
Summary: Add white-label branding contracts, metadata-driven support content, and PWA/local-first behavior to the cabinet shell.
---

# Arcade Cabinet Branding, PWA, and Content (Arcade Player series: 3)

## Motivation

With runtime and shell layout in place, cabinets still need to be re-skinned for different
partners/themes and provide support pages without custom coding for each release.

This phase adds the white-label and installability layer so cabinets can feel branded, informative,
and practical for real-world use.

## Solution

Extend the cabinet shell with a metadata-driven branding/content system and baseline PWA behavior.

Define explicit contracts for theme assets/configuration, support-page content, and
offline/local-first expectations so cabinets remain reusable and consistently assembled.

## Inclusions

- Theme customization contract for palette, fonts, logos, and key brand images.
- Metadata schema for cabinet support content (about, help, copyrights).
- Metadata-driven rendering of support pages from structured cabinet data.
- PWA metadata and manifest integration for cabinet builds.
- Baseline offline behavior definition for cabinet shell and gameplay entry.
- Local-first operation contract, including supported `localStorage` usage and fallback behavior.

## Exclusions

- Publisher packaging/deployment automation and target-specific release logic.
- CI/CD orchestration for publishing.
- New runtime boot architecture beyond interfaces needed for branding/content.
- Marketplace/discovery, accounts/social, and monetization systems.

## Implementation Details

- Keep branding/content schemas explicit and stable so publisher tooling can validate inputs later.
- Keep offline requirements at a minimum viable baseline in this phase, with stricter policies as a
  follow-up if needed.

## Missing Prerequisites

- [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)

## Next Logical Pitches

- [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)

## Open Questions

- What is the minimum required offline behavior for the first PWA release?
- Should metadata-driven pages support Markdown/MDX or a strict schema only?
- Should theme packs be first-class schema objects in this phase or in a follow-up pitch?

## Series Context

This is the third pitch in the Arcade Player series. It layers white-label and PWA/content
capabilities on top of the shell so cabinets can be reused across brands and contexts.

## Related Pitches

- **Prerequisite**: [Arcade Cabinet Shell Layout and Fullscreen (Arcade Player series: 2)](../pitches/arcade-cabinet-shell-layout-and-fullscreen.md)
- **Depends on**: [Arcade Player Runtime Foundation (Arcade Player series: 1)](../pitches/arcade-player-runtime-foundation.md)
- **Next**: [Arcade Cabinet Publisher Pipeline (Arcade Player series: 4)](../pitches/arcade-cabinet-publisher-pipeline.md)
