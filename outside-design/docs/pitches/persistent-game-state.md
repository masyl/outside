# Persistent Game state

## Motivation

Currently, if a host restarts, the games starts over and any change is lost.

## Solution

The ongoing game state should be, at a minimum, persisted on the client in order to resume where they left off if anything happens.

The game state should be stored using the same log of events that was used to create that end state.

## Implementation details

* As the game runs, state changes should be logged into an event stream in local storage.
* When resuming, the game state is recreated by playing back the event log.
* This approach allow for retro-actively integrating new game states as non-breaking changes are made to the games assets and logic.

## Next Logical Pitches

* [Host and Client Reconnection](./host-and-client-reconnection.md)
