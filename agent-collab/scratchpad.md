# Scratchpad

Random notes taken during development.
### Next Pitch Blurb



## Next Big Prompt


# Bug Report

## Context:

* NOGO: We still have bugs.
* Compilation & build: Ok
* Console: Ok
* Versions:
  * Renderer: 0.1.14
  * Inspector: 0.1.1
* Story: Hero and Food.
* Controls: N/A

## Fixed:

* N/A

## Problems:

* Walk animation is too bound to tics per seconds. Increasing the tic speed also speeds up the animation frame rate.

## Pitch Prompt

Integrate this:
https://www.reddit.com/r/godot/comments/1k7id1b/pixelperfect_fake_2d_in_3d_my_journey_and_a/

Integrate this:
https://www.reddit.com/r/godot/comments/1k6nzj7/comment/mos2msb/


Write this pitch:

The previous version of the inspector had a pointer mechanic. I need you to bring it back into the new inspector.
* Include the subgrid
* Include the visual elements
* Also bring back the line an dot grid, with a toggle in the controls.
* This pointer system is bound to the inspector and active only when the inspector layer is on.

## Review and Debugging Session - Food Collisions

- Tooling: I need a way to point at the viewport with the inspector to get entity info and coordinates.

- Weird elastic playback bug. While I was looking at another tab for a few minutes the game was running. When I came back to the tab I saw the game go into overdrive and run through thousands of tics in a few seconds as if it was catching up.
- Skills/Doc: Document the use of Semver and how we use versionning. (During debugging, compatibility of POV Clients and Simulators, Compatibility of dynamic assets)
- Draw order for walls, food and bots should all be done according to their Y position.
- Increase the default "collided" cooldown so that it's counted in milliseconds instead of ticks. Se it to 1 second.

## Review and Debugging Session - Pixi Renderer

You should commit before moving on to more bug fixes
Other bugs:
1. In the Hero and Food, there is a lot of bots that are rendered using the apple.
2. I don't know if it's normal, but the Pixi ECS Default is only showing bots. There is not walls or Floor tiles
3. When changing the tile size, the background is still not redraw. You should render some default grid and have a black fill for the whole canvas.
4. The items drawn in the zoo on the right does not have a sprite. And the bottom one is missing walls around him.
5. The single tile hero show all black...
6. The tile strip ends with a weird icon that looks like an avatar.
7. the Walls only is missing 2 tiles ot the bottom of the left and right side. I see similar glitches on the rooms your drawing in the Zoo Showcase
8. The Mixed Sizes is a mess of bugs, missing wall tiles, just a fruit in the middle, the weird avatar icons appears on the bottom right
9. I don't know what the Render Kind Palette is supposed to be, but all I see is a black apple icon on a very dark gre background.



## Definitions

- **Tic:** A complete synchronous pass through the simulator loop which outputs a new state state.
- **Step:** A player movement during a tick
- **Bots:** A basic prefab entity that can move and has all the basic properties of an NPC.
- **Grid:** A system that uses the integer part of the coordinate system to create a native grid to lay out entities such as floor tiles, etc.
- **Sub-Grid:** A system that uses the fraction part of the coordinate system for fine grained operations while still "snapping" to a fine grid that is aligned with the resolution of the pixel art assets and rendering mechanisms. Useful for placing entities more precisely, path finding, collision detection, hit boxes, etc.
- Everything to do with the pointer and view

## Review

- Bug: In the new renderer, the tic per second impacts the speed. Both renderer should interpret the Tics per Seconds the same way
- Architecture: Is there a way for both renderer to share the same pointer data without conflict? Exract and share the pointer resolution? Both doing it at the same time?
- Proper full size viewport: Remove width/height controls and update on resize like in the original inspector and POC
- Architecture: Would the concept of a POV help with both renderer behaving the same ?


- Highlight the patch number of packages in the Storybook
- HAVE HIME COMPARE THE NUMBER OF ENTITIES IN BOT SIDES OF THE REMOTING/SYNC
- Find a method of instrumenting the running app in a way that works accross each agent vendor and is also "human friendly" to allow collaboration. Then bake it into a skill.
- Add Context7 as a "look up documentation" skill and MCP config

