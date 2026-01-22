import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { WebRTCPeer } from './webrtc';
import { SignalingClient } from './signaling';
import { BotOwnershipTracker } from './botOwnership';
import {
  serializeNetworkMessage,
  deserializeNetworkMessage,
  InitialState,
  StateChangeEvent,
} from './stateEvents';
import { deserializeInputCommand, InputCommand } from './inputCommands';
import { WorldState } from '@outside/core';
import { BotAutonomy } from '../game/autonomy';
import { PlaybackState } from '../timeline/types';
import { GameLoop } from '../game/loop';
import { TimelineManager } from '../timeline/manager';

export interface HostCallbacks {
  onClientConnected?: (clientId: string) => void;
  onClientDisconnected?: (clientId: string) => void;
  onConnectionStateChange?: (clientId: string, state: RTCPeerConnectionState) => void;
}

/**
 * Host mode: runs game loop and manages client connections
 */
export class HostMode {
  private store: Store;
  private commandQueue: CommandQueue;
  private signalingClient: SignalingClient;
  private peerConnections: Map<string, WebRTCPeer> = new Map(); // clientId -> peer
  private botOwnership: BotOwnershipTracker;
  private currentStep: number = 0;
  private stepIntervalId: number | null = null;
  private callbacks: HostCallbacks;
  private debugOverlay?: any; // DebugOverlay - will be set via setter
  private autonomy?: BotAutonomy;
  private botLastMovedStep: Map<string, number> = new Map();
  private autonomyEnabled: boolean = false; // Default to disabled for manual control
  private playbackState: PlaybackState = PlaybackState.PLAYING;

  constructor(
    store: Store,
    commandQueue: CommandQueue,
    signalingClient: SignalingClient,
    callbacks: HostCallbacks = {}
  ) {
    this.store = store;
    this.commandQueue = commandQueue;
    this.signalingClient = signalingClient;
    this.botOwnership = new BotOwnershipTracker();
    this.callbacks = callbacks;

    // Note: State changes are now broadcast by the step counter at regular intervals
    // No need to subscribe to every store change - step counter handles it
  }

  setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;

