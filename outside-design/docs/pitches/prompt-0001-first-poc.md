Let's start building the first POC for the core games architecture and game loop.

We will start by implementing the game client.

Here are a batch of requirements to consider:

- The client is a thin and dumb client whos responsibility is only to display the world state from a specific point of view. It contains almost no game logic.
- This initial world model is a 20 x 10 grid that contains objects.
- Each object occupies spots on that grid.
- For the moment object occupy a single tile on that grid.
- The client ingests commands that alter the world state.

Architecture:

- The client architecture should follow principles from CQRS and Flux to make sure changes to the world state a decoupled from the act of reading the world state.
- Commands will initially follow

# Visual and graphics

- The style is pixel art and will eventually use 16x16px tilesets
- The virtual pixel ratio is 4x
- The presentation is top down (like old zelda games)
- Center the viewport horizontally and vertically
- This first iteration can substitude objects with basic geometric shape, until we add the tilesets.
- The viewport background is initially a checkered dark grey.
- I will provide the images for the default empty tiles and the bot tile to display over.
- Moving the bot is done through a smooth animation with easing.

# Tech and libraries to use:

- Always use typescript
- The client is browser based.
- Use Pixi.js as a game/graphics engine
- When changing state, use Immer to work with immutable states.
- Use commander to parse text commands
- Use motion.dev for animations

# Game loop

- The initiall game loop for state changes runs at 500ms for each steps.
- Run one command per step
- The grid is redrawn after each command
- There is also an animation loop over the state change loop

# The first three commands are:

- create bot fido (will create an object of type bot with the id fido)
- place fido 10 8 (places the fido at those coordinates)
- move fido right 4

# Other considerations:

- Commands will eventually be emmited by a webRTC server, that we need to mock for the moment.
-