- 
- Make the routine of bumping the patch version a skill they use
- I need a skill for bug intake with questionning, clarifications, logging and triage that is quick and efficient.
- Add LibP2P to some pitch: https://github.com/libp2p/js-libp2p
- Add specific code quality instructions to ensure that Agents don't code GIANT FUCKING CODE FILES!!! MORONS!!!!
- Update Storybook: A new version (10.2.7) is available!
- OpenAI codez keeps using old/deprecated PIxi techniques. Ensure he looks up specs with Context7
- OpenAI codex can't attache to the browse in VS Code, and he is lazy with instrumenting code for debugging. Got to find a more cross-agent-platform way to do this.
- Refactor agent skills:
  - Extract usefull generic methods into global utilities if they don't specifically relate to the world object.
  - Put reccurent "Math" operations into utilities (global or local) instead of re-writing each time. Will help for documenting and testing them.
    - Example: const dist = Math.hypot(pos.x - centerX, pos.y - centerY); -> Should be distanceBetween(pos.x, pos.y,centerX, centerY)
  - Identiy potential problematic hardcoding of type or entities by name (ex.: export type ResolveEntityKind = 'empty' | 'floor' | 'wall' | 'bot';)
  - Identify coupling of concerns. Example: resolveEntityAt 
- The code lacks a lot of documentation:
  - tsdoc on modules and methods
  - inline comment on intent
  - Link backs to the source documentation
- The roadmap format has issues:
  - Tasks are not granular enough
  - The structure varies often without a clear template
  - The agent doesnt always update it while he works, only at the end.
  - The format should allow the tracking of progress in real-time in the vitepress doc.
  - When the agent starts implementation, he should give a URL to the roadmap to follow.
  - Maybe consider a sort of "dashboard-ish" approach ?
- Improve: The agent decided to adopt a new approach when migrating the "urge" system. Instead of doing a mode switching, he uses empty components as tags, which would allow for overlapping/competing urges. It's interesting, but he current approach is lacking a clear direction. The concept of "urges/goals/objectives" needs to be improved.
- During the last delivery, the process skipped the creation of the feature branch. This should be added to the skill set.
- There is a lot of untracked+changed files in the project... doh!
- Update: Why is the project not on the latest typescript version ?
- Add: Need to add a linter to the whole project
- Add: Check for cyclomatic complexity
- Lookup: meaning of : "@outside/utils": "workspace:*"
- Refactor: Put each components in components.ts into their own file.
- Refator: Put the distance function of the collision detection into the utilities
- Validate: Why do systems functions return the "world" ?
- Validate: The main package exports each systems, types and everything directly at the root, instead of a systems module or other sub modules. That seems like polution.
- Improve: Convert the SimulatorRenderer routine into multiple React components.
- Refactor: world.ts is a mess of responsabilities and exports.
- Refactor: The "options" mechanic in the spawnBot method seems like a weird coupling made way too early.
- Improve: Make the pipeline more opinionated by adding "phases", so that systems can be loaded dynamically.
- There is a need for a documentation agent mode.


## Yak Stack

[ ] Layered Floor System (aka Ground, TileMap, Terrain). To track where entities are allowed to spawn and move.

## Next pitch

Lets create a new feature branch and a pitch for this idea:

Problem: At the moment, changing the level requires editing the demo.txt file, otherwise, bots move around without changing anything.

For testing, it would be useful to be able to insert command manually using a command input box (like a REPL) when in debug mode.
* Add a panel, similar in style to the other panels, to the bottom of the screen.
* Use the PixiUI input component to capture commands.
* On Enter, feed the command in the event queue.

## DX & Velocity

- Ability to remember levels and switch quickly between them to test live.
- Ability to have "scripted playbacks" when commands are issued at specific times.
- FUCK YEAH: Should I keep actual session state in the browser local storage? Or should there be a notion of "ongoing game session" that is more like a transportable TMUX session you connect to ?

## Architecture

- Before adding more UI, I should add the PixiJS React library to cut up the app in reusable parts.
- Gradually convert parts of the application into React components:
    1. The level rendering.
    2. The debug panel, which is currently in HTML, should be brought back into the pixi rendering.
    3. The keystroke help window.
    4. The timeline.
- Remove the animations completely before starting over.

## Brain dump

