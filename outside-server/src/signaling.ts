import { WebSocket, WebSocketServer } from 'ws';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'register-host' | 'register-client' | 'host-status';
  from?: string;
  to?: string;
  data?: any;
}

export interface PeerConnection {
  peerId: string;
  ws: WebSocket;
  isHost: boolean;
}

export class SignalingServer {
  private wss: WebSocketServer;
  private peers: Map<string, PeerConnection> = new Map();
  private hostPeerId: string | null = null;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const peerId = this.generatePeerId();
      console.log(`[Signaling] New connection: ${peerId}`);

      const peer: PeerConnection = {
        peerId,
        ws,
        isHost: false,
      };

      this.peers.set(peerId, peer);

      // Send peer ID to client
      ws.send(JSON.stringify({
        type: 'peer-id',
        peerId,
      }));

      // Handle messages
      ws.on('message', (data: Buffer) => {
        try {
          const message: SignalingMessage = JSON.parse(data.toString());
          this.handleMessage(peerId, message);
        } catch (error) {
          console.error(`[Signaling] Error parsing message from ${peerId}:`, error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`[Signaling] Connection closed: ${peerId}`);
        if (this.hostPeerId === peerId) {
          this.hostPeerId = null;
          // Notify all clients that host disconnected
          this.broadcastToClients({
            type: 'host-status',
            data: { isRunning: false },
          });
        }
        this.peers.delete(peerId);
      });

      ws.on('error', (error) => {
        console.error(`[Signaling] WebSocket error for ${peerId}:`, error);
      });
    });
  }

  private handleMessage(fromPeerId: string, message: SignalingMessage): void {
    switch (message.type) {
      case 'register-host':
        this.registerHost(fromPeerId);
        break;

      case 'register-client':
        this.registerClient(fromPeerId);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Relay signaling messages between peers
        if (message.to) {
          this.relayMessage(fromPeerId, message.to, message);
        }
        break;

      default:
        console.warn(`[Signaling] Unknown message type: ${message.type}`);
    }
  }

  private registerHost(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.error(`[Signaling] Cannot register host: peer ${peerId} not found`);
      return;
    }

    peer.isHost = true;
    this.hostPeerId = peerId;
    console.log(`[Signaling] Host registered: ${peerId}`);

    // Notify host of successful registration
    peer.ws.send(JSON.stringify({
      type: 'host-registered',
      peerId,
    }));

    // Notify all clients that host is available
    this.broadcastToClients({
      type: 'host-status',
      data: { isRunning: true, hostPeerId: peerId },
    });
  }

  private registerClient(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.error(`[Signaling] Cannot register client: peer ${peerId} not found`);
      return;
    }

    peer.isHost = false;
    console.log(`[Signaling] Client registered: ${peerId}`);

    // Send host status to new client
    if (this.hostPeerId) {
      peer.ws.send(JSON.stringify({
        type: 'host-status',
        data: { isRunning: true, hostPeerId: this.hostPeerId },
      }));
    } else {
      peer.ws.send(JSON.stringify({
        type: 'host-status',
        data: { isRunning: false },
      }));
    }
  }

  private relayMessage(fromPeerId: string, toPeerId: string, message: SignalingMessage): void {
    const toPeer = this.peers.get(toPeerId);
    if (!toPeer) {
      console.warn(`[Signaling] Cannot relay message: peer ${toPeerId} not found`);
      return;
    }

    // Add 'from' field if not present
    const relayedMessage: SignalingMessage = {
      ...message,
      from: fromPeerId,
    };

    toPeer.ws.send(JSON.stringify(relayedMessage));
  }

  private broadcastToClients(message: SignalingMessage): void {
    this.peers.forEach((peer) => {
      if (!peer.isHost && peer.ws.readyState === WebSocket.OPEN) {
        peer.ws.send(JSON.stringify(message));
      }
    });
  }

  private generatePeerId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getHostPeerId(): string | null {
    return this.hostPeerId;
  }

  public getConnectedClients(): string[] {
    return Array.from(this.peers.values())
      .filter((peer) => !peer.isHost)
      .map((peer) => peer.peerId);
  }

  public isGameRunning(): boolean {
    return this.hostPeerId !== null;
  }
}
