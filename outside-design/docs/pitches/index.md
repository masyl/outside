# Pitches


## Bot Autonomy

Bots should have autonomy as to what they do. In other words, they can issue their own commands in order to achieve goals.

This implies that the game loop should always be moving along step by step, even if no commands are issued.

* Bots are give the chance to issue commands at each step so that they can move by themselves
* By default, bots randomly choose to move up, down, left, right or simply don't move. Choosing to not move only 1/6th of the time.

Pre-requisites:

* A first instance of the oustide-server that run independently from the client.
* Concept of a seed to handle fake randomness.

## In-game debug mode

* Keystroke and button to activate a debug mode
* Show an info panel when the mouse hovers a tile.
* Info panel give this info: list of stacked objects by layers, grid coordinate, Walkable or not, Empty or not
* During development the debug mode is active by default
* Show/hide the panel containing the fps/steps only if in debug mode
* Show the current seed (used for randomness and procedural generation)

## Mini-game: Chess

A special grid could host a game of chess as a mini-game, with the help of a chess bot.

* Add a set of objects for game pieces and black/white marble terrain.
* Add a chess master bot that can setup the board and determines if the board is in a logical state and if the next move can be played
* Allow the chess master to play is side of the game.
* Allow the chess master to reset the board area if asked.
* Create a zone with the ability to undo an object displacement.

Pre-requisites:

* Game mechanic for bots to take, move and put down objects
* Telekinesis: Make sure the object displacement can have a special case to reach far away pieces without being next to the object.

## Basic PixelArt Visuals

* Proper scaling and centering of the viewport
* Add pixel art sprites
* Make the game full screen
* Draw an dotted outline boundary for the grid

## Sound

* Sound when moving
* Sound on collision
* Mute button

## Adding bots

* Button to add a random bot
* Choose random bot name from a list
* Bots don't initially appear at 0,0
* Create bot from current bot

## Keystrokes

* Keystrokes help screen
* Keystroke to add random bot
* Mute/Unmute keystroke

## Welcome screen

* Outside Logo
* Start button


## Quick Pitches

* Messages in bottles:
    The player can put a message in a bottle, then throw it in the sea. This message will then be made available to other users, but without the option to know who will get it

* Meditation/Rumination:
    Game dialogues with yourself when alone in you airarium

* Parallel universe shadows ... bleed through

    See ghostly representations of what other players are doing on the same beach. Maybe as a way to trade stuff in real time ?

* You... to infinity!!!

    Each player is also playing a parallel version of the same main character. Because the interdimensionnal squid existence spans multiple nearby parallell universe. As a way to be more productive in it's mission.



# Messages in bottles

## Basic concept

The player can put a message in a bottle, then throw it in the sea. This message will then be made available to other users, but without the option to know who will get it:

## Variations

* Proactivelly share items
* Request and answer for specific items
* Send/receive hints for the current beach
* Deep toughts (with vote/selection mechanics)

## Pros

- Provides a connection to other players, without having to fully socialize.
- Fairly simple to moderate for safety
- Can be used in combination with mechanics of "user validation of content" to have gradually improving game assets 







