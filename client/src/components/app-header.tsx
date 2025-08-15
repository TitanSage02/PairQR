import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SettingsModal } from './settings-modal';

interface AppHeaderProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function AppHeader({ connectionStatus }: AppHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected (P2P)';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Ready to Connect';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-400';
      case 'connecting':
        return 'bg-amber-400 animate-pulse';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <i className="fas fa-qrcode text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-bold text-gray-900">QRNote</h1>
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full font-medium">E2EE</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                <span>{getStatusText()}</span>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="text-muted hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
