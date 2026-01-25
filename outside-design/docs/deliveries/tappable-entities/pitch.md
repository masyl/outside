# Tappable Entities and Events

## Motivation

Game entities are not clickable or tappable yet in a any ways. Before going further, this basic interaction behavior needs to be added to unlock any interesting stuff.

## Solution

Add the components, systems and commands necessary for entities to be clickable by a mouse or tappable in touch mode.

The tap actions are not part of the world simulation and is only communicated through the internal event signaling of the ECS loop. Systems can then subscribe to the tap events and determine if a reaction is needed.

Wether a tapable object decides to react to a tap depends wether is was listening for an event.

## Inclusions

- A new Event signaling feature for the ECS core loop
- Mouse click (on MouseUp) events
- Equivalent Tap event for touch screens
- Show the tap action in the console logs with relevant details.
- Show reactions in the consol log when the followTheLeader system reacts to a tap. Log message should be specific to what the reaction is.
- Change the cursor to a hand when hovering a tappable object
- A new followTheLeader system
- Include the client mode so that connected clients can also tap entities.

## Exclusions

- No sound
- No sub-tile precision or coordinates involved in tap behavior

## Pre-requisites

- No missing pre-requisites

## Implementation details

- The word "tap" and "tappable" should be the cannonical names (instead of click).
- All bots and terrains are tappable.
- Clients only send the tap event back to the host, and event emiting is handled by the host.

**For the demo:**

- Create a followTheLeader system that listens for the tap events and changes the bots urges and targets.
  - Tapping on a bot that was following another will change him to the wander urge.
  - Tapping on a bot that was wandering will make him switch to "wait"
  - Tapping on a waiting bot will switch him back to wander.
  - Tapping on a walkable terrain tile spawns a new bot that follows the nearest bot.

## Next Logical Pitches

- Draggable entities
- In game mouse cursor
- In game markers
- Command sequences on tap event

## Review questions

- None remaining
