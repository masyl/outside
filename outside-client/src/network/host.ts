import { Store } from '../store/store';
import { CommandQueue } from '../commands/queue';
import { WebRTCPeer } from './webrtc';
import { SignalingClient } from './signaling';
import { BotOwnershipTracker } from './botOwnership';
import { serializeNetworkMessage, deserializeNetworkMessage, InitialState, StateChangeEvent } from './stateEvents';
import { deserializeInputCommand, InputCommand } from './inputCommands';
import { WorldState } from '@outside/core';

export interface HostCallbacks {
  onClientConnected?: (clientId: string) => void;
  onClientDisconnected?: (clientId: string) => void;
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
  private callbacks: HostCallbacks;

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

    // Subscribe to store changes to broadcast state change events
    this.store.subscribe((world) => {
      this.broadcastStateChange(world);
    });
  }

  /**
   * Initialize host mode
   */
  async initialize(): Promise<void> {
    // Connect to signaling server
    await this.signalingClient.connect();
    this.signalingClient.registerHost();

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

    console.log('[Host] Initialized, waiting for clients...');
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
    console.log(`[Host] Updated available bots: ${botIds.join(', ')}`);
  }

  /**
   * Handle incoming WebRTC offer from a client
   */
  async handleOffer(clientId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`[Host] Received offer from client ${clientId}`);

    // Check if we already have a connection for this client
    if (this.peerConnections.has(clientId)) {
      console.warn(`[Host] Already have connection for client ${clientId}, ignoring duplicate offer`);
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
      console.log(`[Host] Client ${clientId} data channel opened, assigned bot: ${botId || 'none'}`);
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
      console.log(`[Host] Received message from connection ${connectionClientId}:`, data.substring(0, 100));
      const message = deserializeInputCommand(data);
      console.log(`[Host] Parsed input command:`, message);
      
      // Use the clientId from the message, but also try connectionClientId as fallback
      // The message clientId is what the client thinks its ID is
      const messageClientId = message.clientId || connectionClientId;
      
      // Check if we have a bot assigned for either clientId
      let effectiveClientId = messageClientId;
      if (!this.botOwnership.getBotId(messageClientId) && this.botOwnership.getBotId(connectionClientId)) {
        // Bot is assigned to connectionClientId but message uses messageClientId
        // Update the assignment to use messageClientId
        const botId = this.botOwnership.getBotId(connectionClientId);
        if (botId) {
          this.botOwnership.unassignBot(connectionClientId);
          this.botOwnership.assignBot(messageClientId, botId);
          this.sendBotAssignment(messageClientId, botId);
          console.log(`[Host] Migrated bot assignment from ${connectionClientId} to ${messageClientId}`);
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
    console.log(`[Host] Processing input command from ${clientId}: ${inputCommand.command}`);
    
    // Update available bots before checking (bots might have been created after initialization)
    this.updateAvailableBots();
    
    // Determine which bot to use
    let botId: string | null = null;
    
    // For movement commands, use the selected bot ID from the client if provided
    if (inputCommand.selectedBotId && ['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT'].includes(inputCommand.command)) {
      const world = this.store.getState();
      // Verify the selected bot exists
      if (world.objects.has(inputCommand.selectedBotId)) {
        // Check if this bot is available (not assigned to another client, or assigned to this client)
        const currentOwner = Array.from(this.botOwnership.getAllOwnership().entries())
          .find(([cid, bid]) => bid === inputCommand.selectedBotId)?.[0];
        
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
          console.warn(`[Host] Client ${clientId} selected bot ${inputCommand.selectedBotId} but it's controlled by ${currentOwner}`);
        }
      } else {
        console.warn(`[Host] Client ${clientId} selected bot ${inputCommand.selectedBotId} but it doesn't exist`);
      }
    }
    
    // Fallback to assigned bot if no selected bot ID or selection failed
    if (!botId) {
      botId = this.botOwnership.getBotId(clientId);
      if (!botId) {
        console.warn(`[Host] Client ${clientId} has no assigned bot. Current ownership:`, 
          Array.from(this.botOwnership.getAllOwnership().entries()).map(([cid, bid]) => `${cid.substring(0, 20)}... -> ${bid}`));
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
          const allBots = Array.from(world.objects.values()).filter(obj => obj.type === 'bot');
          console.error(`[Host] World has ${allBots.length} bots:`, allBots.map(b => b.id));
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
        console.log(`[Host] Client ${clientId} selected ${inputCommand.command} (client-side only)`);
        return;
      case 'CLICK_TILE':
        // Future: handle tile clicks
        console.log(`[Host] Client ${clientId} clicked tile at (${inputCommand.data?.x}, ${inputCommand.data?.y})`);
        return;
      default:
        console.warn(`[Host] Unknown input command: ${inputCommand.command}`);
        return;
    }

    if (gameCommand) {
      console.log(`[Host] Enqueueing game command:`, gameCommand);
      // Enqueue game command
      this.commandQueue.enqueue(gameCommand);
    }
  }

  /**
   * Broadcast state change event to all connected clients
   */
  private broadcastStateChange(world: WorldState): void {
    this.currentStep++;

    const gridData = {
      width: world.width,
      height: world.height,
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
   * Send initial state to a newly connected client
   */
  private sendInitialState(clientId: string): void {
    const world = this.store.getState();
    const gridData = {
      width: world.width,
      height: world.height,
      objects: Array.from(world.objects.values()),
      terrain: Array.from(world.groundLayer.terrainObjects.values()), // Include terrain in initial state
    };

    const initialState: InitialState = {
      type: 'INITIAL_STATE',
      gridData,
    };

    const peer = this.peerConnections.get(clientId);
    if (peer) {
      console.log(`[Host] Sending initial state to client ${clientId} (${gridData.objects.length} objects, ${gridData.terrain.length} terrain)`);
      peer.send(serializeNetworkMessage(initialState));
    }
  }

  /**
   * Send bot assignment to client
   */
  private sendBotAssignment(clientId: string, botId: string): void {
    const peer = this.peerConnections.get(clientId);
    if (peer) {
      peer.send(serializeNetworkMessage({
        type: 'BOT_ASSIGNMENT',
        clientId,
        botId,
      }));
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
    this.peerConnections.forEach((peer) => peer.close());
    this.peerConnections.clear();
    this.signalingClient.disconnect();
  }
}
