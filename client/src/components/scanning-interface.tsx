import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQRScanner } from '../hooks/use-qr-scanner';

interface ScanningInterfaceProps {
  onQRScanned: (sessionId: string, hostPublicKey: string) => void;
}

export function ScanningInterface({ onQRScanned }: ScanningInterfaceProps) {
  const [manualSessionId, setManualSessionId] = useState('');
  const processedQRRef = useRef<string | null>(null);
  const { 
    videoRef, 
    isInitialized, 
    isLoading, 
    isScanning, 
    qrData, 
    error, 
    startScanning, 
    stopScanning,
    startCamera 
  } = useQRScanner();

  // Auto-start camera when component mounts
  useEffect(() => {
    const initCamera = async () => {
      try {
        await startCamera();
      } catch (error) {
        console.error('Failed to initialize camera:', error);
      }
    };
    
    initCamera();
  }, [startCamera]);

  const handleStartScanning = async () => {
    try {
      processedQRRef.current = null; // Reset processed QR
      await startScanning();
    } catch (error) {
      console.error('Failed to start scanning:', error);
    }
  };

  const handleConnectManually = () => {
    if (manualSessionId.trim()) {
      // For manual connection, we don't have the host public key
      // This would typically come from the session data
      onQRScanned(manualSessionId.trim(), '');
    }
  };

  // Handle QR data when scanned - ensure we only process once
  useEffect(() => {
    if (qrData && !isScanning && processedQRRef.current !== qrData.sessionId) {
      processedQRRef.current = qrData.sessionId;
      onQRScanned(qrData.sessionId, qrData.hostPublicKey);
    }
  }, [qrData, isScanning, onQRScanned]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-secondary text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Camera className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Join Session</h2>
              <p className="text-green-100 text-sm">Scan the QR code to connect</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Camera Preview */}
          <div className="relative mb-6">
            <div className="bg-black rounded-xl overflow-hidden aspect-video">
              {isInitialized ? (
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">
                      {isLoading ? 'Camera starting...' : 'Camera not active'}
                    </p>
                    {!isLoading && !isInitialized && (
                      <Button 
                        onClick={handleStartScanning}
                        className="mt-4 bg-white text-black hover:bg-gray-100"
                        disabled={isLoading}
                      >
                        Start Camera
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-secondary rounded-lg border-dashed animate-pulse">
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-secondary rounded-tl-lg"></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-secondary rounded-tr-lg"></div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-lg"></div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-secondary rounded-br-lg"></div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {isInitialized && (
            <div className="text-center mb-6">
              {isScanning ? (
                <Button 
                  onClick={stopScanning}
                  variant="outline"
                  className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                >
                  Stop Scanning
                </Button>
              ) : (
                <Button 
                  onClick={handleStartScanning}
                  className="bg-secondary hover:bg-green-600"
                >
                  Start Scanning
                </Button>
              )}
            </div>
          )}

          {/* Auto-start scanning hint */}
          {isInitialized && !isScanning && (
            <div className="text-center mb-6">
              <p className="text-sm text-muted">Camera ready! Click "Start Scanning" to begin</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          {/* Manual Input Alternative */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-muted text-center mb-4">Or enter session ID manually:</p>
            
            <div className="flex space-x-3">
              <Input
                type="text" 
                placeholder="Enter session ID..." 
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button 
                onClick={handleConnectManually}
                className="bg-secondary text-white hover:bg-green-600"
                disabled={!manualSessionId.trim()}
              >
                Connect
              </Button>
            </div>
          </div>
          
          {/* Permissions Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <i className="fas fa-exclamation-triangle text-accent mt-0.5"></i>
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Camera Access Required</p>
                <p className="text-amber-700">Please allow camera access to scan QR codes. Your camera feed is processed locally and never transmitted.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
