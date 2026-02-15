# @outside/bixel

Reference implementation of the Bixel sprite rendering system - a binary matrix-based approach to composable, efficient sprite creation.

## What is a Bixel?

**Bixel** (Bitmap Pixel) is the fundamental primitive unit of a sprite rendering system. It's a square binary matrix representing on/off pixel states.

- **4bx** (4×4) = 16 bits - Composition primitive, optimization building block
- **8bx** (8×8) = 64 bits - Tiles, small sprites, icons
- **16bx** (16×16) = 256 bits - Standard size for characters and game objects
- **32bx** (32×32) = 1024 bits - Large sprites, backgrounds

## Library

### Line Drawing Algorithm

Reference implementation of Bresenham's line algorithm adapted for bixel coordinates.

```typescript
import { bresenhamBixelLine, bresenhamPixelLine, DEMO_LINES } from '@outside/bixel/lib'

// Bixel-based line drawing (4bx units)
const bixelLine = bresenhamBixelLine(0, 0, 15, 15)

// Pixel-based line drawing
const pixelLine = bresenhamPixelLine(0, 0, 64, 64)
```

### Utilities

```typescript
import {
  pixelToBixel,
  bixelToPixel,
  getBixelPixels,
  type Point,
  type LineDrawingResult,
} from '@outside/bixel/lib'

// Convert between coordinate systems
const bixel = pixelToBixel(12, 8)     // { x: 3, y: 2 }
const pixel = bixelToPixel(3, 2)      // { x: 12, y: 8 }

// Get all pixels making up a bixel
const pixels = getBixelPixels(3, 2)   // Array<Point> (4×4 grid)
```

## Components

### BixelLineComparison

Interactive side-by-side comparison of pixel-based vs bixel-based line rendering.

```typescript
import { BixelLineComparison } from '@outside/bixel/components'

export function Demo() {
  return (
    <BixelLineComparison
      lines={[
        { name: 'Test Line', start: { x: 0, y: 0 }, end: { x: 15, y: 15 } }
      ]}
      zoomMultiplier={4}
      gridSize={16}
      showBixelGrid={true}
    />
  )
}
```

## Features

✨ **Composable**: Bixels combine to form larger sprites (Glyphs)
⚡ **Efficient**: Binary data = minimal memory footprint
🎯 **Deterministic**: Exact pixel definitions for collision detection
🔢 **Modular sizes**: 4bx, 8bx, 16bx, 32bx for different use cases
🎨 **Layerable**: Black/white foundation, color added as separate concern

## Exports

```typescript
// Main entry point
import { bresenhamBixelLine, BixelLineComparison } from '@outside/bixel'

// Library functions only
import { bresenhamPixelLine, pixelToBixel } from '@outside/bixel/lib'

// Components only
import { BixelLineComparison } from '@outside/bixel/components'
```

## Storybook

View interactive examples in Storybook:

```bash
yarn storybook
# Navigate to Graphics/Bixel Line Drawing
```

Stories include:
- **Default** - 6 lines at different angles
- **HighZoom** - 8x magnification for pixel inspection
- **LowZoom** - 2x for overview
- **HorizontalLine**, **VerticalLine**, **DiagonalLine** - Single line tests
- **MinimalGrid** - Without bixel grid
- **ComplexPattern** - 6 different angles

## Documentation

Full specifications available in the design documentation:
- [Bixels Specification](../outside-design/docs/specifications/bixels.md)
- [Bixel Line Drawing Algorithm](../outside-design/docs/specifications/bixel-line-drawing.md)
- [Glossary](../outside-design/docs/specifications/glossary.md)

## License

Part of the Outside project
