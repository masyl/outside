/**
 * Signaling client for WebRTC connection setup
 */
export class SignalingClient {
  private ws: WebSocket | null = null;
  private peerId: string | null = null;
  private signalingUrl: string;
  private onPeerId: ((peerId: string) => void) | null = null;
  private onHostStatus: ((isRunning: boolean, hostPeerId?: string) => void) | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(signalingUrl: string = 'ws://localhost:3001') {
    this.signalingUrl = signalingUrl;
  }

  /**
   * Connect to signaling server
   */
  connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.signalingUrl);

        this.ws.onopen = () => {
          console.log('[Signaling] Connected to signaling server');
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[Signaling] Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Signaling] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Signaling] Connection closed');
          this.ws = null;
        };

        // Wait for peer ID
        this.onPeerId = (peerId) => {
          this.peerId = peerId;
          resolve(peerId);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Register as host
   */
  registerHost(): void {
    if (!this.ws || !this.peerId) {
      throw new Error('Not connected to signaling server');
    }
    this.send({ type: 'register-host' });
  }

  /**
   * Register as client
   */
  registerClient(): void {
    if (!this.ws || !this.peerId) {
      throw new Error('Not connected to signaling server');
    }
    this.send({ type: 'register-client' });
  }

  /**
   * Send signaling message (offer, answer, ICE candidate)
   */
  sendSignalingMessage(to: string, message: any): void {
    if (!this.ws || !this.peerId) {
      throw new Error('Not connected to signaling server');
    }
    this.send({
      ...message,
      to,
    });
  }

  /**
   * Set handler for host status updates
   */
  onHostStatusUpdate(handler: (isRunning: boolean, hostPeerId?: string) => void): void {
    this.onHostStatus = handler;
  }

  /**
   * Get current peer ID
   */
  getPeerId(): string | null {
    return this.peerId;
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'peer-id':
        if (this.onPeerId) {
          this.onPeerId(message.peerId);
        }
        break;

      case 'host-status':
        if (this.onHostStatus) {
          this.onHostStatus(message.data.isRunning, message.data.hostPeerId);
        }
        break;

      case 'host-registered':
        console.log('[Signaling] Host registered successfully');
        break;

      case 'client-registered':
        console.log('[Signaling] Client registered successfully');
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Relay to registered handler
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
        break;

      default:
        console.warn('[Signaling] Unknown message type:', message.type);
    }
  }

  /**
   * Register handler for specific message type
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }
}
