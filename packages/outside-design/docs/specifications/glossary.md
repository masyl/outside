# Bixel System Glossary

Complete reference of all terms and concepts used in the Bixel sprite rendering system.

---

## A

### Atlas
See [Bixel Atlas](#bixel-atlas).

---

## B

### Bit
{#bit}

Single on/off value in a binary matrix. The atomic unit of a bixel—each pixel position in a bixel contains one bit.

**Related**: [Bixel](#bixel), [Binary](#binary)

### Bixel
{#bixel}

**Bitmap Pixel** — The fundamental primitive unit of the sprite rendering system. A square binary matrix available in multiple standard sizes (4bx, 8bx, 16bx, 32bx). Each bixel is composed of a grid of bits representing on/off pixel states.

**Key Properties**:
- Square aspect ratio (n × n pixels)
- Binary data (1 bit per pixel)
- Multiple standard sizes following the formula: Total Bits = Dimension²
- Composable into larger entities called Glyphs

**Related**: [Bixel Atlas](#bixel-atlas), [Glyph](#glyph), [Micro Bixel](#micro-bixel), [Small Bixel](#small-bixel), [Standard Bixel](#standard-bixel), [Large Bixel](#large-bixel)

### Bixel Atlas
{#bixel-atlas}

Complete collection of all bixel data used by the glyphs in a font. The Bixel Atlas serves as:
- A central repository of binary sprite data
- A resource that can be loaded once and referenced by multiple glyphs
- An optimization mechanism (glyphs reference atlas data rather than duplicating it)
- A packaged unit for font distribution and management

**Related**: [Font](#font), [Glyph](#glyph)

### bx
{#bx}

**Bixel unit notation** — Indicates the dimension of a bixel. The number represents the edge length of the square matrix.

**Examples**:
- 4bx = 4×4 (16 bits)
- 8bx = 8×8 (64 bits)
- 16bx = 16×16 (256 bits)
- 32bx = 32×32 (1024 bits)

**Related**: [Bixel](#bixel), [Micro Bixel](#micro-bixel), [Small Bixel](#small-bixel), [Standard Bixel](#standard-bixel), [Large Bixel](#large-bixel)

### Binary
{#binary}

Representation using two states: on/off, 1/0, true/false. All bixels use binary data—each pixel is either on (1) or off (0).

**Related**: [Bit](#bit), [Bixel](#bixel)

---

## C

### Composability
{#composability}

The ability to combine smaller units into larger structures. A key feature of the bixel system—multiple bixels can be composed into Glyphs, which can be composed into complex game assets.

**Related**: [Bixel](#bixel), [Glyph](#glyph), [Composition](#composition)

### Composition
{#composition}

The process of assembling multiple bixels according to defined rules to create Glyphs and more complex visual entities.

**Examples**:
- Single 16×16 bixel = simple icon or tile
- 2×2 arrangement = 32×32 sprite
- 3×3 arrangement = 48×48 sprite

**Related**: [Bixel](#bixel), [Glyph](#glyph), [Composability](#composability)

### Combinations
{#combinations}

Total number of unique binary patterns possible for a given bixel size. Calculated as 2^n where n is the total number of bits.

**Examples**:
- 4bx: 2^16 = 65,536 combinations
- 8bx: 2^64 ≈ 18.4 exabillion combinations
- 16bx: 2^256 = astronomically large
- 32bx: 2^1024 = astronomically large

**Related**: [Bixel](#bixel), [bx](#bx)

---

## D

### Deterministic
{#deterministic}

Exact and reproducible. Bixels provide deterministic pixel data—the exact pixel configuration is always known and can be reliably used for collision detection and rendering.

**Related**: [Bixel](#bixel)

### Dimension
{#dimension}

The edge length of a square bixel. In the formula n×n, dimension is represented by `n`.

**Examples**:
- 4bx has dimension 4
- 16bx has dimension 16
- 32bx has dimension 32

**Related**: [Bixel](#bixel), [bx](#bx), [Square](#square)

---

## F

### Font
{#font}

Complete collection of glyphs with a unified visual design, accompanied by a [Bixel Atlas](#bixel-atlas). A font can be:
- Swapped for different situations (aesthetic variations, states, etc.)
- Used for sprite rendering and text rendering
- Instantiated in multiple variations (weights, styles, sizes)

**Parallels to Digital Fonts**: Mirrors the relationship between characters and digital fonts (OTF/TTF/WOFF).

**Related**: [Glyph](#glyph), [Bixel Atlas](#bixel-atlas), [Typeface](#typeface)

---

## G

### Glyph
{#glyph}

Visual entity composed of one or more bixels according to defined composition rules. Glyphs serve as:
- The building blocks of fonts
- The smallest semantic unit in the sprite system (composed from bixels)
- References to [Bixel Atlas](#bixel-atlas) data

**Related**: [Bixel](#bixel), [Font](#font), [Composition](#composition), [Bixel Atlas](#bixel-atlas)

---

## L

### Large Bixel
{#large-bixel}

**32bx** — 32×32 pixel bixel containing 1024 bits (128 bytes). Used for large sprites, backgrounds, and complex shapes.

**Related**: [bx](#bx), [Bixel](#bixel), [Standard Bixel](#standard-bixel)

---

## M

### Micro Bixel
{#micro-bixel}

**4bx** — 4×4 pixel bixel containing 16 bits (2 bytes). A composition primitive and optimization building block—too small for standalone game assets but useful for composition and internal optimization.

**Related**: [bx](#bx), [Bixel](#bixel), [Small Bixel](#small-bixel)

---

## S

### Small Bixel
{#small-bixel}

**8bx** — 8×8 pixel bixel containing 64 bits (8 bytes). Used for tiles, small sprites, and icons.

**Related**: [bx](#bx), [Bixel](#bixel), [Standard Bixel](#standard-bixel)

### Square
{#square}

Having equal width and height dimensions (n×n). All bixels are square—a fundamental property ensuring uniform aspect ratio.

**Related**: [Bixel](#bixel), [Dimension](#dimension)

### Standard Bixel
{#standard-bixel}

**16bx** — 16×16 pixel bixel containing 256 bits (32 bytes). The default and most common bixel size, used for characters, game objects, and general-purpose assets.

**Related**: [bx](#bx), [Bixel](#bixel), [Large Bixel](#large-bixel)

---

## T

### Typeface
{#typeface}

The abstract design and aesthetic system of a font. A typeface can have multiple [Font](#font) instances with different configurations (weights, styles, sizes).

**Distinction from Font**: Typeface is the conceptual design; Font is a specific instance of that design.

**Related**: [Font](#font), [Glyph](#glyph)

---

## U

### Uniform
{#uniform}

Consistent across all instances. Bixels maintain uniform properties—all bixels of a given size have the same structure and bit count.

**Related**: [Bixel](#bixel)

---
