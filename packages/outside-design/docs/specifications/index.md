# Specifications

Detailed technical specifications for core systems and components of the game engine and sprite rendering system.

## Contents

### Sprite Rendering System

- [**Bixels**](./bixels.md) - The smallest addressable element of the sprite rendering engine (square binary matrices)
  - Definition and core properties
  - Mathematical foundation with multiple sizes (4bx, 8bx, 16bx, 32bx)
  - Relationship to graphics computing concepts
  - Composition system (Glyphs, Fonts, Bixel Atlases)
  - Use cases and advantages
  - Data representation and storage

- [**Glossary**](./glossary.md) - Complete reference of all terms and concepts
  - Anchor-linked definitions
  - Related terms and cross-references
  - Used throughout specifications

### Algorithms & Techniques

- [**Bixel Line Drawing**](./bixel-line-drawing.md) - Algorithm for drawing straight lines using 4bx Bixel units
  - Bixel-based Bresenham's algorithm
  - Thick lines and anti-aliasing variations
  - Use cases and optimizations
  - TypeScript implementation example

### Coming Soon

- Glyphs - Detailed specification for composed bixel entities
- Fonts - Specification for font systems and bixel atlases
- Sprite Rendering Engine - Complete architecture and implementation details