- Use React to structure the app
- DX: Show the build timestamp/age in thedebug panel
- Bring the debug panel into the game as a React component
- Render the debug panel a weird TUI+Pixel thing
- The "game server" HTML UI is not up to date
  - Should it even be in HTML ?
  - Maybe it should be a TUI ?
  - What is the scope or usage of this ?
  - Who is it for ?
  - Should the project distance itself from the "web-o-sphere" ?
  - If it's more than for "hosting" a game... should it be a "community" server ?
  - Should it show hosts ?
  - 

## Sessions

### Licensinmg

- TODO: Remove mentions of monetization from the licensing page.
- TODO: Add info on the "code availability" on the main repo.

## Blog

### Toybox Game Engine vs Sandbox Games

For as long as I can remember, I could never play a game without having my mind wander and think of what else could be done with this or that mechanic. So when I had to choose a project to start re-learning to code by oprchestrating the work of coding agents, a game felt like something more interesing.

The original idea for Outside was to invest time in building a custom game engine that could serve as a basis for quickly making mini-game and testing ideas quickly. This meant that world would need to be right enough to try simulators, puzzles, action games, auto-plays, RPGs and etc. The actual changing details of each games would have to be added dynamically onto a stable and robust core.

This constraint led me to make these design choices:

- 2.5D & Pixel Art: Assest are easy to find and create. Browser performance are becoming quite good with engines like PixiJS and it's easier to mix and match artwork from various artists and get something good enough.
- Tile based: Which is great for puzzles, turn based state management, minecraft like simulations and helping player select and place stuff.

My second requirement was to have an architecture that would allow me to transpose a lot of the modern web development best practices that I had come to value though the years and would help me keep a good velocity.

- PixiJS and Typescript would help me stay in the browser and offer it as a easily as a web app. No need to compile executables and deal with distributable artefacts.
- Live coding and compiling with instant previews would help me iterate fast and see the results of the agents in real time.
- Good architectural patterns like flux, CQRS, Event Sourcing would help to track and debug complex states with time travelling and step by step discreet debugging.

My third main requirement was to have a network architecture that would be more compatible with the kind of community I would like to attract if it ever took off.

I am aiming for a federated group of small loosely coupled communities of players that will not devolve into a huge monolotic group of players that pull each others hair with toxic pools of anonymous players griefing each other. Open source and hacker culture is more appealing to me than the dreams of giant mmorpgs. These always endup corporatized when they become popular.

So, I made those architectural choices:

- Peer-2-peer: to allow running games without a costly server.
- Multiplayer for small groups: It's at the core, to create experiences that bring people together and not isolate them in addictive loops.
- An app that can run both as a host and a client at any time.
- No central authority to decide what kind of games can be built with it or what story can be told.

All these choices are alreay in the core proof of concept and have proven to hold pretty well together for now. The performance seems acceptable at the moment and gives hope to be able to support a wide range of game styles.

Software architecture often matters more than just "making it work". These choices often endup being value choices and will determine who the game will be for and will be able to participate.

Is it a sandbox game? No, but you will be able to make these type of game with it. I prefer to think of it as toybox and a playground for everyone to create new game with their friends.

### January 22

Today was a good day.

**A pinch of react...**

I spent a lot less time on tuning the agentic skills and workflows to focus on the core structure of the app. I'm meeting with an old friend who is also an experienced software dev and I wanted to have one last feature to show him in the app.

I want a REPL command line in order to issue manual command at any time during the game. This will be very useful both during testing and needed for an eventual "creative mode" in the core experience.

But adding more UI without a good component structure felt like piling on more stuff on shaky ground. So I opted to restructure the main UI with the new PixiJS React library. React would not be usefull for the main game loop and rendering, but for handling UI its ideal.

**A New local mode...**

Up to now, the app would only run in Host or in Client mode, without the option to run without trying to connect to other clients. This really made testing problematic for anything that did not require multiplayer. So it was time to make multiplayer optionnal by default. I'll have to come back and fix the Client mode later this week.

**Tracking bots**

The viewport now moves smoothly to track the bot that is currently selected. I can now follow individual bots as they move apart in a large terrain.

**A better coordinate system**

The major changes to the coordinate system from the last few days was completed. Now the entities can be anywhere but can snap to tiles and even more precise sub-tiles of 8x8. All the while keeping actual precise positions for smooth animations.

This also means that the world center is 0,0 and can go into any cardinal directions, be it positive or negative.

**This was a needed change to allow for a revamp of the bots movement animations that will soon use real vectors and lock in their movements very precisely with the discreet game ticks.
