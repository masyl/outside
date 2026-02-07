---

---

# Constraint Matrices

Constraint matrices are an algorithmic tool I created to help with the generation of maps in grid-based games such as roguelikes, puzzles, and dungeons.

They help with tasks such as:

* Validating how much a generated map is following the rules.
* Applying rules to generate specific patterns.
* Identifying how to fix/repair invalid tile placement.
* Filtering tile placement options to present the best options to a user building a level manually.
* It can also be used for algorithms similar to wave function collapse.

At its most basic expression, a constraint matrix is an array of real numbers, representing a two-dimensional grid with the same height and width.

``` javascript
// A small 3x3 matrix
constraintMatrix = [
  0, 0, 0,
  0, 0, 0,
  0, 0, 0,
];
```

The center value in the matrix represents the position of the tile being tested for validity. The other values are used to test the presence or absence of other tiles.

The individual rules are represented by those values:

* 1 = an obligation
* 0 = no constraint
* -1 = an interdiction

## Larger Matrices

The matrix can be bigger for special cases.

``` javascript
// A large 5x5 constraint matrix
// Could be to insist on shallow water around a river rock
constraintMatrix = [
  0, 0, 1, 0, 0,
  0, 1, 1, 1, 0,
  1, 1, 0, 1, 1,
  0, 1, 1, 1, 0,
  0, 0, 1, 0, 0,
];
```

## Evaluating the constraints

Let's take the case of a "dirt hole" tile, that needs to be surrounded by "dirt". For demonstration purposes, let's use just two bare matrices. The actual code will be fleshed out later.

The constraint specifies the obligation that tiles be present all around the center tile. Then, we read the corresponding part of the map to create the comparison array. In this example, we found dirt tiles in only two adjacent spots.

``` javascript
constraint = [
  1, 1, 1,
  1, 0, 1,
  1, 1, 1,
];

dirtTiles = [
  0, 0, 0,
  1, 0, 1,
  0, 0, 0,
];
```

The algorithm will iterate and compare each location until an exit condition is met. In this example, on the first value tested, we can already know it is not valid.

## Functional API

In practice, setting up the constraints and doing the validation is done with an API designed according to functional programming principles and uses chaining to simplify the syntax for more complex rules.

You first create a new ruleset with the constructor and then use ```constrain()``` to start qualifying the constraints using chained functions like ```with()```, ```any()```, ```all()```, ```match()``` and many more.

In the following example, we add a constraint that lily pads can only be placed when it is surrounded by water, and even requires a water tile under it.

``` javascript
// We create a new rule set
const ruleset = new Ruleset();

// Let's setup a matrix to match all adjacent tiles
const everyTile = [
  1, 1, 1,
  1, 1, 1,
  1, 1, 1,
];

// We add the constraint to the set
ruleset.constrain("lillypad").with("water").match(everyTile);

// Let's imagine we looked up the presence of water tiles
// on the map. Game maps often have multiple entities
// on a single grid location, this is why we extract the
// presence of each entity with each matrix being a
// metaphorical layer.
const surroundingWaterTilesLayer = [
  0, 0, 0,
  1, 1, 1,
  1, 1, 1,
];

// We add the layer and call .validate() to resolve.
const isValid = ruleset.layer("water", surroundingWaterTilesLayer).validate();

// At this point, isValid would equal false.
```

## Invariance on reflection by default

Note that by default the helper considers that you are testing rules that are invariant on reflections on both axes. Meaning that the resolution algorithm will apply reflections on both axes, so that you don't have to specify all possible matrices by hand.

For example, you don't need to specify all of these. They will be automatically generated from the first matrix provided.

``` javascript
// An example for contiguous walls
ruleset.constrain("wall").with("wall").any([[
  0, 1, 0,
  0, 1, 1,
  0, 0, 0,
],[
  0, 0, 0,
  0, 1, 1,
  0, 1, 0,
],[
  0, 0, 0,
  1, 1, 0,
  0, 1, 0,
],[
  0, 1, 0,
  1, 1, 0,
  0, 0, 0,
]]);
```

## Constraints set and logic

The two main ways to create constraint sets are with the ```allOf()``` and ```anyOf()``` methods.

* The allOf() method will return true if all of the constraints in the set are also valid.
* The anyOf() will return true at the first constraint that validates as being true.

