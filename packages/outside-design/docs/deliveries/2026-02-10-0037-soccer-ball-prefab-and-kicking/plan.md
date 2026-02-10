# Implementation Plan: Soccer Ball Prefab and Reactive Kicking

## Related Files

- **Pitch**: [pitch.md](./pitch.md)
- **Global pitch**: ../../pitches/soccer-ball-prefab-and-kicking.md

## Objective

Deliver the first playable soccer-ball slice in the simulator + renderer pipeline:

1. Add ECS components and prefab for a soccer ball entity.
2. Integrate soccer-ball body tuning, reflexive kick impulses, and fast-hit recoil in physics.
3. Integrate `ballgen` sprite assets and rolling animation tied to sphere movement.
4. Add a Storybook scenario to validate behavior visually.
5. Add targeted tests for spawn/classification/movement sanity.

Pointer variant stories, pointer hover behavior, and pointer-zoo/inspector work
are explicitly out of scope here and are documented in
`../2026-02-10-1200-pointer-zoo-and-hover-delivery/`.

## Planned Tasks

1. Add components:
   - `SoccerBall`
   - `Kickable`
   - `Kicker`
   - `Bounciness`
2. Add `spawnSoccerBall` prefab API and export it from simulator root.
3. Add soccer-ball sprite resource pack entry from `mustitz/ballgen`:
   - Source: `examples/blue-ball.all.png`
   - Sheet structure: 8x8 frames, 128x128 per frame.
4. Extend renderer classification + render pass:
   - `pickup.ball.soccer` sprite key maps to `ball` render kind,
   - load soccer-ball sheet in renderer assets.
5. Add rolling sprite animation mechanic:
   - advance column frames from per-tic displacement,
   - select row from movement heading for directional variation.
6. Extend physics system:
   - recognize soccer-ball entities,
   - apply bounciness-friendly body tuning,
   - apply reflexive kick impulses from nearby kickers.
   - apply recoil impulse to bots hit by fast-moving balls.
7. Add Storybook spawn scenario with dungeon + bots + soccer balls.
8. Add tests:
   - soccer ball spawn/component coverage,
   - soccer-ball render classification coverage,
   - kick produces non-zero ball motion over tics.

## Success Criteria

- Soccer balls can be spawned with one API call.
- Balls are dynamic in physics and visibly move when kicked by bots.
- Ball sprite visuals come from ballgen sheet and animate to suggest rolling.
- Fast-moving ball impacts cause visible recoil on impacted bots.
- New Storybook scenario demonstrates interaction in a small dungeon.
- New targeted tests pass.

## Rendering Depth Ordering Follow-up

- Top-down depth ordering must be driven by spatial position, not by render kind/type.
- Implementation must only compute and assign Pixi `zIndex` values per display object.
- Do not implement manual sorting logic in app code (no custom list sorts for draw order).
- Include `PositionZ` in depth computation so airborne state influences draw order.
