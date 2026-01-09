import { Store } from '../store/store';
import { WebRTCPeer } from './webrtc';
import { SignalingClient } from './signaling';
import { serializeNetworkMessage, deserializeNetworkMessage, NetworkMessage, InitialState, StateChangeEvent, BotAssignment } from './stateEvents';
import { serializeInputCommand, InputCommand, InputCommandType } from './inputCommands';
import { actions } from '../store/actions';
import { WorldState, createWorldState } from '@outside/core';
import { addTerrainObject } from '@outside/core';

export interface ClientCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onBotAssigned?: (botId: string | null) => void;
  onStepUpdate?: (step: number) => void;
}

/**
 * Client mode: connects to host and receives state updates
 */
export class ClientMode {
  private store: Store;
  private signalingClient: SignalingClient;
  private hostPeer: WebRTCPeer | null = null;
  private clientId: string;
  private hostPeerId: string | null = null;
  private assignedBotId: string | null = null;
  private callbacks: ClientCallbacks;
  private lastStep: number = 0;
  private pendingState: WorldState | null = null;

  constructor(
    store: Store,
    signalingClient: SignalingClient,
    callbacks: ClientCallbacks = {}
  ) {
    this.store = store;
    this.signalingClient = signalingClient;
    this.clientId = signalingClient.getPeerId() || 'unknown';
    this.callbacks = callbacks;
  }

  /**
   * Initialize client mode and connect to host
   * Note: Signaling client should already be connected before calling this
   */
  async initialize(): Promise<void> {
    // Register as client (signaling should already be connected)
    // Only register if not already registered
    if (this.signalingClient.getPeerId()) {
      this.signalingClient.registerClient();
    }

    // Listen for host status
    this.signalingClient.onHostStatusUpdate((isRunning, hostPeerId) => {
      if (isRunning && hostPeerId) {
        // Only initiate connection if we don't already have this host or a connection
        if (this.hostPeerId !== hostPeerId || !this.hostPeer) {
          this.hostPeerId = hostPeerId;
          console.log(`[Client] Host found: ${hostPeerId}`);
          // Initiate WebRTC connection
          this.initiateConnection();
        }
      } else {
        console.log('[Client] No host available');
      }
    });

    // Set up signaling message handlers
    this.setupSignalingHandlers();

    console.log('[Client] Initialized, waiting for host...');
  }

  /**
   * Initiate WebRTC connection to host
   */
  private async initiateConnection(): Promise<void> {
    if (!this.hostPeerId) {
      console.error('[Client] Cannot initiate connection: no host peer ID');
      return;
    }

    // Prevent multiple connection attempts
    if (this.hostPeer) {
      console.warn('[Client] Connection already initiated, ignoring duplicate call');
      return;
    }

    console.log('[Client] Initiating WebRTC connection to host...');

    this.hostPeer = new WebRTCPeer();
    
    // Set up incoming data channel
    this.hostPeer.setupIncomingDataChannel();

    // Set up message handler
    this.hostPeer.onMessage((data) => {
      this.handleHostMessage(data);
    });

    // Set up ICE candidate handler
    this.hostPeer.onIceCandidateHandler((candidate) => {
      if (this.hostPeerId) {
        this.signalingClient.sendSignalingMessage(this.hostPeerId, {
          type: 'ice-candidate',
          data: candidate,
        });
      }
    });

    // Set up connection handlers
    this.hostPeer.onOpen(() => {
      console.log('[Client] Data channel opened - connected to host');
      if (this.callbacks.onConnected) {
        this.callbacks.onConnected();
      }
    });

    this.hostPeer.onClose(() => {
      console.log('[Client] Data channel closed - disconnected from host');
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected();
      }
    });

    // Connection state is monitored by WebRTC callbacks

    // Create data channel first (as the offerer)
    this.hostPeer.createDataChannel('game-data');

    // Create offer
    const offer = await this.hostPeer.createOffer();