    // Pause autonomy in non-PLAYING states
    if (state !== PlaybackState.PLAYING) {
      this.pauseAutonomy();
    } else {
      // Only resume if it was enabled before?
      // For now, let's keep autonomy explicit toggle, but ensure it doesn't run when paused.
      // The processAutonomy() check handles the PLAYING state check.
    }
  }

  getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  private pauseAutonomy(): void {
    // We don't change the enabled flag, just stop processing
    // But processAutonomy checks autonomyEnabled.
    // If we want to strictly enforce it:
    // Actually, processAutonomy checks this.playbackState now (will need to update it).
  }

  private resumeAutonomy(): void {
    // No-op
  }

  /**
   * Set debug overlay for step count updates
   */
  setDebugOverlay(debugOverlay: any): void {
    this.debugOverlay = debugOverlay;
  }

  /**
   * Get current step count
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Set current step count (for restoring from persisted state)
   */
  setCurrentStep(step: number): void {
    this.currentStep = step;
    if (this.debugOverlay) {
      this.debugOverlay.setStepCount(step);
    }
  }

  initialize(
    gameLoop: GameLoop,
    timelineManager: TimelineManager,
    options?: { local?: boolean }
  ): Promise<void> {
    gameLoop.setTimelineManager(timelineManager);

    // Sync playback state changes
    timelineManager.onStateChange((state) => {
      this.setPlaybackState(state);
      gameLoop.setPlaybackState(state);
    });

    return this.initializeInternal(options);
  }

  /**
   * Internal initialization logic
   */
  async initializeInternal(options?: { local?: boolean }): Promise<void> {
    if (!options?.local) {
      // Connect to signaling server
      await this.signalingClient.connect();
      this.signalingClient.registerHost();
    }

    // Set up available bots from current world state
    this.updateAvailableBots();

    // Also subscribe to store changes to update available bots when new bots are created
    this.store.subscribe(() => {
      this.updateAvailableBots();
    });

    // Listen for offers from clients
    this.signalingClient.onMessage('offer', async (message: any) => {
      const clientId = message.from;
      if (clientId && !this.peerConnections.has(clientId)) {
        await this.handleOffer(clientId, message.data);
      }
    });

    // Listen for ICE candidates from clients
    this.signalingClient.onMessage('ice-candidate', async (message: any) => {
      const clientId = message.from;
      if (clientId) {
        await this.handleIceCandidate(clientId, message.data);
      }
    });

    // Start step counter that increments at regular intervals (125ms)
    this.startStepCounter();

    // Initialize bot autonomy with world seed
    const world = this.store.getState();
    if (world.seed !== undefined) {
      this.autonomy = new BotAutonomy(world.seed);
      // console.log(`[Host] Initialized bot autonomy with seed: ${world.seed}`);
    } else {
      console.warn('[Host] World has no seed, bot autonomy disabled');
    }

    console.log('[Host] Initialized, waiting for clients...');
  }

  /**
   * Start step counter that increments at regular intervals
   */
  private startStepCounter(): void {
    const STEP_INTERVAL = 125; // 125ms, same as game loop

    this.stepIntervalId = window.setInterval(() => {
      // Always increment step count for UI purposes?
      // Or should time stop when paused?
      // Typically "game time" stops. "UI time" might continue.
      // If we pause, we stop updating the step count.
      if (this.playbackState !== PlaybackState.PLAYING) {
        return;
      }

      this.currentStep++;

      // Handle autonomous bot movement
      this.processAutonomy();

      // Persist step count
      this.store.getEventLogger().saveStepCount(this.currentStep);

      // Update debug overlay if available
      if (this.debugOverlay) {
        this.debugOverlay.setStepCount(this.currentStep);
      }

      // Broadcast step update to all clients (even if no state change)
      this.broadcastStepUpdate();
    }, STEP_INTERVAL);
  }

  /**
   * Toggle bot autonomy on/off
   */
  toggleAutonomy(): void {
    this.autonomyEnabled = !this.autonomyEnabled;
    console.log(`[Host] Bot autonomy ${this.autonomyEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current autonomy state
   */
  isAutonomyEnabled(): boolean {
    return this.autonomyEnabled;
  }

  /**
   * Process autonomous bot behavior
   */
  private processAutonomy(): void {
    if (!this.autonomy || !this.autonomyEnabled || this.playbackState !== PlaybackState.PLAYING)
      return;

    const world = this.store.getState();
    const bots = Array.from(world.objects.values()).filter((obj) => obj.type === 'bot');

    // #region agent log
    // fetch('http://127.0.0.1:7243/ingest/c24317a8-1790-427d-a3bc-82c53839c989',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'host.ts:processAutonomy',message:'Autonomy check start',data:{botCount:bots.length,queueLength:this.commandQueue.length(),step:this.currentStep},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    for (const bot of bots) {
      // Velocity check: ensure bot hasn't moved recently
      // Rule: 1 move per 2 steps at most
      const lastMoved = this.botLastMovedStep.get(bot.id) || -1;
      if (this.currentStep - lastMoved < 2) {
        continue;
      }

      // Simple heuristic: Only enqueue if queue isn't backed up significantly
      // Increased buffer since GameLoop now drains faster
      if (this.commandQueue.length() > bots.length * 4) {
        // #region agent log
        // fetch('http://127.0.0.1:7243/ingest/c24317a8-1790-427d-a3bc-82c53839c989',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'host.ts:processAutonomy',message:'Queue full, skipping bot',data:{botId:bot.id,queueLength:this.commandQueue.length()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        continue;
      }

      const command = this.autonomy.decideAction(bot, world);
      if (command) {
        // #region agent log
        // fetch('http://127.0.0.1:7243/ingest/c24317a8-1790-427d-a3bc-82c53839c989',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'host.ts:processAutonomy',message:'Bot action decided',data:{botId:bot.id,action:command.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        this.commandQueue.enqueue(command);

        // Update last moved step if it's a move command
        if (command.type === 'move') {
          this.botLastMovedStep.set(bot.id, this.currentStep);
        }
      }
    }
  }

  /**
   * Broadcast step update to all clients
   */
  private broadcastStepUpdate(): void {
    const world = this.store.getState();
    const gridData = {
      horizontalLimit: world.horizontalLimit,
      verticalLimit: world.verticalLimit,
      objects: Array.from(world.objects.values()),
    };

    const event: StateChangeEvent = {
      type: 'STATE_CHANGE_EVENT',
      step: this.currentStep,
      gridData,
    };

    const message = serializeNetworkMessage(event);

    // Send to all connected clients
    this.peerConnections.forEach((peer, clientId) => {
      if (peer.getConnectionState() === 'connected') {
        peer.send(message);
      }
    });
  }

  /**
   * Update available bots from current world state
   */
  private updateAvailableBots(): void {
    const world = this.store.getState();
    const botIds = Array.from(world.objects.values())
      .filter((obj) => obj.type === 'bot')
      .map((obj) => obj.id);
    this.botOwnership.setAvailableBots(botIds);
    // console.log(`[Host] Updated available bots: ${botIds.join(', ')}`);
  }

  /**
   * Handle incoming WebRTC offer from a client
   */
  async handleOffer(clientId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`[Host] Received offer from client ${clientId}`);

    // Check if we already have a connection for this client
    if (this.peerConnections.has(clientId)) {
      console.warn(
        `[Host] Already have connection for client ${clientId}, ignoring duplicate offer`
      );
      return;
    }

    const peer = new WebRTCPeer();

    // Set up message handler (before creating data channel)
    peer.onMessage((data) => {
      this.handleClientMessage(clientId, data);
    });

    // Set up ICE candidate handler
    peer.onIceCandidateHandler((candidate) => {
      this.signalingClient.sendSignalingMessage(clientId, {
        type: 'ice-candidate',
        data: candidate,
      });
    });

    // Set up connection state change handler
    peer.onConnectionStateChangeHandler((state) => {
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange(clientId, state);
      }
    });

    // Set up data channel handler (client will create the data channel)
    peer.setupIncomingDataChannel();

    // Set remote description first (the offer from client)
    await peer.setRemoteDescription(offer);

    // Create answer
    const answer = await peer.createAnswer();

    // Send answer via signaling
    this.signalingClient.sendSignalingMessage(clientId, {
      type: 'answer',
      data: answer,
    });

    // Store peer connection
    this.peerConnections.set(clientId, peer);

    // Wait for data channel to open before sending initial state
    const waitForDataChannel = () => {
      if (peer.getConnectionState() === 'connected') {
        // Send initial state to new client
        this.sendInitialState(clientId);

        // Assign a bot to the client
        const botId = this.botOwnership.assignBot(clientId);
        if (botId) {
          this.sendBotAssignment(clientId, botId);
        }

        if (this.callbacks.onClientConnected) {
          this.callbacks.onClientConnected(clientId);
        }

        console.log(`[Host] Client ${clientId} connected, assigned bot: ${botId || 'none'}`);
      } else {
        // Check again in a bit
        setTimeout(waitForDataChannel, 100);
      }
    };

    // Also set up handler for when data channel opens
    peer.onOpen(() => {
      // Update available bots before assigning (in case bots were created after initialization)
      this.updateAvailableBots();

      this.sendInitialState(clientId);
      const botId = this.botOwnership.assignBot(clientId);
      if (botId) {
        this.sendBotAssignment(clientId, botId);
      }
      if (this.callbacks.onClientConnected) {
        this.callbacks.onClientConnected(clientId);
      }
      console.log(
        `[Host] Client ${clientId} data channel opened, assigned bot: ${botId || 'none'}`
      );
    });
  }

  /**
   * Handle ICE candidate from client
   */
  async handleIceCandidate(clientId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peer = this.peerConnections.get(clientId);
    if (peer) {
      await peer.addIceCandidate(candidate);
    }
  }

  /**
   * Handle message from client
   */
  private handleClientMessage(connectionClientId: string, data: string): void {
    try {
      console.log(
        `[Host] Received message from connection ${connectionClientId}:`,
        data.substring(0, 100)
      );
      const message = deserializeInputCommand(data);
      console.log(`[Host] Parsed input command:`, message);

      // Use the clientId from the message, but also try connectionClientId as fallback
      // The message clientId is what the client thinks its ID is
      const messageClientId = message.clientId || connectionClientId;

      // Check if we have a bot assigned for either clientId
      let effectiveClientId = messageClientId;
      if (
        !this.botOwnership.getBotId(messageClientId) &&
        this.botOwnership.getBotId(connectionClientId)
      ) {
        // Bot is assigned to connectionClientId but message uses messageClientId
        // Update the assignment to use messageClientId
        const botId = this.botOwnership.getBotId(connectionClientId);
        if (botId) {
          this.botOwnership.unassignBot(connectionClientId);
          this.botOwnership.assignBot(messageClientId, botId);
          this.sendBotAssignment(messageClientId, botId);
          console.log(
            `[Host] Migrated bot assignment from ${connectionClientId} to ${messageClientId}`
          );
        }
        effectiveClientId = messageClientId;
      } else if (!this.botOwnership.getBotId(messageClientId)) {
        // No bot assigned for either, use messageClientId
        effectiveClientId = messageClientId;
      }

      this.handleInputCommand(effectiveClientId, message);
    } catch (error) {
      console.error(`[Host] Error handling message from ${connectionClientId}:`, error);
      console.error(`[Host] Message data:`, data);
    }
  }

  /**
   * Handle input command from client
   */
  private handleInputCommand(clientId: string, inputCommand: InputCommand): void {
    // console.log(`[Host] Processing input command from ${clientId}: ${inputCommand.command}`);

    // Update available bots before checking (bots might have been created after initialization)
    this.updateAvailableBots();

    // Determine which bot to use
    let botId: string | null = null;

    // For movement commands, use the selected bot ID from the client if provided
    if (
      inputCommand.selectedBotId &&
      ['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT'].includes(inputCommand.command)
    ) {
      const world = this.store.getState();
      // Verify the selected bot exists
      if (world.objects.has(inputCommand.selectedBotId)) {
        // Check if this bot is available (not assigned to another client, or assigned to this client)
        const currentOwner = Array.from(this.botOwnership.getAllOwnership().entries()).find(
          ([cid, bid]) => bid === inputCommand.selectedBotId
        )?.[0];

        if (!currentOwner || currentOwner === clientId) {
          // Bot is available or already assigned to this client
          botId = inputCommand.selectedBotId;
          // Update ownership if needed
          if (currentOwner !== clientId) {
            this.botOwnership.unassignBot(clientId); // Unassign old bot if any
            this.botOwnership.assignBot(clientId, botId);
            this.sendBotAssignment(clientId, botId);
            console.log(`[Host] Updated bot ownership: client ${clientId} now controls ${botId}`);
          }
        } else {
          console.warn(
            `[Host] Client ${clientId} selected bot ${inputCommand.selectedBotId} but it's controlled by ${currentOwner}`
          );
        }
      } else {
        console.warn(
          `[Host] Client ${clientId} selected bot ${inputCommand.selectedBotId} but it doesn't exist`
        );
      }
    }

    // Fallback to assigned bot if no selected bot ID or selection failed
    if (!botId) {
      botId = this.botOwnership.getBotId(clientId);
      if (!botId) {
        console.warn(
          `[Host] Client ${clientId} has no assigned bot. Current ownership:`,
          Array.from(this.botOwnership.getAllOwnership().entries()).map(
            ([cid, bid]) => `${cid.substring(0, 20)}... -> ${bid}`
          )
        );
        // Try to assign a bot if none is assigned
        const assignedBotId = this.botOwnership.assignBot(clientId);
        if (assignedBotId) {
          console.log(`[Host] Assigned bot ${assignedBotId} to client ${clientId}`);
          this.sendBotAssignment(clientId, assignedBotId);
          botId = assignedBotId;
        } else {
          console.error(`[Host] No available bots to assign to client ${clientId}`);
          // Log current world state for debugging
          const world = this.store.getState();
          const allBots = Array.from(world.objects.values()).filter((obj) => obj.type === 'bot');
          console.error(
            `[Host] World has ${allBots.length} bots:`,
            allBots.map((b) => b.id)
          );
          return;
        }
      }
    }

    console.log(`[Host] Client ${clientId} controls bot ${botId}`);

    // Convert input command to game command
    let gameCommand: any = null;

    switch (inputCommand.command) {
      case 'MOVE_UP':
        gameCommand = { type: 'move', id: botId, direction: 'up', distance: 1 };
        break;
      case 'MOVE_DOWN':
        gameCommand = { type: 'move', id: botId, direction: 'down', distance: 1 };
        break;
      case 'MOVE_LEFT':
        gameCommand = { type: 'move', id: botId, direction: 'left', distance: 1 };
        break;
      case 'MOVE_RIGHT':
        gameCommand = { type: 'move', id: botId, direction: 'right', distance: 1 };
        break;
      case 'SELECT_NEXT_BOT':
      case 'SELECT_PREV_BOT':
        // Bot selection is handled client-side, but we could implement bot switching here
        // For now, just log it
        console.log(
          `[Host] Client ${clientId} selected ${inputCommand.command} (client-side only)`
        );
        return;
      case 'CLICK_TILE':
        // Future: handle tile clicks
        console.log(
          `[Host] Client ${clientId} clicked tile at (${inputCommand.data?.x}, ${inputCommand.data?.y})`
        );
        return;
      default:
        console.warn(`[Host] Unknown input command: ${inputCommand.command}`);
        return;
    }

    if (gameCommand) {
      // console.log(`[Host] Enqueueing game command:`, gameCommand);
      // Enqueue game command
      this.commandQueue.enqueue(gameCommand);
    }
  }

  /**
   * Broadcast state change event to all connected clients
   * Note: Step count is now incremented by step counter, not here
   */
  private broadcastStateChange(world: WorldState): void {
    // Step count is now handled by step counter, just broadcast current state
    this.broadcastStepUpdate();
  }

  /**
   * Send initial state to a newly connected client
   */
  private sendInitialState(clientId: string): void {
    const world = this.store.getState();
    const gridData = {
      horizontalLimit: world.horizontalLimit,
      verticalLimit: world.verticalLimit,
      objects: Array.from(world.objects.values()),
      terrain: Array.from(world.groundLayer.terrainObjects.values()), // Include terrain in initial state
    };

    const initialState: InitialState = {
      type: 'INITIAL_STATE',
      gridData,
      step: this.currentStep, // Include current step count
      seed: world.seed, // Include master seed
    };

    const peer = this.peerConnections.get(clientId);
    if (peer) {
      // console.log(`[Host] Sending initial state to client ${clientId} (${gridData.objects.length} objects, ${gridData.terrain.length} terrain, step: ${this.currentStep})`);
      peer.send(serializeNetworkMessage(initialState));
    }
  }

  /**
   * Send bot assignment to client
   */
  private sendBotAssignment(clientId: string, botId: string): void {
    const peer = this.peerConnections.get(clientId);
    if (peer) {
      peer.send(
        serializeNetworkMessage({
          type: 'BOT_ASSIGNMENT',
          clientId,
          botId,
        })
      );
    }
  }

  /**
   * Disconnect a client
   */
  disconnectClient(clientId: string): void {
    const peer = this.peerConnections.get(clientId);
    if (peer) {
      peer.close();
    }
    this.peerConnections.delete(clientId);
    this.botOwnership.unassignBot(clientId);

    if (this.callbacks.onClientDisconnected) {
      this.callbacks.onClientDisconnected(clientId);
    }
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientCount(): number {
    return this.peerConnections.size;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.stepIntervalId !== null) {
      clearInterval(this.stepIntervalId);
      this.stepIntervalId = null;
    }
    this.peerConnections.forEach((peer) => peer.close());
    this.peerConnections.clear();
    this.signalingClient.disconnect();
  }
}
