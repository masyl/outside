# Generalize Outside for TUI Games

## Motivation

The "Outside" project already has a long-term goal of featuring a built-in VT100 terminal emulator. At the same time, we've realized that the ECS (Entity Component System) architecture powering our physical and 3D simulation is also exceptionally well-suited for building high-performance, zero-allocation Terminal User Interfaces (TUIs).

Currently, the `outside-simulator` is tightly coupled with game-specific systems and a fixed-tick physics loop. By generalizing the underlying ECS approach used in Outside, we can provide a unified, highly performant foundation that not only drives traditional games but can also power rich CLI tools, terminal dashboards, and fully interactive TUI experiences natively.

## Solution

Abstract the core ECS patterns into a generalized TUI-capable engine based on `bitecs`.

This engine will treat UI elements as Entities, properties (like `Position`, `Size`, `Focus`, `Style`) as Components, and logic (Input handling, Layout calculation, ANSI rendering) as Systems. By doing so, we can process thousands of terminal updates per second with minimal garbage collection overhead, completely bypassing the need for heavier paradigms like React/Ink or Elm/Bubble Tea while integrating seamlessly with our VT100 terminal emulator ambitions.

## Inclusions

- A generalized ECS world setup specifically tailored for TUI and terminal emulation applications.
- Core TUI components: `Position`, `Size`, `Focus`, `Style`, etc.
- Fundamental TUI systems: `InputSystem` (reading standard input), `LayoutSystem` (calculating absolute coordinates), and `RenderSystem` (flushing an in-memory 2D buffer to `stdout` via ANSI diffs).
- Aligning the existing VT100 terminal emulator goals to leverage this ECS rendering approach.

## Exclusions

- Refactoring the existing 3D `outside-simulator` (this pitch is about generalizing the _pattern_ for TUIs, not immediately rewriting the 3D physics engine).
- Building an exhaustive widget library with complex form controls (we will focus purely on the primitives needed for terminal rendering and layout).

## Implementation Details

- We will utilize `bitecs` for the underlying ECS, mapping UI nodes to entities.
- Since `bitecs` relies exclusively on numeric typed arrays, string data (like text content for a terminal cell) will be managed via parallel data structures (e.g., Maps indexed by Entity ID).
- The `RenderSystem` will maintain a discrete 2D character buffer and perform optimal diffing to only dispatch necessary ANSI sequence updates to the terminal, minimizing redraws.

## Missing Prerequisites

- None

## Suggested follow ups

- Implement a foundational TUI widget library (windows, scrollable lists, text inputs) built on top of this ECS abstraction.
- Integrate the TUI ECS engine with the new multi-agent track management tools for a rich, interactive CLI developer experience.

## Open Questions

- Should string/text data be managed in a unified global string registry, or simply attached to entities via standard JS Maps?
- How should we handle terminal resize (SIGWINCH) events gracefully within the ECS layout system to trigger immediate layout recalculations?
