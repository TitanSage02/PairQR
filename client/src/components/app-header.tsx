import { useState } from 'react';
import { Settings, Zap, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="text-white w-4 h-4" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  InstantShare
                </h1>
              </div>
              
              <div className="hidden sm:flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs px-2 py-1 bg-green-100 text-green-700 border-green-200">
                  <Shield className="w-3 h-3 mr-1" />
                  E2EE
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-700">
                  FREE
                </Badge>
              </div>
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
