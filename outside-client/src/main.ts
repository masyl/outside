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
import { SignalingClient } from './network/signaling';
import { HostMode } from './network/host';
import { ClientMode } from './network/client';

const SIGNALING_URL = 'ws://localhost:3001';

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

  // Create signaling client
  const signalingClient = new SignalingClient(SIGNALING_URL);

  // Check if game is already running
  let isHost = false;
  let hostMode: HostMode | null = null;
  let clientMode: ClientMode | null = null;

  try {
    await signalingClient.connect();
    
    // Check host status
    let hostStatusResolved = false;
    const hostStatusPromise = new Promise<{ isRunning: boolean; hostPeerId?: string }>((resolve) => {
      signalingClient.onHostStatusUpdate((isRunning, hostPeerId) => {
        if (!hostStatusResolved) {
          hostStatusResolved = true;
          resolve({ isRunning, hostPeerId });
        }
      });
      
      // Register as client first to get status
      signalingClient.registerClient();
      
      // Timeout after 1 second if no response
      setTimeout(() => {
        if (!hostStatusResolved) {
          hostStatusResolved = true;
          resolve({ isRunning: false });
        }
      }, 1000);
    });

    const hostStatus = await hostStatusPromise;
    isHost = !hostStatus.isRunning;

    if (isHost) {
      console.log('[Init] No host found, becoming host...');
      // Register as host (we're already connected)
      signalingClient.registerHost();

      // Initialize as host
      await initializeHostMode();
    } else {
      console.log('[Init] Host found, connecting as client...');
      // Initialize as client
      await initializeClientMode();
    }
  } catch (error) {
    console.error('[Init] Error checking host status, defaulting to host mode:', error);
    isHost = true;
    // We're already connected, just register as host
    try {
      signalingClient.registerHost();
      await initializeHostMode();
    } catch (hostError) {
      console.error('[Init] Failed to initialize as host:', hostError);
      // Fallback: initialize as client with empty state
      await initializeClientMode();
    }
  }

  async function initializeHostMode() {
    // Create command feeder and load level file
    const commandFeeder = new MockCommandFeeder(commandQueue);
    
    // Load level file
    console.log('[Init] Loading level file...');
    await commandFeeder.loadLevel('/levels/demo.md');

    // Process all initial terrain commands immediately before game loop starts
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

    // Create game loop (pass debug overlay for step counting)
    const gameLoop = new GameLoop(store, commandQueue, renderer, debugOverlay);

    // Initialize host mode
    hostMode = new HostMode(store, commandQueue, signalingClient, {
      onClientConnected: (clientId) => {
        console.log(`[Host] Client connected: ${clientId}`);
      },
      onClientDisconnected: (clientId) => {
        console.log(`[Host] Client disconnected: ${clientId}`);
      },
    });

    await hostMode.initialize();

    // Signaling handlers are set up in HostMode.initialize()

    // Start the game loop
    gameLoop.start();

    // Set debug overlay mode
    debugOverlay.setMode('host');

    // Create keyboard handler (host mode - commands go to local queue)
    const keyboardHandler = new KeyboardHandler(
      selectionManager,
      commandQueue,
      store,
      renderer
    );

    // Set initial selection when bots are available
    let initialSelectionSet = false;
    const unsubscribeSelection = store.subscribe((world) => {
      if (!initialSelectionSet && world.objects.size >= 3) {
        const firstBotId = selectionManager.cycleNext(world);
        if (firstBotId) {
          renderer.updateSelection(world, firstBotId);
          initialSelectionSet = true;
          unsubscribeSelection();
        }
      }
    });

    console.log('Outside Game Client - Host mode initialized');
  }

  async function initializeClientMode() {
    // Initialize with empty world state so grid can render
    // The state will be updated when we receive data from host
    const initialWorld = store.getState();
    renderer.setWorld(initialWorld);

    // Initialize client mode
    clientMode = new ClientMode(store, signalingClient, {
      onConnected: () => {
        console.log('[Client] Connected to host');
      },
      onDisconnected: () => {
        console.log('[Client] Disconnected from host');
      },
      onBotAssigned: (botId) => {
        console.log(`[Client] Bot assigned: ${botId || 'none'}`);
        // Set selection to assigned bot when it becomes available
        if (botId) {
          // Subscribe to store to wait for bot to be created
          const unsubscribe = store.subscribe((world) => {
            if (world.objects.has(botId)) {
              selectionManager.setSelectedBotId(botId);
              renderer.updateSelection(world, botId);
              unsubscribe(); // Stop checking once bot is available
            }
          });
          
          // Also check immediately in case bot already exists
          const world = store.getState();
          if (world.objects.has(botId)) {
            selectionManager.setSelectedBotId(botId);
            renderer.updateSelection(world, botId);
            unsubscribe();
          }
        }
      },
    });

    await clientMode.initialize();

    // Signaling handlers are set up in ClientMode.initialize()

    // Create keyboard handler (client mode - commands sent to host)
    const keyboardHandler = new KeyboardHandler(
      selectionManager,
      null, // No local command queue in client mode
      store,
      renderer,
      (command, selectedBotId, data) => {
        clientMode?.sendInputCommand(command, selectedBotId, data);
      }
    );

    // Set debug overlay mode
    debugOverlay.setMode('client');

    // Subscribe to store for rendering (client receives state from host)
    store.subscribe((world) => {
      renderer.update(world);
    });

    console.log('Outside Game Client - Client mode initialized');
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (hostMode) {
      hostMode.cleanup();
    }
    if (clientMode) {
      clientMode.cleanup();
    }
  });
}

// Start the application
init().catch((error) => {
  console.error('Failed to initialize game:', error);
});
