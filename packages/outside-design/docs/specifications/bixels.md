# Bixels Specification

## Overview

A **[Bixel](./glossary.md#bixel)** (short for "Bitmap Pixel") is the fundamental addressable element of a sprite rendering engine. Composed of a square uniform matrix of [bits](./glossary.md#bit), bixels are available in multiple sizes and are used to create game assets that are more composable and flexible than typical bitmap sprites. The modular size system allows developers to choose the right granularity for different asset types and performance requirements.

## Core Definition

**Bixel**: The fundamental primitive unit in a sprite rendering system, representing a single bit in a binary matrix. A bixel is one addressable element of a square binary sprite, where each position contains a single bit representing an on/off pixel state.

### Key Properties
- **Resolution**: [Square](./glossary.md#square) matrix (n × n pixels per bixel, where n is [dimension](./glossary.md#dimension))
- **Data**: [Binary](./glossary.md#binary) (1 [bit](./glossary.md#bit) per pixel)
- **Uniformity**: [Square](./glossary.md#square) aspect ratio (width = height)
- **Representation**: Black and white visual element
- **[Composability](./glossary.md#composability)**: Multiple bixels can be assembled into larger, more complex sprites
- **Flexibility**: Available in multiple standard sizes to suit different use cases

## Mathematical Foundation

### Bixel Sizes

Bixels are available in multiple standard sizes, each following the formula: **Total Bits = Dimension²**. Bixel sizes are denoted using the **[bx](./glossary.md#bx)** unit, where the number indicates the [dimension](./glossary.md#dimension) (e.g., 16bx = 16×16).

| Size Unit | Size Name | Dimension | Total Bits | Bytes | [Combinations](./glossary.md#combinations) | Use Cases |
|-----------|-----------|-----------|-----------|-------|--------------|-----------|
| **[4bx](./glossary.md#micro-bixel)** | [Micro Bixel](./glossary.md#micro-bixel) | 4×4 | 16 bits | 2 | 2^16 (65K) | [Composition](./glossary.md#composition) primitive, optimization building block (too small for standalone game assets) |
| **[8bx](./glossary.md#small-bixel)** | [Small Bixel](./glossary.md#small-bixel) | 8×8 | 64 bits | 8 | 2^64 (~18.4 exabillion) | Tiles, small sprites, icons |
| **[16bx](./glossary.md#standard-bixel)** | [Standard Bixel](./glossary.md#standard-bixel) | 16×16 | 256 bits | 32 | 2^256 (astronomically large) | Characters, game objects, default size |
| **[32bx](./glossary.md#large-bixel)** | [Large Bixel](./glossary.md#large-bixel) | 32×32 | 1024 bits | 128 | 2^1024 (astronomically large) | Large sprites, backgrounds, complex shapes |

### Data Structure (Example: Standard 16×16 Bixel)
- **Dimensions**: 16×16 uniform square matrix
- **Bit Depth**: 1 bit per pixel (binary: on/off)
- **Total Size**: 256 bits (32 bytes)
- **Storage**: Efficiently representable as 8× `uint32` or 16× `uint16`

### Generalized Storage Formula

For an n×n bixel:
- **Total Bits**: n²
- **Total Bytes**: n² ÷ 8
- **Storage Options**:
  - BitArray[n][n]: 2D array of bits
  - uint32[(n² ÷ 32)]: Array of 32-bit integers
  - uint16[(n² ÷ 16)]: Array of 16-bit integers
  - Buffer: Raw binary buffer of (n² ÷ 8) bytes

### Terminology Hierarchy

| Level | Term | Definition |
|-------|------|-----------|
| Atomic | **[Bit](./glossary.md#bit)** | Individual on/off value in the matrix |
| Primitive | **[Bixel](./glossary.md#bixel)** | [Square](./glossary.md#square) [binary](./glossary.md#binary) matrix (n×n pixels) |
| Composite | **[Glyph](./glossary.md#glyph)** | Multiple bixels composed together to form a more complex visual entity |
| Data Container | **[Bixel Atlas](./glossary.md#bixel-atlas)** | Complete collection of all bixel data used by glyphs in a [font](./glossary.md#font) |
| Collection | **[Font](./glossary.md#font)** | Complete set of glyphs with a unified visual design, including a [bixel atlas](./glossary.md#bixel-atlas) for rendering |

## Relationship to Graphics Computing

### Related Concepts

| Concept | Definition | Relationship to Bixel |
|---------|-----------|----------------------|
| **Pixel** | Picture Element; smallest addressable unit on screen | Bixel represents the *data* that gets rendered to pixels |
| **Texel** | Texture Element; smallest addressable unit in texture data | Bixel is a specialized texel for binary sprite data |
| **Voxel** | Volume Element; 3D extension of pixel | Not directly applicable to 2D bixel system |
| **Raster** | Array-based image representation technique | Bixel is a specialized raster format for sprite data |
| **Bitmap** | Map of bits representing an image | Bixel IS a bitmap; the most fundamental representation |

### Distinction from Typical Bitmap Sprites

| Aspect | Bixel | Typical Bitmap |
|--------|-------|----------------|
| **Composability** | Designed for composition into larger entities | Often treated as monolithic assets |
| **Flexibility** | Multiple bixels combine with composition rules | Limited reusability across sprites |
| **Storage** | Minimal (256 bits per unit) | Variable, often includes color data |
| **Base Representation** | Always has black/white foundation layer | May lack this abstraction |
| **Extension** | Color/effects added as separate concerns | Integral to sprite data |

## Composition System

### Glyphs: Composed Bixels

A **[Glyph](./glossary.md#glyph)** is a visual entity composed of one or more bixels according to defined [composition](./glossary.md#composition) rules. Glyphs serve as the building blocks for complex game assets.

**Example [Compositions](./glossary.md#composition)**:
- Single 16×16 bixel = simple icon or tile
- 2×2 arrangement = 32×32 sprite
- 3×3 arrangement = 48×48 sprite
- Custom arrangements per composition rules

### Bixel Atlas: Data Container

A **[Bixel Atlas](./glossary.md#bixel-atlas)** is the complete collection of all bixel data used by the glyphs in a [font](./glossary.md#font). It serves as:
- The central repository of [binary](./glossary.md#binary) sprite data
- A resource that can be loaded once and referenced by multiple glyphs
- An optimization mechanism (glyphs reference atlas data rather than duplicating it)
- A packaged unit for font distribution and management

### Fonts: Swappable Glyph Collections

A **[Font](./glossary.md#font)** is a complete collection of glyphs with a unified visual design, accompanied by a [Bixel Atlas](./glossary.md#bixel-atlas). Fonts:
- Can be swapped for different situations (aesthetic variations, states, etc.)
- Mirror the relationship between UTF characters and digital fonts (OTF/TTF/WOFF)
- Include all necessary bixel data for both sprite rendering AND text rendering
- Support variations (weights, styles, sizes)

**Parallels to Digital Fonts**:
- **Bixel** ↔ Bit in font glyph data
- **Glyph** ↔ Character/Glyph in a digital font
- **Bixel Atlas** ↔ Font file resource (contains glyph data)
- **Font** ↔ Font (OTF/TTF/WOFF)
- **Font Variations** ↔ Font Instances (Regular, Bold, Italic, etc.)

## Use Cases

### Primary Applications

1. **Sprite-Based Games**: Define all visual game assets as composed bixel collections
2. **Text Rendering**: Use glyph packs as a complete font system for in-game text
3. **UI Elements**: Icons, buttons, status indicators as reusable bixels
4. **Procedural Generation**: Combine bixels algorithmically to create varied content
5. **Animation**: Multiple glyphs representing animation frames

### Advantages

- **Modular**: Reuse bixels across multiple glyphs
- **Efficient**: Minimal memory footprint for sprite data
- **Deterministic**: Exact pixel definition for collision detection
- **Scalable**: Clear composition rules enable complex hierarchies
- **Layerable**: Black/white foundation allows effects and color as separate layers

## Data Representation

### Example: 16×16 Bixel (Standard)

```
256 bits = 32 bytes

Binary representation (1 = on, 0 = off):
████████████████
████████████████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████░░░░░░░░████
████████████████
████████████████
```

### Example: 8×8 Bixel (Small)

```
64 bits = 8 bytes

Binary representation:
████████
████░░██
███░░░██
███░░░██
███░░░██
████░░██
████████
████████
```

### Storage Format Options

1. **BitArray[n][n]**: 2D array of bits
2. **uint32[(n² ÷ 32)]**: Array of 32-bit integers
3. **uint16[(n² ÷ 16)]**: Array of 16-bit integers
4. **Buffer/ArrayBuffer**: Raw binary buffer of (n² ÷ 8) bytes

Where `n` is the bixel dimension (4, 8, 16, 32, etc.)

## Related Resources

- [Glossary](./glossary.md) - Complete reference of terms and concepts
- [Glyphs](./glyphs.md) - Detailed specification for composed bixel entities
- [Fonts](./fonts.md) - Specification for font systems and bixel atlases
- [Sprite Rendering Engine](./sprite-rendering-engine.md) - Implementation architecture

## Bixel Size Terminology

| Unit | Name | Dimension | Bits | Bytes | Combinations | Primary Purpose |
|------|------|-----------|------|-------|---------------|-----------------|
| **4bx** | Micro Bixel | 4×4 | 16 | 2 | 2^16 (65K) | Composition primitive, optimization |
| **8bx** | Small Bixel | 8×8 | 64 | 8 | 2^64 (~18.4 exabillion) | Game asset (tiles, icons) |
| **16bx** | Standard Bixel | 16×16 | 256 | 32 | 2^256 (astronomically large) | Game asset (default) |
| **32bx** | Large Bixel | 32×32 | 1024 | 128 | 2^1024 (astronomically large) | Large game asset |

## General Terminology Reference

| Term | Definition |
|------|-----------|
| **Bixel** | Bitmap Pixel; square binary matrix available in multiple standard sizes |
| **bx** | Bixel unit notation; indicates the dimension of a bixel (e.g., 16bx = 16×16) |
| **Glyph** | Composed bixel(s) forming a visual entity; the basic unit of a font |
| **Bixel Atlas** | Complete collection of all bixel data used by glyphs in a font; the resource container |
| **Font** | Complete collection of glyphs with unified visual design, accompanied by a bixel atlas |
| **Typeface** | The abstract design and aesthetic system of a font (can have multiple font instances) |
| **Bit** | Single on/off value in the binary matrix |
| **Square** | Having equal width and height (n×n is square) |
| **Uniform** | Consistent across all instances |
| **Composability** | Ability to combine smaller units into larger structures |
| **Deterministic** | Exact, reproducible pixel data |
| **Dimension** | The edge length of a square bixel (n in n×n) |
