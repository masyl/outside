import { Application } from 'pixi.js';
import { Store } from './store/store';
import { CommandQueue } from './commands/queue';
import { GameRenderer } from './renderer/renderer';
import { GameLoop } from './game/loop';
import { MockCommandFeeder } from './mock/commandFeeder';
import { DebugOverlay } from './debug/overlay';
import { AnimationController } from './game/animationController';
import { SelectionManager } from './input/selection';
import { KeyboardHandler } from './input/keyboardHandler';
import { executeCommand } from './commands/handlers';

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

  // Create selection manager
  const selectionManager = new SelectionManager();

  // Create game loop (pass debug overlay for step counting)
  const gameLoop = new GameLoop(store, commandQueue, renderer, debugOverlay);

  // Create mock command feeder
  const commandFeeder = new MockCommandFeeder(commandQueue);

  // Process all initial terrain commands immediately before game loop starts
  // This ensures terrain appears instantly when the game loads
  console.log('[Init] Processing initial terrain commands...');
  const terrainCommands = commandFeeder.getInitialTerrainCommands();
  for (const command of terrainCommands) {
    executeCommand(store, command);
  }
  console.log(`[Init] Processed ${terrainCommands.length} terrain commands. Terrain should now be visible.`);
  
  // Initial render to show terrain
  renderer.setWorld(store.getState());

  // Feed bot commands to the queue (will be processed by game loop at 125ms intervals)
  commandFeeder.feedBotCommands();

  // Start the game loop
  gameLoop.start();

  // Create keyboard handler (after game loop starts so store has initial state)
  const keyboardHandler = new KeyboardHandler(
    selectionManager,
    commandQueue,
    store,
    renderer
  );

  // Set initial selection when bots are available
  // Subscribe to store to detect when bots are created
  let initialSelectionSet = false;
  const unsubscribeSelection = store.subscribe((world) => {
    if (!initialSelectionSet && world.objects.size >= 3) {
      // All 3 bots should be created and placed by now
      const firstBotId = selectionManager.cycleNext(world);
      if (firstBotId) {
        renderer.updateSelection(world, firstBotId);
        initialSelectionSet = true;
        unsubscribeSelection(); // Unsubscribe after setting initial selection
      }
    }
  });

  console.log('Outside Game Client - POC initialized');
}

// Start the application
init().catch((error) => {
  console.error('Failed to initialize game:', error);
});
