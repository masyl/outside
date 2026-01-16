import { Application, autoDetectRenderer } from 'pixi.js';
import { Store } from './store/store';
import { CommandQueue } from './commands/queue';
import { GameRenderer } from './renderer/renderer';
import { GameLoop } from './game/loop';
import { MockCommandFeeder } from './mock/commandFeeder';
import { DebugOverlay } from './debug/overlay';
import { DebugMenu } from './debug/menu';
import { ConnectionOverlay } from './debug/connectionOverlay';
import { AnimationController } from './game/animationController';
import { SelectionManager } from './input/selection';
import { KeyboardHandler } from './input/keyboardHandler';
import { executeCommand } from './commands/handlers';
import { parseCommand } from './commands/parser';
import { createWorldState } from '@outside/core';
import { actions } from './store/actions';
import { SignalingClient } from './network/signaling';
import { HostMode } from './network/host';
import { ClientMode } from './network/client';

/**
 * Initialize and start the game
 */
async function init(options?: {
  container?: HTMLElement;
  store?: any;
  mode?: 'auto' | 'host' | 'client' | 'local';
  startupCommands?: string[];
}) {
  // Mount to DOM
  const appElement = options?.container || document.getElementById('app');
  if (!appElement) {
    throw new Error('App element not found');
  }

  // Create Pixi.js application
  // Note: Application.init() will use the same auto-detection when preference is specified
  // For explicit autoDetectRenderer usage, we detect it above, then Application will auto-detect again
  // This ensures we're using auto-detection as intended
  const app = new Application();
  await app.init({
    width: appElement.clientWidth || window.innerWidth,
    height: appElement.clientHeight || window.innerHeight,
    backgroundColor: 0x1a1a1a,
    antialias: false, // Pixel art style
    resolution: 1,
    preference: 'webgpu', // Prefer WebGPU renderer, auto-detect and fallback to WebGL if unavailable
  });

  // Log which renderer was actually detected/used
  console.log(`[PixiJS] Using renderer: ${app.renderer.type || 'auto-detected'}`);
  appElement.appendChild(app.canvas);

  // Create debug overlay (FPS counter, step counter, version)
  const debugOverlay = new DebugOverlay();

  // Create connection overlay for disconnection warnings
  const connectionOverlay = new ConnectionOverlay();

  // Create store
  const store = options?.store || new Store();

  // Create renderer
  const renderer = new GameRenderer(app);

  // Pre-load all assets before starting the game
  // This ensures spritesheets are ready and prevents default placeholder sprites
  console.log('[Init] Loading assets...');
  await renderer.loadAssets();
  console.log('[Init] Assets loaded, starting game...');

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
  // Note: hostMode will be set later, so we use a variable that gets updated
  let hostModeRef: HostMode | null = null;

  const debugMenu = new DebugMenu(app, {
    onResetLevel: () => {
      console.log('[Debug] Resetting level...');
      // Clear event log
      store.getEventLogger().clearEvents();
      // Reset store to initial state (this will generate a NEW random seed)
      const newState = createWorldState();
      store.dispatch(actions.setWorldState(newState));
      console.log(`[Debug] Generated new master seed: ${newState.seed}`);

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
    onToggleAutonomy: () => {
      if (hostModeRef) {
        hostModeRef.toggleAutonomy();
      }
    },
    isAutonomyEnabled: () => {
      return hostModeRef ? hostModeRef.isAutonomyEnabled() : false;
    },
  });

  // Handle window resize (moved after debugMenu initialization to avoid ReferenceError)
  window.addEventListener('resize', () => {
    // renderer.resize() handles both app renderer resize and viewport centering
    // It also ensures resolution stays at 1 for pixel-perfect rendering
    renderer.resize();
    debugMenu.onResize();
  });

  // Determine host/client mode and initialize game
  async function initializeGame() {
    let isHost = false;
    let hostMode: HostMode | null = null;
    let clientMode: ClientMode | null = null;
    const requestedMode = options?.mode ?? 'auto';

    try {
      if (requestedMode === 'local') {
        console.log('[Init] Starting in local mode (no signaling).');
        debugOverlay.setMode('host');
        await initializeHostMode({ local: true, startupCommands: options?.startupCommands });
        return;
      }

      if (requestedMode === 'host') {
        console.log('[Init] Forcing host mode.');
        debugOverlay.setMode('host');
        signalingClient.registerHost();
        await initializeHostMode({ startupCommands: options?.startupCommands });
        return;
      }

      if (requestedMode === 'client') {
        console.log('[Init] Forcing client mode.');
        debugOverlay.setMode('client');
        await initializeClientMode();
        return;
      }

      await signalingClient.connect();

      // Check host status
      let hostStatusResolved = false;
      const hostStatusPromise = new Promise<{ isRunning: boolean; hostPeerId?: string }>(
        (resolve) => {
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
        }
      );

      const hostStatus = await hostStatusPromise;
      isHost = !hostStatus.isRunning;

      if (isHost) {
        console.log('[Init] No host found, becoming host...');
        debugOverlay.setMode('host');
        signalingClient.registerHost();
        await initializeHostMode({ startupCommands: options?.startupCommands });
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
        await initializeHostMode({ startupCommands: options?.startupCommands });
      } catch (hostError) {
        console.error('[Init] Failed to initialize as host:', hostError);
        // Fallback: initialize as client with empty state
        debugOverlay.setMode('client');
        await initializeClientMode();
      }
    }

    async function initializeHostMode(options?: { local?: boolean; startupCommands?: string[] }) {
      const isLocal = options?.local ?? false;

      if (options?.startupCommands && options.startupCommands.length > 0) {
        console.log('[Init] Applying startup commands...');
        for (const commandString of options.startupCommands) {
          const parsedCommand = parseCommand(commandString);
          if (parsedCommand.type !== 'unknown') {
            executeCommand(store, parsedCommand);
          }
        }
      } else if (!isLocal) {
        // Load level file
        console.log('[Init] Loading level file...');
        await commandFeeder.loadLevel('/levels/demo.md');

        // Process all initial terrain commands immediately before game loop starts
        console.log('[Init] Processing initial terrain commands...');
        const terrainCommands = commandFeeder.getInitialTerrainCommands();
        for (const command of terrainCommands) {
          executeCommand(store, command);
        }
        console.log(
          `[Init] Processed ${terrainCommands.length} terrain commands. Terrain should now be visible.`
        );
      }

      // Initial render to show terrain
      renderer.setWorld(store.getState());

      // Load and replay persisted events to restore runtime state
      console.log('[Init] Loading persisted game state...');
      const eventLogger = store.getEventLogger();
      const persistedEvents = eventLogger.loadEvents();
      const hasPersistedEvents = persistedEvents.length > 0;

      // Create new world state with seed if starting fresh
      if (!hasPersistedEvents) {
        // Re-create world state to ensure it has a fresh seed if this is a new game
        // Note: We already created one in debugMenu, but this is the main initialization path
        // Actually, store already has a state from init, but let's make sure it's fresh
      } else {
        // If replaying, we might want to recover the seed from events?
        // Currently events don't store the master seed, only state changes.
        // But we can check if the store state has a seed.
      }

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

        // The replayed state might not have the seed if it was created before the seed field existed.
        // Ensure seed is present.
        const world = store.getState();
        if (world.seed === undefined) {
          console.warn('[Init] Restored state is missing seed, generating new one...');
          // We need to update the state with a seed without triggering a new event
          // But Store doesn't allow direct state mutation outside actions.
          // We can dispatch a SET_WORLD_STATE action with the same state + seed.
          const stateWithSeed = { ...world, seed: Math.floor(Math.random() * 2147483647) };
          store.dispatch(actions.setWorldState(stateWithSeed));
        }
      } else {
        console.log('[Init] No persisted events found, starting fresh');
        // Ensure we have a valid world state with seed
        // Note: store was initialized with empty state in init(), which calls createWorldState()
        // so it should already have a seed.
      }

      // Mark game as started - enables event logging for future actions
      store.start();

      // Only feed bot commands if we didn't restore from persisted events
      // (persisted events already contain bot creation/placement commands)
      if (!hasPersistedEvents) {
        console.log('[Init] Feeding bot commands from level file...');
        commandFeeder.feedBotCommands();
      } else {
        console.log(
          '[Init] Skipping bot commands from level file (bots already restored from events)'
        );
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

      // Update reference for debug menu
      hostModeRef = hostMode;

      // Set debug overlay for step count updates
      hostMode.setDebugOverlay(debugOverlay);

      // Restore step count from persisted state if available
      const restoredStep = eventLogger.loadStepCount();
      if (restoredStep > 0) {
        hostMode.setCurrentStep(restoredStep);
        debugOverlay.setStepCount(restoredStep);
      }

      await hostMode.initialize({ local: isLocal });

      // Update client count initially
      debugOverlay.setClientCount(hostMode.getConnectedClientCount());

      // Create keyboard handler (host mode - commands go to local queue)
      const keyboardHandler = new KeyboardHandler(selectionManager, commandQueue, store, renderer);

      // Start the game loop
      gameLoop.start();
    }

    async function initializeClientMode() {
      // Initialize with empty world state so grid can render
      // The state will be updated when we receive data from host
      const initialWorld = store.getState();
      renderer.setWorld(initialWorld);

      let isReconnecting = false;
      let reconnectionAttempt = 0;

      const handleReconnection = () => {
        if (isReconnecting) return;
        isReconnecting = true;
        reconnectionAttempt++;

        let delay = 1000;
        let showPopup = false;

        if (reconnectionAttempt === 1) {
          // First attempt: 1s delay, silent
          delay = 1000;
          console.log('[Client] Connection lost, attempting silent reconnect in 1s...');
        } else if (reconnectionAttempt === 2) {
          // Second attempt: 2s delay, show popup
          delay = 2000;
          showPopup = true;
          console.log('[Client] Silent reconnect failed, showing popup and retrying in 2s...');
        } else {
          // Subsequent attempts: 5s delay, keep popup
          delay = 5000;
          showPopup = true;
          console.log(`[Client] Reconnect attempt ${reconnectionAttempt}, retrying in 5s...`);
        }

        if (showPopup) {
          connectionOverlay.show(`Connection lost! Trying to reconnect in ${delay / 1000}s...`);
        }

        // Wait before reconnecting
        setTimeout(async () => {
          if (clientMode) {
            try {
              await clientMode.reconnect();
              // Note: isReconnecting flag is NOT reset here.
              // It will be reset in onConnected if successful,
              // or handleReconnection will be called again by onDisconnected/onConnectionStateChange if failed.
              // However, since initiateConnection is async and might not trigger state changes immediately if it fails silently (e.g. no host),
              // we need to make sure we can try again.
              // But WebRTCPeer + Signaling will trigger events.

              // If reconnect() throws immediately, we need to schedule next attempt
              // But initiateConnection mostly sets up listeners and sends offer via signaling.

              // Key point: We need to reset isReconnecting so the NEXT failure event triggers this again.
              // But if we reset it too early, we might get multiple triggers for the same failure sequence.
              // Let's reset it after a short delay to allow for state transition events to fire?
              // Actually, better strategy:
              // The `reconnect` call initiates a NEW connection. The OLD connection is closed.
              // Events from the new connection will drive the loop.
              isReconnecting = false;
            } catch (error) {
              console.error('[Client] Reconnection attempt failed:', error);
              isReconnecting = false;
              // If it fails synchronously, trigger next attempt immediately (which will handle the delay)
              handleReconnection();
            }
          }
        }, delay);
      };

      // Initialize client mode
      clientMode = new ClientMode(store, signalingClient, {
        onConnected: () => {
          console.log('[Client] Connected to host');
          connectionOverlay.hide();
          isReconnecting = false;
          reconnectionAttempt = 0; // Reset attempts on success
        },
        onDisconnected: () => {
          console.log('[Client] Disconnected from host');
          handleReconnection();
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

          if (state === 'failed' || state === 'disconnected') {
            handleReconnection();
          }
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
    debugOverlay.setObjectCounts(world.objects.size, world.groundLayer.terrainObjects.size);
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

export { init };
