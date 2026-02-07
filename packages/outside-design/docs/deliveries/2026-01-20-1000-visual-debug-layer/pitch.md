# Visual Debug Layer Pitch

## Overview

A first version of a visual debug layer drawn between the ground layer and the surface layer that provides enhanced visualization of the game's internal state.

## Problem Statement

Currently, debugging the game state relies primarily on the debug panel text output and the rendered sprites/animations that players see. This makes it difficult to understand the precise positions, boundaries, and relationships between game elements during development and testing.

## Solution

A visual debug layer that renders between the ground and surface layers, using vector graphics, geometric shapes, text, and symbols with color coding for clarity. The layer is only visible when debug mode is active (debug panel open).

## Features

### Grid System

- **Dot Grid**: Dots positioned at the corners of each tile coordinate
- **World Boundary**: Clear boundary around the entire grid showing world size limits

### Interaction Visualization

- **Mouse Position**: Circle around the perceived mouse position
- **Cursor Tile**: Square highlighting the tile matching the cursor position

### Entity Visualization

- **Bot Positions**: Dotted squares around each bot's current position

## Technical Approach

### Rendering Layer

- Positioned between ground layer and surface layer in the render pipeline
- Uses vector graphics instead of pixel art/sprites
- Color-coded elements for different types of information
- Only rendered when debug mode is active

### Performance Considerations

- Minimal impact on game performance when debug mode is off
- Efficient rendering using basic geometric primitives
- No additional asset loading required

## Implementation Plan

### Phase 1: Core Infrastructure

1. Create visual debug layer class
2. Integrate into render pipeline between ground/surface layers
3. Add debug mode toggle detection

### Phase 2: Grid System

1. Implement dot grid at tile corners
2. Add world boundary visualization
3. Add coordinate system reference

### Phase 3: Interaction Elements

1. Mouse position circle rendering
2. Cursor tile highlighting
3. Real-time position updates

### Phase 4: Entity Visualization

1. Bot position detection and tracking
2. Dotted square rendering around bots
3. Color coding for different bot types/states

## Success Metrics

- Improved developer understanding of game state during debugging
- Reduced time spent identifying position/coordinate related issues
- Enhanced ability to verify bot positioning and movement
- Clearer visualization of world boundaries and grid system

## Future Enhancements

- Additional entity types (items, obstacles, etc.)
- Path visualization for bot movement
- Heat maps for activity areas
- Configurable debug element visibility
- Export debug visualization for analysis
