# Adding Storybook to the project for component testing

## Motivation

The project currently has no systematic way to visually document, test, and iterate on UI components. This makes it difficult for designers to review components, slows down development of visual features, and increases the risk of visual regressions. As the game's UI complexity grows with debug overlays, character sprites, terrain tiles, and interactive elements, we need a dedicated tool for component development and documentation.

## Solution

Implement Storybook as a component development environment that provides isolated playground for all UI components. This will enable visual testing, interactive documentation, and streamlined development workflows for both DOM-based debug interfaces and PIXI.js-based game components.

## Inclusions

- Storybook setup and configuration for the monorepo structure
- Visual documentation for debug overlay components (FPS counters, status displays)
- Interactive stories for debug menu controls and buttons
- Component stories for game sprites (character animations, directions)
- Visual examples for terrain types and environmental elements
- Integration with existing Vite build system
- TypeScript support with proper type definitions
- Development workflow documentation

## Exclusions

- Automated visual regression testing setup
- Performance testing for canvas-based components
- End-to-end testing integration
- Production deployment of Storybook
- Accessibility testing framework

## Implementation Details

Storybook will be added to the outside-client package with custom decorators to handle PIXI.js canvas initialization and asset loading. The setup will prioritize DOM components first (debug overlays) before extending to canvas-based game components.

## Pre-requisites

- Existing unit testing infrastructure should be in place
- Build system (Vite/Turbo) must be functioning properly
- TypeScript configuration must be stable

## Open Questions

- How to handle PIXI.js canvas initialization in Storybook environment?
  - Answer: Because the core game does not and will not use a typical DOM/HTML component system, custom wrappers should be built to facilitate the integration of game entities into Storybook. These HTML/DOM wrappers should never bleed into the game itself, but rather only serve the purpose or featuring aspects of the game inside a web page.
- What approach works best for loading game assets (sprites, textures) in stories?
- Should Storybook run as separate workspace package or within outside-client?
  - Answer: The instance of Storybook should remain apart from the client and live in its own sub project in the mono-repo.
- How to mock game state for complex component interactions?
  - Answer: For more complexe game states that involve interacting entities move in the world state, you could use the existing commands and event system to setup the stories. The size of the world is currently fixed, but it should be mage configurable in order to create small contained situations. (Ex.: A 10 x 5 grid to show a bot moving from one tile to another.)

## Next Logical Pitches

- Automated visual regression testing for game components
- Component library documentation website
- Design system establishment for consistent visual language
- Performance monitoring for sprite rendering
