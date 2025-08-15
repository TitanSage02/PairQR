import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<AppSettings>({
    autoClear: true,
    requireHttps: true,
    darkMode: false,
    showTyping: true
  });

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Settings
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Security Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Auto-clear messages on disconnect</span>
                <Switch
                  checked={settings.autoClear}
                  onCheckedChange={(checked) => updateSetting('autoClear', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Require HTTPS for connections</span>
                <Switch
                  checked={settings.requireHttps}
                  onCheckedChange={(checked) => updateSetting('requireHttps', checked)}
                />
              </div>
            </div>
          </div>
          
          {/* Display Settings */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Display</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Dark mode</span>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Show typing indicators</span>
                <Switch
                  checked={settings.showTyping}
                  onCheckedChange={(checked) => updateSetting('showTyping', checked)}
                />
              </div>
            </div>
          </div>
          
          {/* About */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-3">About QRNote</h3>
            <div className="text-sm text-muted space-y-2">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Protocol:</strong> WebRTC + E2EE</p>
              <p><strong>Encryption:</strong> AES-256-GCM</p>
              <p><strong>License:</strong> MIT</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-muted">
                © 2024 Espérance AYIWAHOUN. No data is stored on our servers. 
                All communications are encrypted end-to-end.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
