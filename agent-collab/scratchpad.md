# Scratchpad

Random notes taken during development.


## Yak Stack

[ ] Create a new simulation core module
[ ] Design Skill: Pitch Review


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
