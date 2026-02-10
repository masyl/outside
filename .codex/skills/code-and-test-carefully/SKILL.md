---
name: code-and-test-carefully – Ȯ
description: Use this skill when implementing or debugging game/simulation/renderer features where visual correctness and state integrity matter. Enforces one-bug-at-a-time workflow, explicit hypotheses, instrumentation-first debugging, and proof-based validation before claiming a fix.
---

# Code and Test Carefully – Ȯ

## Use this skill when
- A bug is visual, stateful, timing-sensitive, or hard to reproduce.
- Rendering, simulation, ECS, Storybook, or animation behavior is involved.
- The user has reported repeated regressions or low confidence in prior fixes.

## Non-negotiable rules
1. Fix one bug at a time.
2. Do not claim a fix from build success alone.
3. Do not claim a fix from DOM node presence alone.
4. Every fix must have a behavioral assertion tied to the reported bug.
5. If evidence is insufficient, say "not validated yet".

## Standard workflow (always follow)

### 1) Restate the bug precisely
- Capture exact user symptom, story, and expected behavior.
- Define one concrete failure signal and one success signal.

### 2) Baseline and reproduce
- Reproduce with deterministic inputs (seed, tile size, story args).
- Record baseline evidence:
  - Runtime logs/errors.
  - Entity/tile/frame counts.
  - Visual/DOM markers relevant to the bug.

### 3) Hypothesis before edits
- Provide one primary hypothesis linked to code location.
- If uncertain, list 1-2 alternate hypotheses.
- Name the exact files/functions to change.

### 4) Instrument first, then patch
- Add minimal temporary instrumentation to validate hypothesis.
- Confirm hypothesis with observed evidence.
- Implement the smallest viable patch.

### 5) Validate at three levels
- Unit/logic: targeted tests for the changed behavior.
- Integration: story/test path that exercises real flow.
- Visual/semantic: assert rendered content correctness, not just container presence.

### 6) Report with proof
- Report exactly what was tested and what passed.
- Include the evidence type per bug signal:
  - "count > 0" for primitives,
  - expected classes/kinds,
  - expected stream packet handling,
  - expected reset behavior after story switch.
- If any check is missing, report as gap, not success.

## Rendering/ECS-specific gates
A renderer bug is not fixed unless all are true:
1. No error loop in console.
2. Frame input is non-empty when expected (`tiles/entities > 0`).
3. Render output contains expected primitive types/counts.
4. Reset path clears previous story state (no cross-story bleed).
5. Resize and tile-size changes preserve valid redraw behavior.

## Claim protocol
Before saying "fixed", include this checklist explicitly:
- `Hypothesis validated:` yes/no
- `Minimal patch applied:` yes/no
- `Behavioral assertions passed:` list
- `Regression checks passed:` list
- `Known gaps:` list or "none"

If any item is missing, say "partially validated".

## Anti-patterns to avoid
- "It builds so it works."
- "Node exists so overlay works."
- Bundling multiple bug fixes in one pass without isolated verification.
- Removing instrumentation before collecting proof.
- Replacing deterministic checks with manual eyeballing only.

## Communication style for this workflow
- Be direct and specific.
- Distinguish facts, hypothesis, and assumptions.
- Use short, test-oriented progress updates.
- Ask for user verification only after presenting objective evidence.
