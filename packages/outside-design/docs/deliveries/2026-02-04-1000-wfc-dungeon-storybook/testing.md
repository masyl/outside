# Testing Report: WFC Dungeon Generator in Storybook

## What was tested

- **Build**: `pnpm --filter outside-storybook build` passes.
- **Storybook build**: `pnpm --filter outside-storybook build-storybook` completes successfully; all Simulator stories (including the three new WFC stories) are included in the bundle.
- **Manual**: The new stories (FloorGridDungeonWFC, FloorGridDungeonWithFoodWFC, DungeonWithHeroWFC) can be opened in Storybook; WFC-generated layouts render and entities spawn. Fallback to room-and-corridor generator was not exercised in automated runs (would require a seed that causes WFC to contradict).

## What was not tested

- No new unit tests were added for `dungeonLayoutWFC.ts` (e.g. determinism for a given seed, or fallback when WFC fails). The existing test suite does not cover Storybook utils.
- No automated visual or E2E tests for Storybook.

## Metrics

- **Passing tests**: Full repo `pnpm test` passes (11 tasks). No new tests were added; outside-storybook has no test script (Storybook and build only).
- **Coverage**: N/A for this package.

## Recommendations

- Consider adding a small unit test in a follow-up that (1) calls `generateDungeonWFC(w, h, seed)` and asserts same result for same seed, and (2) optionally forces a fallback path (e.g. very small grid where WFC may contradict) and asserts result is still valid `DungeonResult`.
