/**
 * WebRTC utilities for peer connections
 */
export class WebRTCPeer {
  private pc: RTCPeerConnection;
  private dataChannel: RTCDataChannel | null = null;
  private onDataChannelMessage: ((data: string) => void) | null = null;
  private onDataChannelOpen: (() => void) | null = null;
  private onDataChannelClose: (() => void) | null = null;

  constructor(config?: RTCConfiguration) {
    const defaultConfig: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    };

    this.pc = new RTCPeerConnection(config || defaultConfig);

    // Handle ICE candidates
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        // ICE candidate will be sent via signaling
        this.onIceCandidate?.(event.candidate);
      }
    };

    // Handle connection state changes
    this.pc.onconnectionstatechange = () => {
      // Only log significant state changes (not every intermediate state)
      if (this.pc.connectionState === 'connected' || this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
        console.log(`[WebRTC] Connection state: ${this.pc.connectionState}`);
      }
    };
  }

  private onIceCandidate: ((candidate: RTCIceCandidate) => void) | null = null;

  /**
   * Set handler for ICE candidates
   */
  onIceCandidateHandler(handler: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidate = handler;
  }

  /**
   * Create data channel (host side)
   */
  createDataChannel(label: string): RTCDataChannel {
    this.dataChannel = this.pc.createDataChannel(label, {
      ordered: true, // Reliable, ordered delivery
    });

    this.setupDataChannel(this.dataChannel);
    return this.dataChannel;
  }

  /**
   * Handle incoming data channel (client side)
   */
  setupIncomingDataChannel(): void {
    this.pc.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel);
    };
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      // Only log once when channel opens (not on every message)
      console.log(`[WebRTC] Data channel opened: ${channel.label}`);
      if (this.onDataChannelOpen) {
        this.onDataChannelOpen();
      }
    };

    channel.onclose = () => {
      if (this.onDataChannelClose) {
        this.onDataChannelClose();
      }
    };

    channel.onerror = (error) => {
      console.error('[WebRTC] Data channel error:', error);
    };

    channel.onmessage = (event) => {
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      } else {
        console.warn('[WebRTC] No message handler set up!');
      }
    };
  }

  /**
   * Set handler for data channel messages
   */
  onMessage(handler: (data: string) => void): void {
    this.onDataChannelMessage = handler;
  }

  /**
   * Set handler for data channel open
   */
  onOpen(handler: () => void): void {
    this.onDataChannelOpen = handler;
  }

  /**
   * Set handler for data channel close
   */
  onClose(handler: () => void): void {
    this.onDataChannelClose = handler;
  }

  /**
   * Send message via data channel
   */
  send(data: string): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.warn('[WebRTC] Cannot send: data channel not open');
      return;
    }
    this.dataChannel.send(data);
  }

  /**
   * Create offer (host side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /**
   * Create answer (client side)
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(description);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(candidate);
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    this.pc.close();
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }
}
