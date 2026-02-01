import { PlaybackState } from './timeline/types';
import { Application as PixiApplication } from 'pixi.js';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { GameRoot } from './components/GameRoot';
import { Store } from './store/store';
import { WorldState } from '@outside/core';
import { CommandQueue } from './commands/queue';
import { GameRenderer } from './renderer/renderer';
import { GameLoop } from './game/loop';
import { MockCommandFeeder } from './mock/commandFeeder';
import { DebugBridge } from './debug/debugBridge'; // Replaces DebugOverlay
import { ConnectionOverlay } from './debug/connectionOverlay';
import { getZoomScale } from './renderer/coordinateSystem';
// import { KeystrokeOverlay } from './debug/keystrokeOverlay'; // Replaced by KeystrokeBridge/KeystrokeHelp

import { SelectionManager } from './input/selection';
import { KeyboardHandler } from './input/keyboardHandler';
import { TimelineManager } from './timeline/manager';
// import { TimelineBar } from './ui/timelineBar'; // Replaced by React component
import { executeCommand } from './commands/handlers';
import { parseCommand } from './commands/parser';
import { createWorldState } from '@outside/core';
import { actions } from './store/actions';
import { SignalingClient } from './network/signaling';
import { HostMode } from './network/host';
import { ClientMode } from './network/client';
import { CoordinateConverter } from './renderer/coordinateSystem';
import { isTileTappable, routeTileTapToCommands } from './input/tapRouting';
import { pickWorldAndTileFromScreen } from './input/tilePicking';
import { zoomManager } from './zoom/zoomState'; // Import zoomManager to sync debug
import { setupPixiReact } from './pixi-setup';

// Initialize Pixi React extensions
setupPixiReact();

