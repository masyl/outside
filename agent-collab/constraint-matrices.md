---

---

# Constraint Matrices

Constraint matrices are a algorythmic tool I created to help with the generation of maps in grid base games such roguelikes, puzzles and dungeons.

They help with tasks such as:

* Validating how much a generated map is following the rules.
* Applying rule to generate specific patterns.
* Idendifying how to fix/repair invalid tile placemen.
* Filter tile placement option to present the best opions to a user building a level manually.
* It can also be used for algorythms similar to wave function collapse.

At it's most basic expression, a constraint matrix is an array or real numbers, representing a two dimensionnal grid with the same height and width and height.

``` javascript
// A small 3x3 matrix
constraintMatrix = [
  0, 0, 0,
  0, 0, 0,
  0, 0, 0,
];
```

The center value in he matrix represents the position of the tile being tested for validiy. The other values are used to test the presence or absence of other tiles.

The individual rules are represented by those values:

* 1 = an obligaion
* 0 = no constraint
* -1 = an interdiction

## Larger Matrices

The matrix can be bigger for special cases.

``` javascript
// A large 5x5 constraint matrix
// Could be to insist on shallow water around an river rock
constraintMatrix = [
  0, 0, 1, 0, 0,
  0, 1, 1, 1, 0,
  1, 1, 0, 1, 1,
  0, 1, 1, 1, 0,
  0, 0, 1, 0, 0,
];
```

## Evaluating the constraints

Let's take the case of a "dirt hole" tile, that need to be surrounded by "dirt". For demonstration purposes, let's use just two bare matrices. The actual code will be fleshed out later.

The consraint specify the obligation that tiles be present all around the center tile. Then, we read the corresponding part of the map to create the comparison array. In this example, we found dirt tiles in only two adjacent spots.

``` javascript
consraint = [
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

The algorythm will iterate and compare each location until an exit condition is met. In this example, on the first value tested, we can already know it is not valid.

## Functionnal API

In practice, setting up the constraints and doing the validation is done with an API designed according to functionnal programming principles and uses chaining to simplify the syntax for more complex rules.

You first create a new ruleset with the construcor and then use ```constrain()``` to start qualifying the constraints using chained functions like ```with()```, ```any()```, ```all()```, ```match()``` and many more.

In the following example, we add a constraint that lillypads can only be placed when it is surrounded by water, and even requires a water tile under it.

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
// on he map. Game maps often have multiple entities
// on a single grid location, this is why we extract the
// presence of each entities with each matrix being a
// metaphorical layer.
const surroundindWaterTilesLayer = [
  0, 0, 0,
  1, 1, 1,
  1, 1, 1,
];

// We add the layer and call .validate() to resolve.
const isValid = ruleset.layer("water", surroundindWaterTiles).validate()

// At this point, isValid would equal false.
```

## Invariance on reflection by default

Note that by default the helper consider that your are testing rules that are invariant on reflections on both axis. Meaning that the resolution algorythm will apply reflections on both axis, so that you dont have to specify all possible matrices by hand.

For example, you dont need to specify all of these. They will be automaticly generated from the first matrix provided.

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

The two main way to create constraint sets are with the ```allOf()``` and ```anyOf()``` methods.

* The allOf() method will return true if all of the constraints in the set are also valid.
* The anyOf() will return true at the first contraint that validate as being true.

The following methods are used in combination to apply multiple set of constraints in succession and according to different boolean conditions.

## Specifying negative constraints

Let's improve our previous example for walls and add constraints that will make sur that our contiguous walls will not touch each others. We can do this using negative constraints bet setting a negative value of -1.

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

But since constraints are automatically reflected, the example below would also generate the same result. The difference is that the algorythm will have to do 4 matrix comparisons to get the same result.

``` javascript
ruleset.constrain("floor").with("empty").match([
  -1, -1, 0,
   0,  0, 0,
   0,  0, 0,
]);
```

 Many games use a top-down topographic perspective similar to old zelda games, these maps can never be rotated and we have objects that don't have symetrical rules when reflected. For example, placing tiles for a waterfall requires that the top, middle and bottom of the waterfall always follows a direction.

``` javascript
ruleset
  .constrain("waterfallTop")
  .asymetric()
  // Any rule added after this point in the chain
  // will not apply symetries
  .with("waterfallMiddle")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ]);
ruleset
  .asymetric()
  .constrain("waterfallMiddle")
  .with("waterfallBottom")
  .match([
    0, 0, 0,
    0, 0, 0,
    0, 1, 0,
    ]);
```

## Chaining shortcuts

Chaining function can create compact legible code.

``` javascript
ruleset
  .asymetric()
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

The bigger the ruleset, the more precise you options will be. But even just a few rules can go a long way. If you a laying down a stone wall, the options you have coulb be only a "wall" or "wallEnd".

``` javascript
// Let's imagine we already had a ruleset configures and
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

A very common scenario when building tile maps, is to have a game entity that is composed of a blob of a single type of tile such as a "dirtPath", but the sprites you have to actually draw are more complexe. The beginning, end, straight stretches, corners all have specific sprites to use, even if all these tiles are of the same "dirtPath".

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

## Remaining Questions and Improvements

* None








~~For example, the code below uses the .oneOf method to specify a set of two constraints and one of them should be true to validate. The parameters specify that we are validating the presence of a WallTile in the center vs presence of other WallTile around the center. The matrices requires that another WallTile be present on two sides. This type of constraint ensure that walls are contiguous when generated according to these rules.~~


``` javascript
const ruleset = new Ruleset();
ruleset.constrain(WallTile).with(WallTile).oneOf(, [WallTile], [
  0, 1, 0,
  1, 1, 0,
  0, 0, 0,
],[
  0, 0, 0,
  1, 1, 1,
  0, 0, 0,
];
```
