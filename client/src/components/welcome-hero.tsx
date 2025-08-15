import { Wifi, Camera, Lock, EyeOff, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeHeroProps {
  onStartHosting: () => void;
  onStartScanning: () => void;
}

export function WelcomeHero({ onStartHosting, onStartScanning }: WelcomeHeroProps) {
  return (
    <div className="text-center mb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          Secure P2P Text Sharing
        </h1>
        <p className="text-xl text-muted mb-8 leading-relaxed">
          Share text instantly between devices with end-to-end encryption. 
          No data stored on servers, direct peer-to-peer connection via WebRTC.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            onClick={onStartHosting}
            className="bg-primary text-white px-8 py-4 text-lg font-semibold shadow-lg hover:bg-blue-700"
            size="lg"
          >
            <Wifi className="w-5 h-5 mr-3" />
            Start Sharing
          </Button>
          
          <Button 
            onClick={onStartScanning}
            variant="outline"
            className="border-2 border-primary text-primary px-8 py-4 text-lg font-semibold hover:bg-blue-50"
            size="lg"
          >
            <Camera className="w-5 h-5 mr-3" />
            Join Session
          </Button>
        </div>
        
        {/* Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Lock className="text-secondary text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
            <p className="text-sm text-muted">AES-256-GCM encryption with ECDH key exchange</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <EyeOff className="text-primary text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Zero Persistence</h3>
            <p className="text-sm text-muted">No data stored on servers, ephemeral sessions only</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Network className="text-accent text-xl" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Direct P2P</h3>
            <p className="text-sm text-muted">WebRTC data channels with STUN/TURN fallback</p>
          </div>
        </div>
      </div>
    </div>
  );
}
