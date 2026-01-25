# Urge system for Follow, Wander and Wait

## Motivation

The current random walk of the bots is not very interesting to watch and they all wander off in different locations on the map.

## Solution

To make testing more interesting and bots easier to track, we can test the new ECS approach and implement a new "folllow" mode for Bot behavior.

The test could then have a leader and the other bots could follow in daisy chain.

## Inclusions

- The demo will now spawn 5 bots
- One bot will be the leader and stay in walk mode.
- The others will be started in follow mode and follow in a line.
- On the debug layer, a line links the follower and followed.
- New follow commands to set the urge and target
- New wander command that sets the urge and cancels target
- New wait command

## Exclusions

- No pathfinding/navmesh (pure steering)
- No obstacle avoidance beyond existing collision/bounce
- No new UI (unless you want toggles)
- No networking protocol changes
- No architectural changes

## Pre-requisites

- TBD

## Open Questions

- TBD

## Next Logical Pitches

- Pathfinding and obstacle avoidance.
- Make urges visible through in game elements.
- Add urge system attributes visible in debug mode.

## Implementation Details (use sparingly)

- The system will be called "urge", as in the bots have the immediate "urge" to do something.
- Urges are wait, wander, follow.
- The default random walk mechanic should be moved to the wander urge.
- Add a maximum velocity component to be considered by the walk system
- The urge system, like other aspects of the ECS mechanic is stored in the world state.

### The follow urge rules

- When following, a Bots has a target entity he is moving toward.
- The velocity of the follower is adjusted gradually to point toward the target according to an tightness parameter.
- The tighter the follow is, the quicker the velocity is adjusted, 0 being instant.
- The follower walks slower or faster depending on how far he is from his target.
- If the bot is close enough from the target, he will stop walking, and only resume walking once his followed target is further away.
- When following, even when not walking, the bot continue orienting toward his target.

### Initial Parameters and Default

- Close enough is considered 2 tiles
- The follower speeds up when further than 3 tiles.
- The maximum velocity when walking is 2tps (Tiles per seconds)
- If the followed target disapears, the bots default back to wandering
- In the demo, the first bot is the first being followed and the others follow in chain.
- Modify the demo file to configure the new setup using the new commands.
