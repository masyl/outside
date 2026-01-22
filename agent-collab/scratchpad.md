# Scratchpad

Random notes taken during development.


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

## Next Pitch

Let's write a pitch for this:

* 