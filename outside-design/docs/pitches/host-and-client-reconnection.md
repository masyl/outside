# Host and Client Reconnection

## Motivation

When a host or client disconnects, the game should be able to reconnect and resume the game state seamlessly.

## Solution

Build on top of persistent game state to enable reconnection:

* Host can reconnect and resume from the last persisted state
* Clients can reconnect to a host and sync to the current game state
* Event log replay ensures both host and clients are in sync after reconnection

## Pre-requisites

* [Persistent Game State](./persistent-game-state.md)