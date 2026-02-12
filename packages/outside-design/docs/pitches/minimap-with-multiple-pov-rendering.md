---
Title: Minimap with multiple POV rendering
Category: Rendering
---

# Minimap with multiple POV rendering

## Motivation

To provide a fully diegtic game platform, the simulator and rendered must be able to also handle the game UI, HUDs, and other elements that are meta to the game being played.

Each of those problem space have different requirements for resolution, performance, interactivity, terminal emulators, windowing systems and other exotic concepts.

The current single rendered connected to a single simulator needs to evolve.

## Solution

A first step in this direction is to add the ability to render multiple points-of-view from the same simulation.

This first step is to add a useful game feature while starting the work of coupling the renderer using a flexible architecture.

* Render a round minimap in the bottom right corner
* The minimap shows a simplified version of the simulation that does not include all entities.
* The minimap has a configurable zoomLevel and transparency.
* 

## Inclusions

* The minimap component
* A minimap section in story book
* Basic configuration options for size, shape and placement
* A few stories showing 5 to 6 configuration combinations for size, placement, zoom, transparency and mask (round and square)

## Exclusions

* No styling options for lines, colors

## Implementation details

* The minimap view should be the same renderer module with configurations.
* Both renderer instnances share the same canvas.
* The round shape of the minimap is obtained by first rendering a rectangular shape and then applying a mask.
* The renderer determins which entity to draw from a "minimapPixel" component that determins the RGB value to user.
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
* The minimap can be placer in any cardinal position and is in the bottom right by default
* Add a configurable horizontal and vertical padding.
* Place the minimap in the lower right corner by default
* Generate a large dungeon with
* The minimap rendering of pixels snaps to discreet tile coordinate without sub-tile positionning.
* For the stories, generate a large dungeon with about 24 diverse actors.
* Only show controls relevant to the minimap.
* Use the testPlayer for the stories.
