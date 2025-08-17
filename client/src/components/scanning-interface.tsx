import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseQRUrl, isQRExpired } from '../lib/qr-utils';

// Import html5-qrcode types
declare global {
  interface Window {
    Html5QrcodeScanner: any;
    Html5Qrcode: any;
  }
}

interface ScanningInterfaceProps {
  onQRScanned: (sessionId: string, hostPublicKey: string) => void;
}

export function ScanningInterface({ onQRScanned }: ScanningInterfaceProps) {
  const [manualSessionId, setManualSessionId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [detectionMsg, setDetectionMsg] = useState<string | null>(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  
  const processedQRRef = useRef<string | null>(null);
  const redirectedRef = useRef<boolean>(false);
  const html5QrcodeScannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLibrary = () => {
      if (window.Html5QrcodeScanner) {
        setLibraryLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[html5-qrcode] Library loaded successfully');
        setLibraryLoaded(true);
      };
      script.onerror = () => {
        console.error('[html5-qrcode] Failed to load library');
        setError('Failed to load QR scanner library');
      };
      document.head.appendChild(script);
    };

    loadLibrary();

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src*="html5-qrcode"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  // Handle a valid QR detection: stop scanning and redirect to the decoded URL
  const handleValidQRCode = (decodedUrl: string, parsed: any) => {
    try {
      if (redirectedRef.current) return;
      console.log('[QR] Valid QR detected, redirecting to:', decodedUrl);
      
      // Call existing behavior for internal flow
      setQrData(parsed);
      stopScanning();
      
      // Prevent duplicate triggers
      redirectedRef.current = true;
      
      // Small delay to ensure UI updates flush, then redirect
      setTimeout(() => {
        try {
          window.location.assign(decodedUrl);
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError);
          // Fallback to internal flow if redirect fails
          onQRScanned(parsed.sessionId, parsed.hostPublicKey);
        }
      }, 100);
    } catch (error) {
      console.error('Error handling QR code:', error);
      // Fallback to internal flow
      onQRScanned(parsed.sessionId, parsed.hostPublicKey);
    }
  };

  // Success callback for html5-qrcode scanner
  const onScanSuccess = (decodedText: string, _decodedResult: any) => {
    try {
      console.log('[html5-qrcode] QR Code detected:', decodedText);
      
      // Show a detection message first
      setDetectionMsg(`QR detected: ${decodedText.substring(0, 50)}...`);
      
      // Try to parse as our app's QR format first
      const parsed = parseQRUrl(decodedText);
      if (parsed && !isQRExpired(parsed)) {
        console.log('[html5-qrcode] Valid app QR parsed for session:', parsed.sessionId);
        setDetectionMsg('Valid QR found! Redirecting...');
        handleValidQRCode(decodedText, parsed);
        return;
      }
      
      // Check if it's any valid URL and redirect to it
      try {
        new URL(decodedText); // Validate it's a proper URL
        console.log('[html5-qrcode] Valid URL detected, redirecting:', decodedText);
        setDetectionMsg('Valid URL found! Redirecting...');
        stopScanning();
        redirectedRef.current = true;
        setTimeout(() => {
          window.location.assign(decodedText);
        }, 100);
        return;
      } catch {
        // Not a valid URL, show feedback
        console.log('[html5-qrcode] Not a valid URL:', decodedText);
      }
      
      // Show feedback if detected but invalid/expired
      setDetectionMsg('QR detected but invalid/expired');
      setTimeout(() => setDetectionMsg(null), 3000);
      
    } catch (error) {
      console.error('[html5-qrcode] Error processing QR:', error);
      setDetectionMsg('Error processing QR code');
      setTimeout(() => setDetectionMsg(null), 3000);
    }
  };

  // Error callback for html5-qrcode scanner (called on each failed frame)
  const onScanFailure = (error: string) => {
    // Only log actual errors, not "No QR code found" messages
    if (error && !error.includes('NotFoundException') && !error.includes('No QR code found')) {
      console.log('[html5-qrcode] Scan error:', error);
    }
  };

  // Start scanning with html5-qrcode
  const startScanning = () => {
    try {
      if (!libraryLoaded) {
        setError('QR scanner library not loaded yet');
        return;
      }

      if (!window.Html5QrcodeScanner) {
        setError('QR scanner library not available');
        return;
      }

      if (!scannerContainerRef.current) {
        setError('Scanner container not ready');
        return;
      }

      if (html5QrcodeScannerRef.current) {
        stopScanning(); // Clean up any existing scanner
      }

      setError(null);
      setQrData(null);
      processedQRRef.current = null;
      redirectedRef.current = false;
      
      console.log('[html5-qrcode] Starting QR scanner...');
      
      // Create new scanner instance
      html5QrcodeScannerRef.current = new window.Html5QrcodeScanner(
        "qr-reader", // This will be the ID of our container div
        {
          fps: 10, // 10 frames per second
          qrbox: { width: 250, height: 250 }, // QR detection box
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: "environment" // Use back camera on mobile
          }
        },
        false // verbose logging
      );

      // Start the scanner
      html5QrcodeScannerRef.current.render(onScanSuccess, onScanFailure);
      
      setIsScanning(true);
      setScannerReady(true);
      console.log('[html5-qrcode] Scanner started successfully');
      
    } catch (error) {
      console.error('[html5-qrcode] Error starting scanner:', error);
      setError('Failed to start camera scanner: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    try {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear();
        html5QrcodeScannerRef.current = null;
      }
      setIsScanning(false);
      setScannerReady(false);
      console.log('[html5-qrcode] Scanner stopped');
    } catch (error) {
      console.error('[html5-qrcode] Error stopping scanner:', error);
    }
  };

  const handleConnectManually = () => {
    if (manualSessionId.trim()) {
      onQRScanned(manualSessionId.trim(), '');
    }
  };

  // Auto-start scanning when library is loaded
  useEffect(() => {
    if (libraryLoaded && !isScanning && !redirectedRef.current) {
      const timer = setTimeout(() => {
        startScanning();
      }, 500); // Small delay to ensure DOM is ready

      return () => {
        clearTimeout(timer);
      };
    }
  }, [libraryLoaded]);

  // Handle QR data when scanned (fallback if redirect doesn't work)
  useEffect(() => {
    if (!qrData || isScanning) return;
    if (redirectedRef.current) return; // redirect flow takes over
    // Call only once per sessionId
    if (processedQRRef.current === qrData.sessionId) return;
    processedQRRef.current = qrData.sessionId;
    console.log('[Scan] QR parsed, invoking onQRScanned for session:', qrData.sessionId);
    onQRScanned(qrData.sessionId, qrData.hostPublicKey);
  }, [qrData, isScanning, onQRScanned]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopScanning();
      } else if (libraryLoaded && !isScanning && !qrData && !redirectedRef.current) {
        // Restart scanning when page becomes visible again
        setTimeout(() => {
          startScanning();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [libraryLoaded, isScanning, qrData]);  return (
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
          {/* QR Scanner Container */}
          <div className="relative mb-6">
            <div 
              id="qr-reader" 
              ref={scannerContainerRef}
              className="w-full rounded-xl overflow-hidden"
              style={{ minHeight: '300px' }}
            />
            
            {/* Library Loading Status */}
            {!libraryLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white rounded-xl">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm opacity-75">Loading QR scanner library...</p>
                </div>
              </div>
            )}

            {/* Scanner Status Overlay */}
            {libraryLoaded && !scannerReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white rounded-xl">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Initializing camera scanner...</p>
                </div>
              </div>
            )}

            {/* Detection Message */}
            {detectionMsg && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white px-3 py-1 rounded-full text-xs">
                {detectionMsg}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="text-center mb-6">
            {!libraryLoaded ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Loading QR scanner...</p>
                <Button disabled className="bg-gray-300">
                  <div className="w-4 h-4 mr-2 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </Button>
              </div>
            ) : isScanning ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-secondary">
                  <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Scanning for QR code...</span>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                    className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  >
                    Stop Scanning
                  </Button>
                  <Button 
                    onClick={() => {
                      stopScanning();
                      setTimeout(startScanning, 500);
                    }}
                    variant="outline"
                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    Restart Scanner
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {scannerReady ? 'Scanner ready - point camera at QR code' : 'Click to start scanning'}
                </p>
                <Button 
                  onClick={startScanning}
                  className="bg-secondary hover:bg-green-600"
                  disabled={isScanning || !libraryLoaded}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {scannerReady ? 'Resume Scanning' : 'Start Camera Scanner'}
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <div>
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                  <p className="text-red-700 text-xs mt-1">
                    Make sure to allow camera access when prompted
                  </p>
                  <Button 
                    onClick={() => {
                      setError(null);
                      startScanning();
                    }}
                    className="mt-2 text-xs bg-red-100 text-red-700 hover:bg-red-200"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualSessionId.trim()) {
                    handleConnectManually();
                  }
                }}
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
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <span className="text-blue-600 text-sm">ℹ️</span>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">How to use:</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Allow camera access when prompted</li>
                  <li>• Point your camera at the QR code</li>
                  <li>• Auto-detection will redirect you immediately</li>
                  <li>• Works with any valid URL QR codes</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}