import { Application } from 'pixi.js';
import { Store } from './store/store';
import { CommandQueue } from './commands/queue';
import { GameRenderer } from './renderer/renderer';
import { GameLoop } from './game/loop';
import { MockCommandFeeder } from './mock/commandFeeder';
import { DebugOverlay } from './debug/overlay';
import { DebugMenu } from './debug/menu';
import { AnimationController } from './game/animationController';
import { SelectionManager } from './input/selection';
import { KeyboardHandler } from './input/keyboardHandler';
import { executeCommand } from './commands/handlers';
import { createWorldState } from '@outside/core';
import { actions } from './store/actions';
import { SignalingClient } from './network/signaling';
import { HostMode } from './network/host';
import { ClientMode } from './network/client';

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
    debugMenu.onResize();
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

  // Create signaling client for host/client detection
  const SIGNALING_URL = 'ws://localhost:3001';
  const signalingClient = new SignalingClient(SIGNALING_URL);

  // Create debug menu (after commandFeeder is created)
  const debugMenu = new DebugMenu(app, {
    onResetLevel: () => {
      console.log('[Debug] Resetting level...');
      // Clear event log
      store.getEventLogger().clearEvents();
      // Reset store to initial state
      store.dispatch(actions.setWorldState(createWorldState()));
      // Reload level
      commandFeeder.loadLevel('/levels/demo.md').then(() => {
        const terrainCommands = commandFeeder.getInitialTerrainCommands();
        for (const command of terrainCommands) {
          executeCommand(store, command);
        }
        commandFeeder.feedBotCommands();
        renderer.setWorld(store.getState());
        // Mark game as started after reset
        store.start();
        console.log('[Debug] Level reset complete');
      });
    },
  });

  // Determine host/client mode and initialize game
  async function initializeGame() {
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
        debugOverlay.setMode('host');
        signalingClient.registerHost();
        await initializeHostMode();
      } else {
        console.log('[Init] Host found, connecting as client...');
        debugOverlay.setMode('client');
        await initializeClientMode();
      }
    } catch (error) {
      console.error('[Init] Error checking host status, defaulting to host mode:', error);
      isHost = true;
      debugOverlay.setMode('host');
      try {
        signalingClient.registerHost();
        await initializeHostMode();
      } catch (hostError) {
        console.error('[Init] Failed to initialize as host:', hostError);
        // Fallback: initialize as client with empty state
        debugOverlay.setMode('client');
        await initializeClientMode();
      }
    }

    async function initializeHostMode() {
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

    // Load and replay persisted events to restore runtime state
    console.log('[Init] Loading persisted game state...');
    const eventLogger = store.getEventLogger();
    const persistedEvents = eventLogger.loadEvents();
    const hasPersistedEvents = persistedEvents.length > 0;
    
    if (hasPersistedEvents) {
      console.log(`[Init] Found ${persistedEvents.length} persisted events, replaying...`);
      eventLogger.replayEvents(store, persistedEvents, () => {
        // After replay completes, update renderer to create sprites for all objects
        // This ensures sprites exist before animation controller tries to animate them
        renderer.update(store.getState());
        // Reset animation controller's previous state so it doesn't try to animate the restoration
        // (The animation controller will see the final state as the "previous" state)
        animationController.resetPreviousState();
      });
      console.log('[Init] Game state restored from persisted events');
    } else {
      console.log('[Init] No persisted events found, starting fresh');
    }

    // Mark game as started - enables event logging for future actions
    store.start();

      // Only feed bot commands if we didn't restore from persisted events
      // (persisted events already contain bot creation/placement commands)
      if (!hasPersistedEvents) {
        console.log('[Init] Feeding bot commands from level file...');
        commandFeeder.feedBotCommands();
      } else {
        console.log('[Init] Skipping bot commands from level file (bots already restored from events)');
      }

      // Initialize host mode
      hostMode = new HostMode(store, commandQueue, signalingClient, {
        onClientConnected: (clientId) => {
          console.log(`[Host] Client connected: ${clientId}`);
          // Update client count in debug overlay
          if (hostMode) {
            debugOverlay.setClientCount(hostMode.getConnectedClientCount());
          }
        },
        onClientDisconnected: (clientId) => {
          console.log(`[Host] Client disconnected: ${clientId}`);
          // Update client count in debug overlay
          if (hostMode) {
            debugOverlay.setClientCount(hostMode.getConnectedClientCount());
          }
        },
        onConnectionStateChange: (clientId, state) => {
          console.log(`[Host] Client ${clientId} connection state: ${state}`);
          debugOverlay.setP2pStatus(state);
        },
      });

      // Set debug overlay for step count updates
      hostMode.setDebugOverlay(debugOverlay);

      // Restore step count from persisted state if available
      const restoredStep = eventLogger.loadStepCount();
      if (restoredStep > 0) {
        hostMode.setCurrentStep(restoredStep);
        debugOverlay.setStepCount(restoredStep);
      }

      await hostMode.initialize();
      
      // Update client count initially
      debugOverlay.setClientCount(hostMode.getConnectedClientCount());

      // Create keyboard handler (host mode - commands go to local queue)
      const keyboardHandler = new KeyboardHandler(
        selectionManager,
        commandQueue,
        store,
        renderer
      );

      // Start the game loop
      gameLoop.start();
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
        },
        onStepUpdate: (step) => {
          // Update debug overlay with step count from host
          debugOverlay.setStepCount(step);
        },
        onConnectionStateChange: (state) => {
          console.log(`[Client] Host connection state: ${state}`);
          debugOverlay.setP2pStatus(state);
        },
      });

      await clientMode.initialize();

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

      // Subscribe to store for rendering (client receives state from host)
      store.subscribe((world) => {
        renderer.update(world);
      });
    }
  }

  // Initialize the game
  initializeGame();

  // Update debug overlay with object count
  store.subscribe((world) => {
    debugOverlay.setObjectCount(world.objects.size);
  });

  // Update debug overlay with event count periodically
  const updateEventCount = () => {
    const eventLogger = store.getEventLogger();
    const events = eventLogger.loadEvents();
    debugOverlay.setEventCount(events.length);
  };
  
  // Update immediately and then periodically (every 500ms)
  updateEventCount();
  setInterval(updateEventCount, 500);

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
