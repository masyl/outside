# Support for PixelArt Visuals

## Motivation

The game needs proper visual presentation to create an engaging pixel art aesthetic and ensure the game is properly displayed.

## Solution

* Add the ability to replace geometric shapes with pixel art PNG sprites
* Support the use of sprites in sprite sheets

## Inclusions

* Replacing some terrain rendering with png tiles

## Exclusions

* Hole sprites

## Implementation details

* Sheets and sprites are all composed of 16x16 tiles

### Terrains sheets

* The sheet for terrain is at: /sprites/nature-pixels-v2/Tiles/Nature.png
* The grass sprites is at: 1, 1
* The water sprite is at: 4, 1
* No tiles for holes and sand for the moment

### Bots

* The sheet for bots is here: /sprites/eris-esra-character-template-4/16x16/16x16 Idle-Sheet.png
* The default bot sprite is at: 0, 0

## Inclusion

* Default sprites
