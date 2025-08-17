import { useState, useEffect } from 'react';
import { Wifi, RefreshCw, Clock, Shield, Key, FileSignature, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQRCode, getTimeRemaining } from '../lib/qr-utils';
import { useToast } from '@/hooks/use-toast';

interface HostingInterfaceProps {
  sessionId: string;
  qrUrl: string;
  expirationTime: number;
  onRegenerateQR: () => void;
}

export function HostingInterface({ 
  sessionId, 
  qrUrl, 
  expirationTime,
  onRegenerateQR 
}: HostingInterfaceProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('02:00');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Session ID copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    generateQRCode(qrUrl).then(setQrCodeImage).catch(console.error);
  }, [qrUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(expirationTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [expirationTime]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-primary text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Wifi className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Hosting Session</h2>
                <p className="text-blue-100 text-sm">Share this QR code to connect</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span>Waiting for connection</span>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 p-6">
          
          {/* QR Code Section */}
          <div className="text-center">
            <div className="bg-gray-50 rounded-xl p-8 mb-4">
              <div className="w-48 h-48 mx-auto bg-white rounded-lg shadow-sm border-2 border-gray-200 flex items-center justify-center">
                {qrCodeImage ? (
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-muted">
                    <i className="fas fa-qrcode text-4xl mb-2"></i>
                    <p className="text-sm">QR Code Loading...</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                <div className="flex-1">
                  <span className="text-muted text-xs">Session ID:</span>
                  <div className="font-mono text-sm text-gray-900 mt-1">{sessionId}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySessionId}
                  className="ml-2 h-8 w-8 p-0"
                  title="Copy Session ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-muted">
                <Clock className="w-4 h-4" />
                <span>Expires in <span className="font-medium">{timeRemaining}</span></span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateQR}
                className="text-primary hover:text-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Generate New QR
              </Button>
            </div>
          </div>
          
          {/* Connection Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="text-secondary w-5 h-5" />
                    <span className="text-sm font-medium">Encryption</span>
                  </div>
                  <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">AES-256-GCM</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="text-accent w-5 h-5" />
                    <span className="text-sm font-medium">Key Exchange</span>
                  </div>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full">ECDH</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileSignature className="text-primary w-5 h-5" />
                    <span className="text-sm font-medium">QR Signature</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">HMAC-SHA256</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="text-primary mt-0.5 w-5 h-5" />
                <div className="text-sm">
                  <p className="font-medium text-primary mb-1">How it works</p>
                  <p className="text-blue-700">The other device scans this QR code to establish a direct encrypted connection. No data passes through our servers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
