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

**Possible sense/meaning issues**
- “Array of real numbers” but the rules only mention `-1`, `0`, `1`; if values are discrete, call them integers or explain non‑integer meaning.
- “Same height and width and height” was redundant; ensure you intend a square matrix only, or state rectangle support.
- The “center value” is sometimes `0` (no constraint) and sometimes `1` (obligation). Clarify whether the center is always ignored, always checked, or must be `0/1`.
- `.any([[...],[...],...])` vs `.any([ ... ], [ ... ])` inconsistently shows API shape.
- `.with("path");` ends the chain, then `.constrain(...)` continues; if chaining is required, remove the semicolon or clarify that `with()` returns `ruleset`.
- `ruleset.layer("water", surroundingWaterTilesLayer).validate()` uses a different variable name than declared (`surroundingWaterTilesLayer` vs `surroundindWaterTiles` in the original).
- Asymmetric rules show `.constrain(...).asymmetric()` in one case and `.asymmetric().constrain(...)` in another; define whether `asymmetric()` is a ruleset toggle or a constraint‑builder toggle.
- “Reflections on both axes” but also mentions rotations implicitly; clarify if rotations are included or only reflections.

**Can I code this library? What’s missing**
I can implement it, but I need a few concrete specs to avoid wrong assumptions:

- **Data model**: Map representation, layer model, and whether tiles can be stacked. Define the shape for layers (`string[][]`, `number[]`, bitmasks?).
- **Matrix alignment**: Exact mapping from matrix indices to grid coordinates, especially for even sizes.
- **Center semantics**: Is the center always ignored? Is it allowed to be `1/-1`? If so, what does that mean?
- **Constraint evaluation**: How to treat “no constraint” (`0`): ignore entirely or must match absence?
- **Rule composition**: Exact signatures and return types for `constrain()`, `with()`, `match()`, `any()`, `all()`, `anyOf()`, `allOf()`, `oneOf()`, `layer()`, `layers()`, `allowed()`, `restrictions()`, `validate()`.
- **Symmetry rules**: Which transformations are applied by default (horizontal/vertical reflections only, or rotations too). How `asymmetric()` scopes.
- **Edge handling**: What happens when a matrix goes outside the map bounds (treat as empty, invalid, clamp, or ignore out‑of‑bounds cells).
- **Performance targets**: Expected map sizes and rule counts, and whether caching is required.
- **Error behavior**: Validate or throw on malformed matrices, inconsistent sizes, or unknown layers.

If you want, I can turn these into a concrete spec checklist or update the document directly with these clarifications.
