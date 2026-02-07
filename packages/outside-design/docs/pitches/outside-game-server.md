---
Title: Outside Game Server
Category: Core
---

# Outside Game Server

## Motivation

The server part of the game is still mocked. This prevents testing multi-player scenarios. Things like latency, connectivity issues and concurency require a proper server implementation.

## Solution

Replace the mock server with a first version of the outside-server. This first version should already allow for multi-player connectivity (multiple browser instances) and use peer-to-peer web technology.

The main game logic loop should still run in the browser and allow other browsers to connect to the already running game.

## Inclusions

- Create a game server that runs in the browser, to which the game client connects using peer-to-peer webRTC technology.
- Create a server side node js server to handle the webRTC handshake between multiple clients that connect to it.
- Move the demo level to a text file containing the initial set of commands.
- If a game is not yet running, the user is redirected to a server page to start a server instance.
- If a game is already running, only connect the client.
- The server page, built in html, should provide basic details on wether a game is running and which client is connected. It also offers a link to open the client and join the game.

## Open Questions

- None yet

## Exclusions

- Multiple concurent levels/grids running on a node server.
- Multiple concurent levels/grids running on multiple browsers;Meaning only one game is active and running.

## Corrections and clarifications

- The subsequent connections are read only in the sense that they cannot affect the game state directly, instead they provide input like a dumb terminal. But clients are still active players in the game that can take control of their own bots.
- This means that the client could only get a partial copy of the grid data that is needed to display the level and interact, but not necessarelly have access to deeper details needed by the host.
- Each client sends back it's user inputs back to the host instance through abstract input commands up, down, click tile, switch next bot, etc.
- The host tracks which client is currently controlling which bot.
- The actual commands are issued by the host after receiving its inputs.
- This also means that the full state is not sent priodically. Rather, it is sent as a stream of cummulative state change events that correspond to each step as commands are issued on the host.
- An initial grid state can be sent for client that connect after the game has already started, in ordre to "keep up".
- The grid state is essentially its core attributes and the list of objects it contains
- This implies that the "currently selected bot" outline will not be drawn on the same characters on each client.
