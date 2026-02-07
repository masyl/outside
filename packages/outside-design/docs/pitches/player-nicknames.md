---
Title: Player Nickname
Category: Core
---

# Player Nickname

## Motivation

Users must be able to identify each others when playing together, otherwise it become difficult to colaborate or figure out if someone has even joined the game.

## Solution

To help users recognise each others, player have flexible human-friendly nicknames.

- Initially, a new client will choose a random nickname.
- This nickname is clearly visible at all time on the client.
- Whenever other players can see another clients presence, this nickname will be used to identify him instead of a client Id. For example, if you focus on a bot controlled by another user you would see his nickname over that bot.
- Nicknames dont have to be unique.
- The user can change his nickname at any time.
- The random nickname are generated from a combination of {firstname} {qualifier}. Such as Conan the Barbarian, Sophia the Slouch, John the Hungry Bear, etc.
- The game has a bank of 250 first names and 250 qualifiers.
- Nicknames are never use as unique identifiers because of their changing nature.
