# Bixel Line Drawing Algorithm

## Overview

Drawing straight lines using [4bx Bixels](./glossary.md#micro-bixel) as addressable units instead of individual pixels. This approach trades pixel-level precision for performance and modularity when composing larger structures from bixel primitives.

## Concept

### Traditional Pixel-Based Line Drawing

Standard line drawing algorithms (e.g., Bresenham's) operate at pixel granularity:
- Plot pixels one at a time
- Sub-pixel accuracy available
- Maximum flexibility but potential performance overhead for large-scale operations

### Bixel-Based Line Drawing

4bx Bixel-based line drawing:
- Operates at [4bx](./glossary.md#micro-bixel) granularity (4×4 pixel blocks = 16 bits)
- Each "step" places a complete [bixel](./glossary.md#bixel) rather than a single pixel
- Significant speedup for filling large structures
- Ideal for composition of larger sprites from bixel blocks

**Trade-offs**:
- ✅ Faster rendering for large structures
- ✅ Natural alignment with bixel composition system
- ✅ Reduced decision points in algorithm
- ❌ Less precise line representation
- ❌ Lines may appear "blocky" at certain angles

## Algorithm: Bixel Bresenham's Line

Adapted from Bresenham's line algorithm to work with 4bx [Bixel](./glossary.md#bixel) coordinates.

### Input Parameters

```
start_bx = (x0, y0)  // Starting bixel coordinate
end_bx = (x1, y1)    // Ending bixel coordinate
atlas = BixelAtlas   // Target bixel atlas to plot into
pattern = Bixel      // Bixel pattern to draw (usually solid or specific pattern)
```

### Algorithm Steps

```
function drawBixelLine(x0, y0, x1, y1, atlas, pattern):
    // Calculate deltas in bixel units
    dx = abs(x1 - x0)
    dy = abs(y1 - y0)

    // Determine step direction
    sx = sign(x1 - x0)  // +1 or -1
    sy = sign(y1 - y0)  // +1 or -1

    // Initialize error term
    err = dx - dy

    // Current position
    x = x0
    y = y0

    // Main loop
    while true:
        // Plot bixel at current position
        atlas.placeBixel(x, y, pattern)

        // Check if we've reached the end
        if x == x1 and y == y1:
            break

        // Calculate error and step
        e2 = 2 * err

        // Step in x direction if error exceeds threshold
        if e2 > -dy:
            err = err - dy
            x = x + sx

        // Step in y direction if error exceeds threshold
        if e2 < dx:
            err = err + dx
            y = y + sy
```

### Complexity Analysis

- **Time Complexity**: O(max(dx, dy)) where dx and dy are distances in bixel units
- **Space Complexity**: O(1) (no auxiliary storage needed)
- **Performance**: ~4× faster than pixel-based Bresenham for comparable visual line length (due to 4×4 block processing)

## Variations

### Thick Lines (Bixel Thickness)

Draw lines with multiple bixels width:

```
function drawThickBixelLine(x0, y0, x1, y1, thickness, atlas, pattern):
    // Generate perpendicular offset vectors
    dx = x1 - x0
    dy = y1 - y0
    length = sqrt(dx*dx + dy*dy)

    // Normalize perpendicular direction
    perpX = -dy / length
    perpY = dx / length

    // Draw multiple parallel lines
    for offset in range(-thickness/2, thickness/2):
        offsetX = perpX * offset
        offsetY = perpY * offset
        drawBixelLine(
            x0 + offsetX, y0 + offsetY,
            x1 + offsetX, y1 + offsetY,
            atlas, pattern
        )
```

### Anti-Aliased Lines (Bixel Blending)

Use semi-transparent bixel patterns for smoother appearance:

```
function drawAABixelLine(x0, y0, x1, y1, atlas):
    // Use bixel pattern matching for anti-aliasing effect
    mainPattern = SolidBixel()      // 100% opacity
    blendPattern = DottedBixel()    // ~50% coverage

    // Primary line
    drawBixelLine(x0, y0, x1, y1, atlas, mainPattern)

    // Secondary adjacent line for anti-aliasing
    perpX, perpY = getPerpendicular(x1 - x0, y1 - y0)
    drawBixelLine(
        x0 + perpX, y0 + perpY,
        x1 + perpX, y1 + perpY,
        atlas, blendPattern
    )
```

## Use Cases

### 1. Rapid Glyph Generation

Drawing line-based glyphs (geometric shapes, decorative elements):

```
// Draw a simple "X" shape in 16×16 bixel glyph
// Using 4bx substeps for precise positioning
glyph = new Glyph(16bx)
atlas = glyph.atlas

drawBixelLine(0, 0, 4, 4, atlas, SolidPattern)  // \ diagonal
drawBixelLine(4, 0, 0, 4, atlas, SolidPattern)  // / diagonal
```

### 2. Grid and Pattern Generation

Creating grid patterns and geometric structures:

```
// Draw 4×4 grid of 4bx bixels (16×16 total)
for x in range(0, 4):
    for y in range(0, 4):
        drawBixelLine(x, y, x, y+3, atlas, pattern)  // Vertical
        drawBixelLine(x, y, x+3, y, atlas, pattern)  // Horizontal
```

### 3. Sprite Composition from Primitives

Building complex sprites by composing line segments:

```
// Draw a simple "house" shape
atlas = new BixelAtlas(32bx)

// Roof triangle
drawBixelLine(2, 2, 6, 0, atlas, RoofPattern)
drawBixelLine(6, 0, 10, 2, atlas, RoofPattern)

// Walls
drawBixelLine(2, 2, 2, 8, atlas, WallPattern)
drawBixelLine(10, 2, 10, 8, atlas, WallPattern)

// Base
drawBixelLine(2, 8, 10, 8, atlas, FoundationPattern)

// Door
drawBixelLine(5, 4, 5, 8, atlas, DoorPattern)
drawBixelLine(4, 6, 6, 6, atlas, DoorPattern)
```

## Optimization Strategies

### 1. Pre-computed Line Tables

Cache frequently used line directions:

```
LineCache = {
    "45deg": precomputeBresenhamLine(0, 0, 8, 8),
    "30deg": precomputeBresenhamLine(0, 0, 7, 4),
    "straight_h": precomputeBresenhamLine(0, 0, 10, 0),
    "straight_v": precomputeBresenhamLine(0, 0, 0, 10),
}
```

### 2. Batch Drawing

Draw multiple line segments with a single atlas update:

```
function drawBixelLines(lines[], atlas, pattern):
    // Collect all bixel positions
    positions = []
    for line in lines:
        positions.extend(bresenham(line.start, line.end))

    // Single batch update to atlas
    atlas.placeBixels(positions, pattern)
```

### 3. Mipmap Optimization

Use different [bixel sizes](./glossary.md#bixel-sizes) for different scales:

```
if distanceInPixels > 256:
    // Use 32bx for distant lines
    drawBixelLine(x0/8, y0/8, x1/8, y1/8, atlas32bx, pattern)
else if distanceInPixels > 64:
    // Use 16bx for medium distances
    drawBixelLine(x0/4, y0/4, x1/4, y1/4, atlas16bx, pattern)
else:
    // Use 8bx or 4bx for close-up lines
    drawBixelLine(x0, y0, x1, y1, atlas8bx, pattern)
```

## Accuracy Considerations

### Line Quality

4bx Bixel lines vs pixel lines:

| Aspect | 4bx Bixel | Pixel |
|--------|-----------|-------|
| **Minimum Feature Size** | 4×4 pixels | 1×1 pixel |
| **Stepping Granularity** | 4 pixel increments | 1 pixel increment |
| **Optimal Use** | Large structures, composition | Fine detail, rendering |
| **Visual Quality** | Blocky, geometric | Smooth, precise |

### Distance Representation

For a line from (0,0) to (16,16):
- **Pixel-based**: Can represent perfectly smooth 45° diagonal
- **4bx-based**: Approximates with bixel steps, slight stair-stepping visible

Recommendation: Use 4bx for composition; render result using [8bx](./glossary.md#small-bixel) or [16bx](./glossary.md#standard-bixel) for visual output.

## Example Implementation

```typescript
interface BixelLineConfig {
    x0: number              // Start X (bixel units)
    y0: number              // Start Y (bixel units)
    x1: number              // End X (bixel units)
    y1: number              // End Y (bixel units)
    atlas: BixelAtlas       // Target atlas
    pattern: Bixel          // Bixel pattern to place
    thickness?: number      // Optional thickness in bixels
}

function drawBixelLine(config: BixelLineConfig): void {
    const { x0, y0, x1, y1, atlas, pattern, thickness = 1 } = config

    let dx = Math.abs(x1 - x0)
    let dy = Math.abs(y1 - y0)

    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1

    let err = dx - dy
    let x = x0
    let y = y0

    while (true) {
        // Plot bixel (with optional thickness)
        for (let t = 0; t < thickness; t++) {
            atlas.placeBixel(x + t, y, pattern)
        }

        if (x === x1 && y === y1) break

        const e2 = 2 * err

        if (e2 > -dy) {
            err -= dy
            x += sx
        }

        if (e2 < dx) {
            err += dx
            y += sy
        }
    }
}
```

## Related Specifications

- [Bixels](./bixels.md) - Core bixel concepts and sizes
- [Glossary](./glossary.md#micro-bixel) - 4bx Micro Bixel definition
- [Fonts](./fonts.md) - Font rendering using bixel composition

## References

- Bresenham, J. E. (1965). "Algorithm for computer control of a digital plotter"
- Adapted for discrete unit (bixel) operations rather than pixel-level precision
