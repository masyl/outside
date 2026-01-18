https://otterisk.itch.io/hana-caraka-base-character

# Support for PixelArt Visuals

## Motivation

Having a single visual for the bots is boring and confusing. It's difficult to differentiate each bots. It will soon limit the testing of various multi-bot gameplay mechanics.

## Solution

Add a set of spritesheets that contains 8 different characters to pick from.

Also, this choice of 8 could set a first constraint on how many players can join as active players at the same time.

Whenever a bot is spawned, the system would pick a skin at random from the ones not already in play.

## Inclusions

* Create a set of 8 character skins by swapping the sprite sheets
* The initial character are the angler, blacksmith, chef, farmer, florist, inn keeper, merchant, and miner.
* We will use the pre made sprite sheets from Hana Karaka (Source: https://otterisk.itch.io/hana-caraka-base-character)
* Once 8 bots are already on the map, no more can be added. An warning is shown in the console if there is an attempt to add more. This default limit is saved in a configuration file.

## Exclusions

* This aims to be a quick pitch. No additionnal game mechanic, controls or systems change is wanted.

## Implementation details

* Add the skin attributes on the bot entity.
* While each skin has an index number, it should also have a text id (for debugging and persistance) and a user facing label for UIs.
* The skin map should be stored as data and not hardcoded.

