---
Title: Minimap with multiple POV rendering
Category: Rendering
DeliveryLink: /deliveries/2026-02-12-1104-minimap-with-multiple-pov-rendering/
---

# Minimap with multiple POV rendering

## Motivation

To provide a fully diegetic game platform, the simulator and renderer must be able to also handle the game UI, HUDs, and other elements that are meta to the game being played.

Each of those problem space have different requirements for resolution, performance, interactivity, terminal emulators, windowing systems and other exotic concepts.

The current single renderer connected to a single simulator needs to evolve.

## Solution

A first step in this direction is to add the ability to render multiple points-of-view from the same simulation.

This first step is to add a useful game feature while starting the work of coupling the renderer using a flexible architecture.

* Render a round minimap in the bottom right corner
* The minimap shows a simplified version of the simulation that does not include all entities.
* The minimap has a configurable zoomLevel and transparency. 

## Inclusions

* The minimap component
* A minimap section in Storybook
* Basic configuration options for size, shape and placement
* A few stories showing 5 to 6 configuration combinations for size, placement, zoom, transparency and mask (round and square)

## Exclusions

* No styling options for lines, colors

## Implementation details

* The minimap view should be the same renderer module with configurations.
* Both renderer instances share the same canvas.
* The round shape of the minimap is obtained by first rendering a rectangular shape and then applying a mask.
* The renderer determines which entity to draw from a "minimapPixel" component that determines the RGB value to use.
* Add minimapPixel to floor tiles and Actors, not on food.
* The draw order is the same as the current draw order.
* The minimap zoomLevel is based on a pixel size multiplier and not a tile size ratio.
* Set default transparency at 75% and zoom level at x4 pixels
* The POV center of the minimap matches the center of the main viewport
* In the minimap, draw a rectangle to show when the main viewport is looking.
* The viewport outline is a thin white solid line.
* Make the size and relative position configurable.
* Size the minimap according to the screen DPI.
* The default size should be about 20% of the display height
* The minimap can be placed in any cardinal position and is in the bottom right by default
* Add a configurable horizontal and vertical padding.
* Place the minimap in the lower right corner by default
* Generate a large dungeon with about two dozens diverse actors. Large enough for the minimap to be useful.
* Set the stories at 32px tile size.
* The minimap rendering of pixels should snap to discrete tile coordinate without fractional sub-tile positioning.
* For the stories, generate a large dungeon with about 24 diverse actors.
* Only show controls relevant to the minimap.
* Use the testPlayer for the stories.
* Create a RendererManager to handle the composition of renderers.
* The RendererManager orchestrate which renderer is created, visible, connected to which stream and how it's configured.
* Add the RendererManager to the testPlayer.

## Missing Prerequisites

* None.

## Suggested follow ups

* Styling options
* Cardinal/compass directions
* Peripheral points-of-interest markers
* Specialized minimaps (enemies, terrain, underground, etc)
* Coordinate
* Locations/Areas labeling

## Review Questions

* What is the exact DPI sizing formula, including min/max clamp rules?
  * 1 pixel = 1 non-retina pixel on the display
  * 2x is the minimum, 16x is the maximum. 
* Are placement and padding units in pixels, tile units, or percentages?
  * Relative to the display height. To make sense when a full screen mode will be availabel.
* Is minimap entity filtering fixed (`floor + actors only`) or configurable?
  * The filtering is according to the presence of a minimapVisible component. Only set it on floor, walls and actors by default for now.
* What are the exact 5 to 6 Storybook configuration combinations required for acceptance?
  * No: Create more if you feel it useful.
