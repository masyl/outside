
# THE BIXEL SVG CUL DE SAC


We are going to start planning for a new mirror implementation, that you will have to gradually redo from scratch.

The UI and behavior should be the same, but the underlying data structures and rendering process have to be redone.

Here a few technical constraints to draft a re-implementation plan:

## Using economical data structures

* Use data driven developement and functionnal programming as much as possible for the core Bixel library. Do not create class structures to represent data as it will endup cause massive overhead.
* Bixels are simple structures and they should be stored in memory as raw as possible.
* In Typescript, the closest match are Uint8Array's where you treat each byte as a set of 8 bits. From there, you can do bitwise operations to address specific bits.
* For example: In memory An 8bit Array Buffers of 2 byte can store a 4bx bixel.
* You can create helpers to simplify the code instead of doing bitwise operation manually, but be wary of iterating on individual bits or bytes needlessly.
* When possible move raw byte data in blocks.
* Never use string, objects or similar dynamic structures to encode Bixel data.


## The "why" of Bixels.

One of the main goal of using Bixels to draw lines is to simply the rendering pipeline of sprite based games. Ideally, you want the engine to be optimized at one main thing: Draw Bixels really really fast.

This approach is constraining for many cases, such as trying to draw curves, but a 2D pixel game might not need to do that if used creativelly. Working purely with bixels can reduce the footprint and complexity of rendering the game to a very compact and predictable:

Here is a high level description:

1. The ECS simulation outputs where each game entities are located after applying all the systems functions during a step.
2. Each entity has a mapping of which Glyphs maps to which entities.
4. The renderer then iterates accross all entities that should be drawn to the viewport according to their XYZ positions.
5. When drawing the sprite, or during a pre-rendering step, glyphs are used to create an RGBA tile to be used with the CANVAS. At this step, the sprite created can be modulated according to how the glyph was composed with multiple layered Bixels.
6. is given the entities and can simply draw each Bixels at each coordinates according this mapping.

While this is a typical mechanic to use sprites, the bonus comes from the fact that Glyphs Where 

## Glyphs made of Bixels

A Bixel Glyph works like a Glyph in a font. They are composed of layered Bixels where each layer is one aspect of the visual element. But they also use bixels to map the sprite to more functionnal concerns in the rendering process.

Examples of layers for a 16x16 Bixel Glyph of a tree:
* 1 Bixel: The simplest 1bit mask image to draw in pure black and white. (Ex.: the outline of a tree)
* 12 Bixels for 16 levels RGB colors
* 4 Bixels for a 16 levels normal map
* 1 Bixel for colision map
* 2 Bixels for a light source with 4 intensity levels
* 4 Bixels for the shape of leaves, to be used with a color palette.
* 1 Bixel to know where leave particles can be emitted from
* 1 Bixel to know where the object touche the ground.
* 1 Bixel for a skeletton effect.
* 1 Bixel for an outline effect .
* 4 Bixels for pre-calculated upsampling data.

Such a Glyph would have 32 layers of 32 bytes (16 x 16) for a total raw size of 1024 bits (1kb).

Some of these Bixels can be created manually by the grahic artist colors and shapes, some can be added by a level designer (particle maps), and some can be added dynamically by the engine (outline, upsampling). 

But the overall concept is that all of these Bixels form a decomposable Glyph which can be used by the rendering engine pipeline to generate the raw RGBA sprites it needs. The only work left by the rendering pipeline is collapsing these layer according to basic rules and operations to create the "right sprite" for the "right situation" in advance and not have to rely on complexe calculations in realtime.

# Drawing lines using Bixels

For the application of drawing lines using sprites, each Bixels can be cheaply created on-the-fly and then be cached dynamically. Because the lines are using the same mechanic as all other sprites, they would inherit the same properties. Drawing the line using Bixels that are mapped as light sources would naturaly be rendered as glowing by the engine if it has these shaders enabled.

Or draw it using praticle emitting properties and attach it to a smoke emitter. You get a ray of smoke.

It might not be a fastest method than typical line drawing tecniques, but the complexity of combining rendering system effects stays fairly linear. Thus the renderer can stay simple and more predictable when composing multiple systems together.

## No SVG - Only sprites

Don't draw anything using svg. Use only Canvas.

Here is a example of how you could code a library that allows you to extract a bixel glyph from a bixel font and then build a RGBA sprite from the Bixels encoded in the Glyph byte data.

```
vegetationFont = getFonts(vegetation);

// Let's say we want to generate a color sprite for a tree. 

// Glyphs can be retrieved by text Ids
const glyphId = "spruce";

// Obtain the glyph byte array
const treeGlyph = vegetationFont.getGlyph(glyphId);

// Obtain the map used by this font
const map = vegetationFont.map();

// This map returns an array of labels and an array of size that defines how
// many Bixels compose this layer.

// The position is multiplier over the size of the Bixel
// [["bit", "red", "green", "blue", "alpha", "particles.leaves", "colorMask.fruits"],
//  [1, 8, 8, 8, 1, 1, 8]]

// This will parse the byte array of the Glyph and extract a new byte array
// while considering the number of Bixels that compose the set.
// Red, Green and Blue are taken as is. And alpha, being a bit, will be multiplied times 8)
const pixelArray = map.toByteArray(treeGlyph, ["red", "green", "blue", "alpha"]);

// Create the ImageData object from the pixel array
// Note: This does not copy data; it references the memory
// The .bx contains the size of the bixel (16 pixel here)
const treeImageData = new ImageData(pixelArray, treeGlyph.size);

// 3. Draw directly to canvas
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
ctx.putImageData(treeImageData, 50, 50);
```

This example could obviously be made more dynamic and more compact using helper methods. But it gets the core idea accross.

Conversly, you can use the library to create a font dynamically

```

const lineSegmentMap = [["bit"], [1]]

const lineSegmentFont = new BixelFont(lineSegmentMap, 16);

// For example, get a bitmap of a line segment
const lineSegment = getSegmentFromSomeAlgorythm();

const lineSegmentGlyph = new bixelGlyph(lineSegmentMap)

// Add the glyph
lineSegmentGlyph.setBixel("bit", lineSegment.bitmap);

const lineSegmentFont.add(lineSegment.key, lineSegmentGlyph);



```