    // Send offer to host via signaling
    this.signalingClient.sendSignalingMessage(this.hostPeerId, {
      type: 'offer',
      data: offer,
    });
  }

  /**
   * Set up handlers for signaling messages
   */
  private setupSignalingHandlers(): void {
    // Handle answer from host (response to our offer)
    this.signalingClient.onMessage('answer', async (message: any) => {
      if (message.from === this.hostPeerId && this.hostPeer) {
        try {
          // Check connection state before setting remote description
          const state = this.hostPeer.getConnectionState();
          if (state === 'closed' || state === 'failed') {
            console.warn(`[Client] Cannot set remote description, connection state: ${state}`);
            return;
          }
          await this.hostPeer.setRemoteDescription(message.data);
          console.log('[Client] Set remote description (answer from host)');
        } catch (error) {
          console.error('[Client] Error setting remote description:', error);
        }
      }
    });

    // Handle ICE candidates from host
    this.signalingClient.onMessage('ice-candidate', async (message: any) => {
      if (message.from === this.hostPeerId && this.hostPeer) {
        try {
          await this.hostPeer.addIceCandidate(message.data);
        } catch (error) {
          console.error('[Client] Error adding ICE candidate:', error);
        }
      }
    });
  }

  /**
   * Handle message from host
   */
  private handleHostMessage(data: string): void {
    try {
      const message = deserializeNetworkMessage(data);
      this.processHostMessage(message);
    } catch (error) {
      console.error('[Client] Error processing host message:', error);
    }
  }

  /**
   * Process different types of host messages
   */
  private processHostMessage(message: NetworkMessage): void {
    switch (message.type) {
      case 'INITIAL_STATE':
        this.handleInitialState(message);
        break;

      case 'STATE_CHANGE_EVENT':
        this.handleStateChangeEvent(message);
        // Update step count from host
        if (this.callbacks.onStepUpdate) {
          this.callbacks.onStepUpdate(message.step);
        }
        break;

      case 'BOT_ASSIGNMENT':
        this.handleBotAssignment(message);
        break;

      default:
        console.warn('[Client] Unknown message type:', message);
    }
  }

  /**
   * Handle initial state snapshot
   */
  private handleInitialState(message: InitialState): void {
    console.log('[Client] Received initial state');
    
    // Create new world state from initial state
    const worldState = createWorldState();
    worldState.width = message.gridData.width;
    worldState.height = message.gridData.height;

    // Copy terrain from initial state if provided
    if (message.gridData.terrain) {
      for (const terrain of message.gridData.terrain) {
        addTerrainObject(worldState.groundLayer, terrain);
      }
    }

    // Add all objects
    for (const obj of message.gridData.objects) {
      worldState.objects.set(obj.id, obj);
      // Update grid if object has position
      if (obj.position) {
        const { x, y } = obj.position;
        if (x >= 0 && x < worldState.width && y >= 0 && y < worldState.height) {
          worldState.grid[y][x] = obj;
        }
      }
    }

    // Set world state
    this.store.dispatch(actions.setWorldState(worldState));
    
    // Update step count from initial state
    const initialStep = message.step || 0;
    this.lastStep = initialStep;
    
    // Update debug overlay with step count from host
    if (this.callbacks.onStepUpdate) {
      this.callbacks.onStepUpdate(initialStep);
    }
    
    // If we have an assigned bot, set it as selected
    if (this.assignedBotId && worldState.objects.has(this.assignedBotId)) {
      // Trigger bot assignment callback to set selection
      if (this.callbacks.onBotAssigned) {
        this.callbacks.onBotAssigned(this.assignedBotId);
      }
    }
  }

  /**
   * Handle state change event
   */
  private handleStateChangeEvent(message: StateChangeEvent): void {
    // Check if we're missing steps - if too far behind, request initial state
    if (message.step !== this.lastStep + 1) {
      const stepsBehind = message.step - this.lastStep;
      console.warn(`[Client] Step mismatch: expected ${this.lastStep + 1}, got ${message.step} (${stepsBehind} steps behind)`);
      
      // If we're more than 5 steps behind, request initial state
      if (stepsBehind > 5) {
        console.log('[Client] Too far behind, requesting initial state...');
        // Request initial state from host (host should send it when data channel opens)
        // For now, just update lastStep and continue
        this.lastStep = message.step;
      } else {
        // Just update lastStep and continue
        this.lastStep = message.step;
      }
    } else {
      this.lastStep = message.step;
    }

    // Create new world state from the state change event
    // Don't mutate the existing state (it's frozen by Immer)
    const newWorldState = createWorldState();
    newWorldState.width = message.gridData.width;
    newWorldState.height = message.gridData.height;

    // Copy terrain from current state (terrain doesn't change in state events, only objects)
    const currentState = this.store.getState();
    newWorldState.groundLayer = {
      terrainObjects: new Map(currentState.groundLayer.terrainObjects),
      terrainObjectsByPosition: new Map(currentState.groundLayer.terrainObjectsByPosition),
    };

    // Add all objects from the state change event
    for (const obj of message.gridData.objects) {
      newWorldState.objects.set(obj.id, obj);
      
      // Update grid if object has position
      if (obj.position) {
        const { x, y } = obj.position;
        if (x >= 0 && x < newWorldState.width && y >= 0 && y < newWorldState.height) {
          newWorldState.grid[y][x] = obj;
        }
      }
    }

    // Dispatch the new state
    this.store.dispatch(actions.setWorldState(newWorldState));
  }

  /**
   * Handle bot assignment
   */
  private handleBotAssignment(message: BotAssignment): void {
    if (message.clientId === this.clientId) {
      this.assignedBotId = message.botId;
      console.log(`[Client] Assigned bot: ${message.botId || 'none'}`);
      if (this.callbacks.onBotAssigned) {
        this.callbacks.onBotAssigned(message.botId);
      }
    }
  }

  /**
   * Send input command to host
   */
  sendInputCommand(command: InputCommandType, selectedBotId?: string, data?: { x?: number; y?: number }): void {
    if (!this.hostPeer) {
      console.warn('[Client] Cannot send input: no peer connection');
      return;
    }

    const connectionState = this.hostPeer.getConnectionState();
    if (connectionState !== 'connected') {
      console.warn(`[Client] Cannot send input: connection state is ${connectionState}`);
      return;
    }

    const inputCommand: InputCommand = {
      type: 'INPUT_COMMAND',
      clientId: this.clientId,
      command,
      selectedBotId, // Include selected bot ID for movement commands
      data,
    };

    console.log(`[Client] Sending input command: ${command}${selectedBotId ? ` (bot: ${selectedBotId})` : ''}`);
    this.hostPeer.send(serializeInputCommand(inputCommand));
  }

  /**
   * Get assigned bot ID
   */
  getAssignedBotId(): string | null {
    return this.assignedBotId;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.hostPeer) {
      this.hostPeer.close();
      this.hostPeer = null;
    }
    this.signalingClient.disconnect();
  }
}