type ConnectionMode = 'local' | 'host' | 'client';
const CONNECTION_MODE_KEY = 'outside-connection-mode';

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

  // Determine connection mode
  // Priority: options.mode (if specific) > localStorage > 'local' (default)
  let connectionMode: ConnectionMode = 'local';

  if (options?.mode && options.mode !== 'auto') {
    connectionMode = options.mode;
  } else {
    const storedMode = localStorage.getItem(CONNECTION_MODE_KEY);
    if (storedMode === 'host' || storedMode === 'client' || storedMode === 'local') {
      connectionMode = storedMode as ConnectionMode;
    }
  }

  console.log(`[Init] Connection mode: ${connectionMode}`);

  // Handle global mode switching shortcuts
  window.addEventListener('keydown', (event) => {
    // Only handle if Alt is pressed
    if (!event.altKey) return;

    let newMode: ConnectionMode | null = null;

    // Alt+H -> Host
    if (event.code === 'KeyH') {
      newMode = 'host';
    }
    // Alt+C -> Client
    else if (event.code === 'KeyC') {
      newMode = 'client';
    }
    // Alt+L -> Local
    else if (event.code === 'KeyL') {
      newMode = 'local';
    }

    if (newMode) {
      event.preventDefault();
      if (newMode !== connectionMode) {
        console.log(`[Init] Switching to ${newMode} mode...`);
        localStorage.setItem(CONNECTION_MODE_KEY, newMode);
        window.location.reload();
      } else {
        console.log(`[Init] Already in ${newMode} mode`);
      }
    }
  });

  // Create store early so it can be passed to React
  const store = options?.store || new Store();

  // Create TimelineManager early so it's available for GameRoot
  // This fixes the issue where Timeline UI never appears because timelineManager was null
  const eventLogger = store.getEventLogger();
  const timelineManager = new TimelineManager(store, eventLogger);

  // Game services that will be initialized when renderer is ready
  let renderer: GameRenderer | null = null;

  let commandQueue: CommandQueue | null = null;
  let selectionManager: SelectionManager | null = null;
  let gameLoop: GameLoop | null = null;
  let commandFeeder: MockCommandFeeder | null = null;
  let signalingClient: SignalingClient | null = null;

  // Use DebugBridge instead of DebugOverlay
  const debugOverlay = DebugBridge;

  // Create connection overlay for disconnection warnings
  const connectionOverlay = new ConnectionOverlay();

  // Note: hostMode will be set later, so we use a variable that gets updated
  let hostModeRef: HostMode | null = null;
  // Store reference for resetLevel function
  let timelineManagerRef: TimelineManager = timelineManager;

  // Callback when Pixi App is ready via React
  const onAppReady = async (app: PixiApplication) => {
    // Log which renderer was actually detected/used
    console.log(`[PixiJS] Using renderer: ${app.renderer.type || 'auto-detected'}`);

    // Add mouse tracking for visual debug layer
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointermove', (event) => {
      if (!renderer) return;
      // Ignore moves over interactive UI (e.g. timeline) to avoid fighting its cursor/drag logic.
      if ((event as any).target && (event as any).target !== app.stage) return;

      // Get global position
      const globalPos = event.global;

      // Convert to world coordinates by accounting for root container transformation
      const rootPos = renderer.getRootContainerPosition();

      // Use unified coordinate conversion - preserves floating point precision
      const zoomScale = getZoomScale();
      const { world: worldPos, tile } = pickWorldAndTileFromScreen({
        screen: globalPos,
        rootPos,
        zoomScale,
      });

      // Update visual debug layer with floating-point position
      // Note: gridX/gridY logging retained but we pass full precision to renderer
      const gridX = tile.x;
      const gridY = tile.y;

      // Removed noisy mouse position logging
      renderer.updateMousePosition(worldPos.x, worldPos.y);

      // Hover cursor for tappable tiles (bots or walkable terrain).
      const tappable = isTileTappable(store.getState(), { x: gridX, y: gridY });
      const canvas: HTMLCanvasElement | undefined = (app as any).canvas ?? (app as any).view;
      if (canvas) {
        const nextCursor = tappable ? 'pointer' : 'default';
        if (canvas.style.cursor !== nextCursor) {
          canvas.style.cursor = nextCursor;
        }
      }
    });

    // Tap/click support (mouse + touch). Tile-based picking via stage events.
    app.stage.on('pointertap', (event) => {
      if (!renderer) return;
      // Ignore taps on interactive UI children (e.g. timeline).
      if ((event as any).target && (event as any).target !== app.stage) return;

      const globalPos = event.global;
      const rootPos = renderer.getRootContainerPosition();
      const zoomScale = getZoomScale();
      const { tile } = pickWorldAndTileFromScreen({ screen: globalPos, rootPos, zoomScale });
      const x = tile.x;
      const y = tile.y;

      if (connectionMode === 'client') {
        console.log(`[Tap] client: send CLICK_TILE (${x}, ${y})`);
        // TODO: Implement client mode sendInputCommand
        // ClientMode?.sendInputCommand('CLICK_TILE', undefined, { x, y });
        return;
      }

      // Local/host mode: route to deterministic commands and enqueue locally.
      if (!commandQueue || !hostModeRef) return;
      const world = store.getState();
      const routed = routeTileTapToCommands({
        world,
        tile: { x, y },
        step: hostModeRef.getCurrentStep(),
      });
      if (routed.commands.length === 0) return;

      if (routed.resolved.kind === 'bot') {
        const next = routed.commands[0]?.type;
        console.log(`[Tap] local: bot ${routed.resolved.botId} → ${String(next)}`);
      } else if (routed.resolved.kind === 'walkable-terrain') {
        console.log(
          `[Tap] local: tile (${x}, ${y}) → spawn ${routed.resolved.spawnedBotId} follow ${routed.resolved.targetBotId}`
        );
      }
      commandQueue.enqueueMany(routed.commands);
    });

    // Toggle debug grid when debug overlay visibility changes
    debugOverlay.onVisibilityChange((visible) => {
      if (!renderer) return;
      renderer.updateBotDebugGrid(store.getState(), visible);
    });

    // Sync zoom state with debug overlay
    zoomManager.addZoomChangeListener((level, scale) => {
      debugOverlay.setZoomLevel(level, scale);
    });
    // Initial sync
    debugOverlay.setZoomLevel(zoomManager.getLevel(), zoomManager.getScale());

    // Update debug overlay with object count
    store.subscribe((world: WorldState) => {
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

    console.log('Outside platform initialized. Enjoy!');
  };

  // Callback when Renderer is ready from LevelViewport
  const onRendererReady = async (rendererInstance: GameRenderer) => {
    renderer = rendererInstance;

    // Ensure debug grid matches persisted visibility state
    renderer.updateBotDebugGrid(store.getState(), debugOverlay.isVisible());

    // Create command queue
    commandQueue = new CommandQueue();

    // Create selection manager
    selectionManager = new SelectionManager();

    // Create game loop (pass debug overlay for step counting)
    // Note: DebugBridge has same interface as DebugOverlay for what GameLoop needs (setStepCount)
    // We cast it to any because GameLoop expects to be a class instance, but DebugBridge is static
    // We should probably interface GameLoop better, but for now this works as DebugBridge has static methods matching instance methods
    gameLoop = new GameLoop(store, commandQueue, renderer, debugOverlay as any);

    // Create mock command feeder
    commandFeeder = new MockCommandFeeder(commandQueue);

    // Create signaling client for host/client detection
    signalingClient = new SignalingClient('ws://localhost:3001');

    // Reset level function - Full reset: clear events, reset step count, reinitialize level
    const resetLevel = () => {
      console.log(
        '[Debug] Resetting level (full reset: clear events, reset step count, reinitialize)...'
      );

      // Clear event log and step count
      const eventLogger = store.getEventLogger();
      eventLogger.clearEvents(); // This also clears STEP_COUNT_KEY

      // Reset step count explicitly (in case it's stored elsewhere)
      eventLogger.saveStepCount(0);

      // Reset timeline manager pointer to 0 if it exists
      if (timelineManagerRef) {
        // Reset the internal pointer by going to step 0
        timelineManagerRef.goToStep(0);
      }

      // Reset store to initial state (this will generate a NEW random seed)
      const newState = createWorldState();
      store.dispatch(actions.setWorldState(newState));
      console.log(`[Debug] Generated new master seed: ${newState.seed}`);

      // Reload level
      commandFeeder!.loadLevel('/levels/demo.md').then(() => {
        const terrainCommands = commandFeeder!.getInitialTerrainCommands();
        for (const command of terrainCommands) {
          executeCommand(store, command);
        }
        commandFeeder!.feedBotCommands();
        renderer!.setWorld(store.getState());
        // Mark game as started after reset
        store.start();

        // Tag the current step as "LevelStart" (right after level initialization)
        setTimeout(() => {
          const events = eventLogger.loadEvents();
          if (events.length > 0) {
            const lastStep = events.length - 1;
            eventLogger.tagStep(lastStep, 'LevelStart');
            console.log(`[Debug] Tagged step ${lastStep} as LevelStart (reset)`);
          }
        }, 0);

        console.log('[Debug] Level reset complete');
      });
    };

    // Toggle freeze/unfreeze (autonomy) function
    const toggleFreeze = () => {
      if (hostModeRef) {
        hostModeRef.toggleAutonomy();
      }
    };

    const isFreezeEnabled = () => {
      return hostModeRef ? hostModeRef.isAutonomyEnabled() : false;
    };

    // Handle window resize
    window.addEventListener('resize', () => {
      // renderer.resize() handles both app renderer resize and viewport centering
      // It also ensures resolution stays at 1 for pixel-perfect rendering
      renderer!.resize();
    });

    // Determine host/client mode and initialize game
    async function initializeGame() {
      let hostMode: HostMode | null = null;
      let clientMode: ClientMode | null = null;

      try {
        if (connectionMode === 'local') {
          console.log('[Init] Starting in LOCAL mode (no signaling).');
          debugOverlay.setMode('local');
          // Local mode behaves like host but without network/signaling
          await initializeHostMode({ local: true, startupCommands: options?.startupCommands });
          return;
        }

        // For Host and Client modes, we need to connect to signaling server first
        console.log('[Init] Connecting to signaling server...');
        await signalingClient!.connect();

        if (connectionMode === 'host') {
          console.log('[Init] Starting in HOST mode.');
          debugOverlay.setMode('host');
          signalingClient!.registerHost();
          await initializeHostMode({ startupCommands: options?.startupCommands });
          return;
        }

        if (connectionMode === 'client') {
          console.log('[Init] Starting in CLIENT mode.');
          debugOverlay.setMode('client');
          await initializeClientMode();
          return;
        }
      } catch (error) {
        console.error('[Init] Error initializing game mode:', error);

        // Fallback to local mode if connection/initialization fails
        if (connectionMode !== 'local') {
          console.log('[Init] Falling back to LOCAL mode due to error.');
          debugOverlay.setMode('local');
          // Ensure we try to proceed locally even if signaling failed
          try {
            await initializeHostMode({ local: true, startupCommands: options?.startupCommands });
          } catch (localError) {
            console.error('[Init] Fatal: Failed to initialize local fallback:', localError);
          }
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
          await commandFeeder!.loadLevel('/levels/demo.md');

          // Process all initial terrain commands immediately before game loop starts
          console.log('[Init] Processing initial terrain commands...');
          const terrainCommands = commandFeeder!.getInitialTerrainCommands();
          for (const command of terrainCommands) {
            executeCommand(store, command);
          }
          console.log(
            `[Init] Processed ${terrainCommands.length} terrain commands. Terrain should now be visible.`
          );
        }

        // Initial render to show terrain
        renderer!.setWorld(store.getState());

        // Load and replay persisted events to restore runtime state
        console.log('[Init] Loading persisted game state...');
        const eventLogger = store.getEventLogger();
        const persistedEvents = eventLogger.loadEvents();
        const hasPersistedEvents = persistedEvents.length > 0;

        // Create new world state with seed if starting fresh
        if (!hasPersistedEvents) {
          // Re-create world state to ensure it has a fresh seed if this is a new game
          // Actually, store already has a state from init, but let's make sure it's fresh
        } else {
          // If replaying, we might want to recover seed from events?
          // Currently events don't store of the master seed, only state changes.
          // But we can check if of the store state has a seed.
        }

        if (hasPersistedEvents) {
          console.log(`[Init] Found ${persistedEvents.length} persisted events, replaying...`);
          eventLogger.replayEvents(store, persistedEvents, () => {
            // After replay completes, update renderer to create sprites for all objects
            // This ensures sprites exist before animation controller tries to animate them
            renderer!.update(store.getState());
          });
          console.log('[Init] Game state restored from persisted events');

          // The replayed state might not have seed if it was created before seed field existed.
          // Ensure seed is present.
          const world = store.getState();
          if (world.seed === undefined) {
            console.info('[Init] Restored state is missing seed, generating new one...');
            // We need to update of the state with a seed without triggering a new event
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
          commandFeeder!.feedBotCommands();

          // Tag the current step as "LevelStart" (right after initial level initialization)
          setTimeout(() => {
            const eventLogger = store.getEventLogger();
            const events = eventLogger.loadEvents();
            if (events.length > 0) {
              const lastStep = events.length - 1;
              eventLogger.tagStep(lastStep, 'LevelStart');
              console.log(`[Debug] Tagged step ${lastStep} as LevelStart (initial load)`);
            }
          }, 0);
        } else {
          console.log(
            '[Init] Skipping bot commands from level file (bots already restored from events)'
          );

          // Still tag LevelStart even when restoring from events (at step 0)
          setTimeout(() => {
            const eventLogger = store.getEventLogger();
            const events = eventLogger.loadEvents();
            if (events.length > 0) {
              // Tag the last event from the loaded level initialization
              const lastStep = events.length - 1;
              eventLogger.tagStep(lastStep, 'LevelStart');
              console.log(`[Debug] Tagged step ${lastStep} as LevelStart (restored)`);
            }
          }, 0);
        }

        // Initialize host mode
        hostMode = new HostMode(store, commandQueue!, signalingClient!, {
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

        hostModeRef = hostMode;

        // Set debug overlay for step count updates
        // Note: hostMode expects DebugOverlay instance, we pass DebugBridge (static class)
        // This works because methods match, but TS might complain if we didn't cast in GameLoop
        hostMode.setDebugOverlay(debugOverlay as any);

        // Restore step count from persisted state if available
        const restoredStep = eventLogger.loadStepCount();
        if (restoredStep > 0) {
          hostMode.setCurrentStep(restoredStep);
          debugOverlay.setStepCount(restoredStep);
        }

        // Timeline Manager is already created early in init(), so just update reference
        timelineManagerRef = timelineManager;

        // Subscribe to timeline state changes to update debug overlay
        timelineManager.onStateChange((state) => {
          debugOverlay.setPlaybackMode(state);
        });

        // Update timeline cursor position when it changes
        const updateTimelineCursor = () => {
          const timelineState = timelineManager!.getState();
          debugOverlay.setTimelineCursor(timelineState.currentStep, timelineState.totalSteps);
        };

        // Subscribe to position changes (need to check if this exists in TimelineManager)
        // For now, update periodically and on state changes
        timelineManager.onStateChange(() => {
          updateTimelineCursor();
        });

        // Create keyboard handler (host mode - commands go to local queue)
        // Inject timeline manager for playback controls
        const keyboardHandler = new KeyboardHandler(
          selectionManager!,
          commandQueue!,
          store,
          renderer!,
          undefined,
          timelineManager
        );

        // Connect GameLoop, DebugOverlay, and callbacks to KeyboardHandler for timeline controls
        keyboardHandler.setGameLoop(gameLoop!);
        keyboardHandler.setDebugOverlay(debugOverlay as any);
        keyboardHandler.setOnResetLevel(resetLevel);
        keyboardHandler.setOnToggleAutonomy(toggleFreeze, isFreezeEnabled);

        // Set timeline manager on game loop
        gameLoop!.setTimelineManager(timelineManager);

        // Create and initialize Timeline Bar (Moved to React component in GameRoot)
        // const timelineBar = new TimelineBar(app, timelineManager);
        // app.stage.addChild(timelineBar);

        // Add resize handler for timeline bar
        const resizeTimelineBar = () => {
          // timelineBar.onResize(); // React handles resize
        };
        window.addEventListener('resize', resizeTimelineBar);

        // Initial playback state
        timelineManager.setPlaybackState(PlaybackState.PLAYING);
        gameLoop!.setPlaybackState(PlaybackState.PLAYING);

        // Initial debug overlay updates
        debugOverlay.setPlaybackMode(PlaybackState.PLAYING);
        updateTimelineCursor();

        await hostMode.initialize(gameLoop!, timelineManager, { local: isLocal });

        // Update client count initially
        debugOverlay.setClientCount(hostMode.getConnectedClientCount());

        // Periodically update timeline cursor (in case navigation happens via other means)
        setInterval(() => {
          updateTimelineCursor();
        }, 250);

        // Start the game loop
        gameLoop!.start();
      }

      async function initializeClientMode() {
        // Initialize with empty world state so grid can render
        // The state will be updated when we receive data from host
        const initialWorld = store.getState();
        renderer!.setWorld(initialWorld);

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

                // Key point: We need to reset isReconnecting so NEXT failure event triggers this again.
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
        clientMode = new ClientMode(store, signalingClient!, {
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
          selectionManager!,
          null, // No local command queue in client mode
          store,
          renderer!,
          (command, selectedBotId, data) => {
            clientMode?.sendInputCommand(command, selectedBotId, data);
          }
        );

        // Subscribe to store for rendering (client receives state from host)
        store.subscribe((world: WorldState) => {
          renderer!.update(world);
        });
      }
    }

    // Initialize the game
    initializeGame();

    // Set initial selection when bots are available
    // Subscribe to store to detect when bots are created
    let initialSelectionSet = false;
    const unsubscribeSelection = store.subscribe((world: WorldState) => {
      if (!initialSelectionSet && world.objects.size >= 3) {
        // All 3 bots should be created and placed by now
        const firstBotId = selectionManager!.cycleNext(world);
        if (firstBotId) {
          renderer!.updateSelection(world, firstBotId);
          initialSelectionSet = true;
          unsubscribeSelection(); // Unsubscribe after setting initial selection
        }
      }
    });
  };

  // Create React root and render GameRoot
  const root = createRoot(appElement);
  root.render(
    React.createElement(GameRoot, {
      width: appElement.clientWidth || window.innerWidth,
      height: appElement.clientHeight || window.innerHeight,
      onAppReady: onAppReady,
      onRendererReady: onRendererReady,
      store: store,
      timelineManager: timelineManager,
    })
  );
}

// Start the application
init().catch((error) => {
  console.error('Failed to initialize game:', error);
});

export { init };
