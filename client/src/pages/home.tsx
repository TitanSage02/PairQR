import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppHeader } from '../components/app-header';
import { LandingPage } from '../components/landing-page';
import { HostingInterface } from '../components/hosting-interface';
import { ScanningInterface } from '../components/scanning-interface';
import { ChatInterface } from '../components/chat-interface';
import { LoadingOverlay } from '../components/loading-overlay';
import { FeedbackWidget } from '../components/feedback-widget';
import { useWebRTC } from '../hooks/use-webrtc';
import { apiRequest } from '../lib/queryClient';
import { generateSecureUUID } from '../lib/uuid';
import { trackEvent } from '../lib/analytics';

type AppView = 'landing' | 'hosting' | 'scanning' | 'chat' | 'error';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [qrUrl, setQrUrl] = useState('');
  const [expirationTime, setExpirationTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTitle, setLoadingTitle] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const { toast } = useToast();

  const {
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
  } = useWebRTC();

  // Track page view on mount
  useEffect(() => {
    trackEvent.sessionStarted();
    trackEvent.pageView(window.location.pathname);
  }, []);

  // Handle connection state changes
  useEffect(() => {
    if (connectionState.status === 'connected') {
      setCurrentView('chat');
      setIsLoading(false);
      const connectionDuration = Date.now() - sessionStartTime;
      trackEvent.connectionEstablished(connectionDuration);
      toast({
        title: "Connected!",
        description: "Secure P2P connection established",
      });
    } else if (connectionState.status === 'error') {
      setCurrentView('error');
      setIsLoading(false);
      trackEvent.errorOccurred('connection_failed');
      toast({
        title: "Connection Error",
        description: error || "Failed to establish connection",
        variant: "destructive",
      });
    }
  }, [connectionState.status, error, toast, sessionStartTime]);

  const handleStartHosting = async () => {
    try {
      setIsLoading(true);
      setLoadingTitle('Creating Session...');
      setLoadingMessage('Generating secure keys and session');
      setSessionStartTime(Date.now());

      // Generate host keys and get public key
      const sessionId = generateSecureUUID();
      const publicKey = await initializeHost(sessionId);

      // Create session on server
      const response = await apiRequest('POST', '/api/sessions', {
        id: sessionId,
        hostPublicKey: publicKey,
        signature: 'temp-signature' // Will be generated server-side
      });

      const sessionData = await response.json();
      
      setQrUrl(sessionData.qrUrl);
      setExpirationTime(Date.now() + (sessionData.expiresIn * 1000));
      setCurrentView('hosting');
      setIsLoading(false);

      trackEvent.sessionCreated('host');

      toast({
        title: "Session Created",
        description: "Share the QR code to connect devices",
      });
    } catch (error) {
      console.error('Failed to start hosting:', error);
      setIsLoading(false);
      trackEvent.errorOccurred('session_creation_failed');
      toast({
        title: "Failed to Create Session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleStartScanning = () => {
    setCurrentView('scanning');
    setSessionStartTime(Date.now());
    trackEvent.sessionCreated('join');
  };

  const handleQRScanned = async (sessionId: string, hostPublicKey: string) => {
    try {
      setIsLoading(true);
      setLoadingTitle('Joining Session...');
      setLoadingMessage('Connecting to peer and exchanging keys');

      if (hostPublicKey) {
        // Join with QR data
        const clientPublicKey = await joinSession(sessionId, hostPublicKey);
        
        // Complete the key exchange
        await completeConnection(hostPublicKey);
      } else {
        // Manual session ID - need to get session details first
        const response = await apiRequest('GET', `/api/sessions/${sessionId}`);
        const sessionData = await response.json();
        
        const clientPublicKey = await joinSession(sessionId, sessionData.hostPublicKey);
        await completeConnection(sessionData.hostPublicKey);
      }

      toast({
        title: "Session Joined",
        description: "Establishing secure connection...",
      });
    } catch (error) {
      console.error('Failed to join session:', error);
      setIsLoading(false);
      toast({
        title: "Failed to Join Session",
        description: error instanceof Error ? error.message : "Invalid session or connection failed",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateQR = async () => {
    // Restart hosting process
    await handleStartHosting();
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
      trackEvent.messagesSent(1);
    } catch (error) {
      trackEvent.errorOccurred('message_send_failed');
      toast({
        title: "Failed to Send Message",
        description: error instanceof Error ? error.message : "Message sending failed",
        variant: "destructive",
      });
    }
  };

  const handleExportChat = () => {
    const chatData = {
      messages: messages.map(m => ({
        content: m.content,
        timestamp: m.timestamp,
        isLocal: m.isLocal
      })),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instantshare-chat-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    trackEvent.featureUsed('export_chat');
    
    toast({
      title: "Chat Exported",
      description: "Chat history has been saved to your device",
    });
  };

  const handleShowSessionInfo = () => {
    toast({
      title: "Session Information",
      description: `Session ID: ${connectionState.session?.id || 'Unknown'}\nEncryption: AES-256-GCM\nConnection: P2P WebRTC`,
    });
  };

  const handleEndSession = () => {
    // Track session end
    const sessionDuration = Date.now() - sessionStartTime;
    trackEvent.sessionEnded(sessionDuration, messages.length);
    
    disconnect();
    setCurrentView('landing');
    setQrUrl('');
    setExpirationTime(0);
    
    // Show feedback widget after session
    setTimeout(() => {
      setShowFeedback(true);
    }, 500);
    
    toast({
      title: "Session Ended",
      description: "Connection closed and data cleared",
    });
  };

  const handleGoHome = () => {
    setCurrentView('landing');
    disconnect();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
      {currentView !== 'landing' && <AppHeader connectionStatus={connectionState.status} />}
      
      <main className={currentView === 'landing' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {currentView === 'landing' && (
          <LandingPage 
            onStartHosting={handleStartHosting}
            onStartScanning={handleStartScanning}
          />
        )}
        
        {currentView === 'hosting' && (
          <HostingInterface
            sessionId={connectionState.session?.id || ''}
            qrUrl={qrUrl}
            expirationTime={expirationTime}
            onRegenerateQR={handleRegenerateQR}
          />
        )}
        
        {currentView === 'scanning' && (
          <ScanningInterface
            onQRScanned={handleQRScanned}
          />
        )}
        
        {currentView === 'chat' && (
          <ChatInterface
            messages={messages}
            connectionQuality="Excellent"
            onSendMessage={handleSendMessage}
            onClearChat={clearMessages}
            onExportChat={handleExportChat}
            onShowSessionInfo={handleShowSessionInfo}
            onEndSession={handleEndSession}
            onTyping={sendTypingIndicator}
          />
        )}
        
        {currentView === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
              <div className="bg-red-500 text-white p-6 text-center">
                <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
                <p className="text-red-100">{error || 'Unable to establish P2P connection'}</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-medium text-red-800 mb-2">Possible Solutions:</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Ensure both devices are on the same network</li>
                      <li>• Try refreshing the page and generating a new QR code</li>
                      <li>• Check if your firewall is blocking WebRTC connections</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleGoHome}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <i className="fas fa-redo mr-2"></i>Try Again
                    </button>
                    
                    <button 
                      onClick={handleGoHome}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <i className="fas fa-home mr-2"></i>Go Home
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <LoadingOverlay 
        isVisible={isLoading}
        title={loadingTitle}
        message={loadingMessage}
      />

      {showFeedback && (
        <FeedbackWidget
          onClose={() => setShowFeedback(false)}
          sessionInfo={{
            duration: sessionStartTime > 0 ? Date.now() - sessionStartTime : 0,
            messageCount: messages.length,
            connectionQuality: "Excellent" // You could make this dynamic
          }}
        />
      )}
    </div>
  );
}