The following methods are used in combination to apply multiple sets of constraints in succession and according to different boolean conditions.

## Specifying negative constraints

Let's improve our previous example for walls and add constraints that will make sure that our contiguous walls will not touch each other. We can do this using negative constraints by setting a negative value of -1.

``` javascript
ruleset.constrain("wall").with("wall").any([
  -1,  1, -1,
   1,  0, -1,
  -1, -1, -1,
],[
  -1, -1, -1,
   1,  0,  1,
  -1, -1, -1,
]);
```

## Reflection and performance

Let's use another example where we constrain floor tiles so that they can only be placed next to an empty tile. By a process of elimination, this would ensure that all floor is encased by walls.

``` javascript
ruleset.constrain("floor").with("empty").match([
  -1, -1, -1,
  -1,  0, -1,
  -1, -1, -1,
]);
```

But since constraints are automatically reflected, the example below would also generate the same result. The difference is that the algorithm will have to do 4 matrix comparisons to get the same result.

``` javascript
ruleset.constrain("floor").with("empty").match([
  -1, -1, 0,
   0,  0, 0,
   0,  0, 0,
]);
```

Many games use a top-down topographic perspective similar to old Zelda games. These maps can never be rotated and we have objects that don't have symmetrical rules when reflected. For example, placing tiles for a waterfall requires that the top, middle and bottom of the waterfall always follow a direction.

``` javascript
ruleset
  .constrain("waterfallTop")
  .asymmetric()
  // Any rule added after this point in the chain
  // will not apply symmetries
  .with("waterfallMiddle")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ]);
ruleset
  .asymmetric()
  .constrain("waterfallMiddle")
  .with("waterfallBottom")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ]);
```

## Chaining shortcuts

Chaining functions can create compact legible code.

``` javascript
ruleset
  .asymmetric()
  .constrain("waterfallTop").with("waterfallMiddle")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ])
  .constrain("waterfallMiddle").with("waterfallBottom")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ])
  .constrain("waterfallBottom").with("waterfallMiddle")
  .match([
    0, 1, 0,
    0, 0, 0,
    0, 0, 0,
    ]);
```

## Listing restrictions

Another useful thing you can do is get the list of the tiles that would be invalid in a specific location. This would allow you to narrow down the options shown to the user when editing a level.

The bigger the ruleset, the more precise your options will be. But even just a few rules can go a long way. If you are laying down a stone wall, the options you have could be only a "wall" or "wallEnd".

``` javascript
// Let's imagine we already had a ruleset configured and
// that we have a helper that extracted the map data
// in layers.
const layers = readLayersFromMap()
// Then we can use the ruleset to give us the list of
// restricted entities.
const restrictions = ruleset
    .layers(layers)
    .restrictions()

// restriction would contain an array of all the values
// that are considered to not be allowed on this position.
```

## Auto-tiling sprites using constraint matrices

A very common scenario when building tile maps is to have a game entity that is composed of a blob of a single type of tile such as a "dirtPath", but the sprites you have to actually draw are more complex. The beginning, end, straight stretches, corners all have specific sprites to use, even if all these tiles are of the same "dirtPath".

For these situations, you can use constraints when you are loading or generating the level to augment the tile map with the appropriate metadata to then show the right sprite.

``` javascript
const spritePathRuleset = new Ruleset()
  .with("path");
  .constrain("topLeft").match([
    0, 0, 0,
    0, 1, 1,
    0, 1, 0,
    ])
  .constrain("horizontal").match([
    0, 0, 0,
    1, 1, 1,
    0, 0, 0,
    ])
  .constrain("cross").match([
    0, 1, 0,
    1, 1, 1,
    0, 1, 0,
    ])
  .constrain("vertical").match([
    0, 1, 0,
    0, 1, 0,
    0, 1, 0,
    ]);
// And so on...

/*
The result we have a generic ruleset to use for any entity that behaves like a path, such as a chalkline, cables, pipes, rope, water stream, etc.
*/

// We can quickly load a layer describing the path entity we
// are currently drawing.
const chalklineTileToDraw = getTheMatrixFromSomeHelper();

/**
 * We then use allowed() on the generic path ruleset to get
 * a list of which sprite variant should be used to render
 * the path visuals.
 *
 * If your ruleset allows for multiple tiles, you can then
 * pick one at random.
 */
const chalkSpriteVariants = spritePathRuleset
    .layer("path", chalklineTileToDraw)
    .allowed();
```

