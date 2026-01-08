import { Application } from 'pixi.js';
import { Store } from './store/store';
import { CommandQueue } from './commands/queue';
import { GameRenderer } from './renderer/renderer';
import { GameLoop } from './game/loop';
import { MockCommandFeeder } from './mock/commandFeeder';
import { DebugOverlay } from './debug/overlay';
import { AnimationController } from './game/animationController';

/**
 * Initialize and start the game
 */
async function init() {
  // Create Pixi.js application
  const app = new Application();
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1a1a,
    antialias: false, // Pixel art style
    resolution: 1,
  });

  // Mount to DOM
  const appElement = document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }
  appElement.appendChild(app.canvas);

  // Handle window resize
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  // Create debug overlay (FPS counter, step counter, version)
  const debugOverlay = new DebugOverlay();

  // Create store
  const store = new Store();

  // Create renderer
  const renderer = new GameRenderer(app);

  // Create animation controller (subscribes to store and animates sprites)
  const animationController = new AnimationController(store, renderer);

  // Create command queue
  const commandQueue = new CommandQueue();

  // Create game loop (pass debug overlay for step counting)
  const gameLoop = new GameLoop(store, commandQueue, renderer, debugOverlay);

  // Create mock command feeder
  const commandFeeder = new MockCommandFeeder(commandQueue);

  // Feed initial commands
  commandFeeder.feedInitialCommands();

  // Start the game loop
  gameLoop.start();

  console.log('Outside Game Client - POC initialized');
}

// Start the application
init().catch((error) => {
  console.error('Failed to initialize game:', error);
});
