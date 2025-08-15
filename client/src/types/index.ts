export interface Session {
  id: string;
  hostPublicKey: string;
  signature: string;
  expiresAt: Date;
  createdAt: Date;
  isActive: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: number;
  isLocal: boolean;
  encrypted?: boolean;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  peer?: any;
  dataChannel?: RTCDataChannel;
  session?: Session;
  isHost: boolean;
}

export interface CryptoKeys {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  sharedSecret?: CryptoKey;
  aesKey?: CryptoKey;
}

export interface QRData {
  sessionId: string;
  hostPublicKey: string;
  expiration: number;
  signature: string;
}

export interface AppSettings {
  autoClear: boolean;
  requireHttps: boolean;
  darkMode: boolean;
  showTyping: boolean;
}
