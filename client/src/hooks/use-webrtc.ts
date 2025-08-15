import { useState, useEffect, useCallback, useRef } from 'react';
import { WebRTCManager } from '../lib/webrtc';
import { generateSecureUUID } from '../lib/uuid';
import type { ConnectionState, Message } from '../types';

export function useWebRTC() {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected',
    isHost: false
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const webrtcRef = useRef<WebRTCManager | null>(null);

  useEffect(() => {
    return () => {
      webrtcRef.current?.disconnect();
    };
  }, []);

  const initializeHost = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      setConnectionState(prev => ({ ...prev, status: 'connecting', isHost: true }));
      
      const manager = new WebRTCManager();
      webrtcRef.current = manager;
      
      // Setup event handlers
      manager.onConnectionStateChange = (state) => {
        setConnectionState(prev => ({
          ...prev,
          status: state === 'connected' ? 'connected' : 
                  state === 'failed' || state === 'disconnected' ? 'disconnected' : 'connecting'
        }));
      };
      
      manager.onDataChannelOpen = () => {
        setConnectionState(prev => ({ ...prev, status: 'connected' }));
      };
      
      manager.onDataChannelClose = () => {
        setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
      };
      
      manager.onMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };
      
      manager.onError = (error) => {
        setError(error.message);
        setConnectionState(prev => ({ ...prev, status: 'error' }));
      };
      
      const publicKey = await manager.initializeHost(sessionId);
      
      setConnectionState(prev => ({
        ...prev,
        peer: manager,
        session: { id: sessionId } as any
      }));
      
      return publicKey;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize host');
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  }, []);

  const joinSession = useCallback(async (sessionId: string, hostPublicKey: string) => {
    try {
      setError(null);
      setConnectionState(prev => ({ ...prev, status: 'connecting', isHost: false }));
      
      const manager = new WebRTCManager();
      webrtcRef.current = manager;
      
      // Setup event handlers
      manager.onConnectionStateChange = (state) => {
        setConnectionState(prev => ({
          ...prev,
          status: state === 'connected' ? 'connected' : 
                  state === 'failed' || state === 'disconnected' ? 'disconnected' : 'connecting'
        }));
      };
      
      manager.onDataChannelOpen = () => {
        setConnectionState(prev => ({ ...prev, status: 'connected' }));
      };
      
      manager.onDataChannelClose = () => {
        setConnectionState(prev => ({ ...prev, status: 'disconnected' }));
      };
      
      manager.onMessage = (message) => {
        setMessages(prev => [...prev, message]);
      };
      
      manager.onError = (error) => {
        setError(error.message);
        setConnectionState(prev => ({ ...prev, status: 'error' }));
      };
      
      const clientPublicKey = await manager.initializeClient(sessionId, hostPublicKey);
      
      // Send client's public key to the host via WebSocket for key exchange
      manager.sendKeyExchange(clientPublicKey);
      
      setConnectionState(prev => ({
        ...prev,
        peer: manager,
        session: { id: sessionId } as any
      }));
      
      return clientPublicKey;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join session');
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  }, []);

  const completeConnection = useCallback(async (peerPublicKey: string) => {
    try {
      if (!webrtcRef.current) {
        throw new Error('WebRTC manager not initialized');
      }
      
      await webrtcRef.current.completeKeyExchange(peerPublicKey);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete connection');
      setConnectionState(prev => ({ ...prev, status: 'error' }));
      throw error;
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    try {
      if (!webrtcRef.current) {
        throw new Error('WebRTC manager not initialized');
      }
      
      await webrtcRef.current.sendMessage(content);
      
      // Add local message to state
      const localMessage: Message = {
        id: generateSecureUUID(),
        content,
        timestamp: Date.now(),
        isLocal: true,
        encrypted: true
      };
      
      setMessages(prev => [...prev, localMessage]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      throw error;
    }
  }, []);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    webrtcRef.current?.sendTypingIndicator(isTyping);
  }, []);

  const disconnect = useCallback(() => {
    webrtcRef.current?.disconnect();
    webrtcRef.current = null;
    setConnectionState({
      status: 'disconnected',
      isHost: false
    });
    setMessages([]);
    setError(null);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    connectionState,
    messages,
    error,
    initializeHost,
    joinSession,
    completeConnection,
    sendMessage,
    sendTypingIndicator,
    disconnect,
    clearMessages
  };
}
