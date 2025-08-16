import { CryptoManager } from './crypto';
import { generateSecureUUID } from './uuid';
import type { Message } from '../types';

export class WebRTCManager {
  private peer: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private crypto: CryptoManager;
  private websocket: WebSocket | null = null;
  private sessionId: string | null = null;
  private clientId: string;
  private isOfflineMode: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  
  // Event handlers
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onDataChannelOpen?: () => void;
  public onDataChannelClose?: () => void;
  public onMessage?: (message: Message) => void;
  public onError?: (error: Error) => void;

  constructor() {
    this.crypto = new CryptoManager();
    this.clientId = generateSecureUUID();
  }

  async initializeHost(sessionId: string): Promise<string> {
    this.sessionId = sessionId;
    await this.crypto.generateKeyPair();
    
    // Setup WebSocket connection with error handling
    try {
      await this.connectWebSocket();
    } catch (error) {
      console.warn('Failed to connect to signaling server, operating in offline mode');
      this.isOfflineMode = true;
    }
    
    // Create RTCPeerConnection
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Create data channel
    this.dataChannel = this.peer.createDataChannel('messages', {
      ordered: true
    });
    
    this.setupDataChannelHandlers();
    this.setupPeerConnectionHandlers();
    
    return await this.crypto.exportPublicKey();
  }

  async initializeClient(sessionId: string, hostPublicKey: string): Promise<string> {
    this.sessionId = sessionId;
    await this.crypto.generateKeyPair();
    
    // Import host's public key and derive shared secret
    const hostKey = await this.crypto.importPublicKey(hostPublicKey);
    await this.crypto.deriveSharedSecret(hostKey);
    
    // Setup WebSocket connection
    await this.connectWebSocket();
    
    // Create RTCPeerConnection
    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.setupPeerConnectionHandlers();
    
    // Handle incoming data channel
    this.peer.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };
    
    return await this.crypto.exportPublicKey();
  }

  async completeKeyExchange(peerPublicKey: string): Promise<void> {
    const peerKey = await this.crypto.importPublicKey(peerPublicKey);
    await this.crypto.deriveSharedSecret(peerKey);
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connectionAttempts++;
      
      if (this.connectionAttempts > this.maxConnectionAttempts) {
        console.warn('Max WebSocket connection attempts reached, operating in offline mode');
        this.isOfflineMode = true;
        resolve();
        return;
      }

      // Use backend URL from environment variables
      const backendUrl = import.meta.env.VITE_SIGNALING_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
      const wsUrl = backendUrl.replace('http', 'ws') + '/ws';
      
      try {
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected successfully');
          this.connectionAttempts = 0; // Reset attempts on successful connection
          // Join the session
          this.websocket?.send(JSON.stringify({
            type: 'join-session',
            sessionId: this.sessionId,
            clientId: this.clientId
          }));
          resolve();
        };
        
        this.websocket.onerror = (error) => {
          console.warn(`WebSocket connection failed (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
          // Don't reject immediately, allow retry or fallback to offline mode
          if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.isOfflineMode = true;
            resolve();
          } else {
            reject(error);
          }
        };

        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          if (!this.isOfflineMode && this.connectionAttempts < this.maxConnectionAttempts) {
            // Attempt to reconnect after a delay
            setTimeout(() => {
              this.connectWebSocket().catch(() => {
                this.isOfflineMode = true;
              });
            }, 2000);
          }
        };
        
        this.websocket.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            await this.handleSignalingMessage(message);
          } catch (error) {
            console.error('WebSocket message error:', error);
          }
        };

        // Set a timeout for connection
        setTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket connection timeout');
            this.websocket?.close();
            if (this.connectionAttempts >= this.maxConnectionAttempts) {
              this.isOfflineMode = true;
              resolve();
            } else {
              reject(new Error('Connection timeout'));
            }
          }
        }, 5000);

      } catch (error) {
        console.error('WebSocket creation failed:', error);
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.isOfflineMode = true;
          resolve();
        } else {
          reject(error);
        }
      }
    });
  }

  private async handleSignalingMessage(message: any): Promise<void> {
    if (!this.peer) return;
    
    switch (message.type) {
      case 'webrtc-offer':
        await this.peer.setRemoteDescription(message.offer);
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(answer);
        
        this.websocket?.send(JSON.stringify({
          type: 'webrtc-answer',
          answer: answer
        }));
        break;
        
      case 'webrtc-answer':
        await this.peer.setRemoteDescription(message.answer);
        break;
        
      case 'ice-candidate':
        await this.peer.addIceCandidate(message.candidate);
        break;
        
      case 'peer-joined':
        // Create offer for new peer
        if (this.dataChannel) {
          const offer = await this.peer.createOffer();
          await this.peer.setLocalDescription(offer);
          
          this.websocket?.send(JSON.stringify({
            type: 'webrtc-offer',
            offer: offer
          }));
        }
        break;
        
      case 'key-exchange':
        // Handle key exchange for the host
        if (message.clientPublicKey && !this.crypto.isReady()) {
          try {
            const clientKey = await this.crypto.importPublicKey(message.clientPublicKey);
            await this.crypto.deriveSharedSecret(clientKey);
            console.log('Host: Key exchange completed');
          } catch (error) {
            console.error('Host: Key exchange failed:', error);
            this.onError?.(error as Error);
          }
        }
        break;
        
      case 'typing':
        // Handle typing indicators
        break;
    }
  }

  private setupPeerConnectionHandlers(): void {
    if (!this.peer) return;
    
    this.peer.onconnectionstatechange = () => {
      if (this.peer) {
        this.onConnectionStateChange?.(this.peer.connectionState);
      }
    };
    
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.websocket?.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate
        }));
      }
    };
  }

  private setupDataChannelHandlers(): void {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
      this.onDataChannelOpen?.();
    };
    
    this.dataChannel.onclose = () => {
      this.onDataChannelClose?.();
    };
    
    this.dataChannel.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.encrypted && this.crypto.isReady()) {
          const decryptedContent = await this.crypto.decrypt(data.ciphertext, data.nonce);
          const message: Message = {
            id: data.id,
            content: decryptedContent,
            timestamp: data.timestamp,
            isLocal: false,
            encrypted: true
          };
          this.onMessage?.(message);
        }
      } catch (error) {
        console.error('Message decryption error:', error);
        this.onError?.(error as Error);
      }
    };
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }
    
    if (!this.crypto.isReady()) {
      throw new Error('Encryption not ready');
    }
    
    const { ciphertext, nonce } = await this.crypto.encrypt(content);
    
    const message = {
      id: generateSecureUUID(),
      ciphertext,
      nonce,
      timestamp: Date.now(),
      encrypted: true
    };
    
    this.dataChannel.send(JSON.stringify(message));
  }

  sendTypingIndicator(isTyping: boolean): void {
    this.websocket?.send(JSON.stringify({
      type: 'typing',
      isTyping
    }));
  }

  sendKeyExchange(clientPublicKey: string): void {
    this.websocket?.send(JSON.stringify({
      type: 'key-exchange',
      clientPublicKey
    }));
  }

  disconnect(): void {
    this.dataChannel?.close();
    this.peer?.close();
    this.websocket?.close();
    this.crypto.cleanup();
    
    this.dataChannel = null;
    this.peer = null;
    this.websocket = null;
    this.sessionId = null;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peer?.connectionState || null;
  }

  isDataChannelOpen(): boolean {
    return this.dataChannel?.readyState === 'open';
  }
}