## Review, Questions and Improvements

**Questions to confirm**
- *Q:* Are matrix values strictly integers (`-1`, `0`, `1`), or can they be any real numbers with weighted meaning?
- *A1:* Integers only (`-1`, `0`, `1`), no other values allowed.
- *A2:* Any real number allowed as a weight (non-zero values treated as stronger constraints).
- *A3:* Real numbers allowed but must be in a defined range (for example `[-1, 1]`).

- *Q:* Are constraint matrices always square?
- *A1:* Yes, width must equal height.
- *A2:* No, rectangular matrices are allowed.

- *Q:* What are the semantics of the center value?
- *A1:* Always ignored; must be `0`.
- *A2:* Must be `0` or `1`, and is checked like any other cell.
- *A3:* Can be `-1/0/1` and applies to the tile being tested.

- *Q:* What is the expected signature for `any()`?
- *A1:* `any([matrixA, matrixB, ...])` only.
- *A2:* `any(matrixA, matrixB, ...)` only.
- *A3:* Both forms are supported.

- *Q:* What does `with()` return?
- *A1:* The constraint-builder so chaining continues on the same rule.
- *A2:* The ruleset instance so chaining continues at the ruleset level.
- *A3:* Nothing; `with()` ends the chain.

- *Q:* Should the example use `surroundingWaterTilesLayer` consistently?
- *A1:* Yes, rename all occurrences to `surroundingWaterTilesLayer`.
- *A2:* No, use a shorter name consistently (specify it).

- *Q:* What does `asymmetric()` toggle?
- *A1:* A ruleset-wide toggle affecting all following constraints.
- *A2:* A constraint-builder toggle affecting only the current constraint chain.
- *A3:* A per-constraint flag that must be passed explicitly.

- *Q:* Which transformations are applied by default?
- *A1:* Horizontal and vertical reflections only.
- *A2:* Reflections plus 90/180/270 degree rotations.
- *A3:* Configurable per ruleset.

**Can I code this library? What’s missing**
I can implement it, but I need a few concrete specs to avoid wrong assumptions:

- *Q:* What is the map and layer data model (and can tiles stack)?
- *A1:* `string[][]` per layer, no stacking.
- *A2:* `string[][]` per layer, stacking allowed via array per cell.
- *A3:* Numeric IDs per layer (`number[]`), stacking via bitmasks.

- *Q:* How do matrix indices map to grid coordinates (especially for even sizes)?
- *A1:* Matrix center aligns to target cell; even sizes are disallowed.
- *A2:* Matrix center aligns to target cell; even sizes align using top-left bias.
- *A3:* Matrix center aligns to target cell; even sizes align using bottom-right bias.

- *Q:* How should `0` be evaluated?
- *A1:* Ignore the cell entirely.
- *A2:* Require absence of the `with()` tile.
- *A3:* Require that the layer is empty regardless of tile type.

- *Q:* What are the exact method signatures and return types?
- *A1:* Provide a full TypeScript interface for `Ruleset` and builder types.
- *A2:* Provide a minimal API subset and allow me to propose the rest.

- *Q:* How should symmetry be configured?
- *A1:* Reflections only (default), rotations optional per ruleset.
- *A2:* Reflections and rotations always on by default.
- *A3:* No symmetry by default; explicit `reflect()` or `rotate()` calls.

- *Q:* How should out-of-bounds cells be treated during evaluation?
- *A1:* Treat as empty.
- *A2:* Treat as invalid (fail the constraint).
- *A3:* Ignore out-of-bounds cells.

- *Q:* What are the performance targets?
- *A1:* Small maps (<= 64x64) and small rulesets (< 100 rules).
- *A2:* Medium maps (<= 256x256) and medium rulesets (< 1,000 rules).
- *A3:* Large maps (>= 512x512) and large rulesets (>= 5,000 rules) with caching.

- *Q:* How should malformed input be handled?
- *A1:* Throw descriptive errors.
- *A2:* Return `false`/empty results and collect warnings.
- *A3:* Strict in dev, tolerant in prod.

If you want, I can turn these into a concrete spec checklist or update the document directly with these clarifications.
