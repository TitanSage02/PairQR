import { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
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
  
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pairqr-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('pairqr-settings', JSON.stringify(newSettings));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pairqr-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Settings Exported",
      description: "Settings have been downloaded to your device",
    });
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          setSettings(imported);
          localStorage.setItem('pairqr-settings', JSON.stringify(imported));
          toast({
            title: "Settings Imported",
            description: "Settings have been successfully imported",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid settings file format",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetSettings = () => {
    const defaultSettings: AppSettings = {
      autoClear: true,
      requireHttps: true,
      darkMode: false,
      showTyping: true
    };
    setSettings(defaultSettings);
    localStorage.setItem('pairqr-settings', JSON.stringify(defaultSettings));
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure your preferences and data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6">
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium">Preferences</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-clear">Auto-clear messages</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatically clear messages when session ends
                  </p>
                </div>
                <Switch
                  id="auto-clear"
                  checked={settings.autoClear}
                  onCheckedChange={(checked) => updateSetting('autoClear', checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="show-typing">Show typing indicators</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Display when others are typing
                  </p>
                </div>
                <Switch
                  id="show-typing"
                  checked={settings.showTyping}
                  onCheckedChange={(checked) => updateSetting('showTyping', checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="require-https">Require HTTPS</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Only allow secure connections
                  </p>
                </div>
                <Switch
                  id="require-https"
                  checked={settings.requireHttps}
                  onCheckedChange={(checked) => updateSetting('requireHttps', checked)}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark mode</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Use dark theme interface
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Data */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-medium">Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={exportSettings}
                className="justify-center sm:justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button 
                variant="outline" 
                onClick={importSettings}
                className="justify-center sm:justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>

              <Button 
                variant="outline" 
                onClick={resetSettings}
                className="justify-center sm:justify-start text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <Separator />

          {/* About & System */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-medium">About & System</h3>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Protocol</span>
                <span className="font-medium">WebRTC + E2EE</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Encryption</span>
                <span className="font-medium">AES-256-GCM</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">MIT</span>
              </div>

              <Separator />

              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Browser</span>
                <span className="text-right truncate max-w-[60%]" title={navigator.userAgent}>
                  {navigator.userAgent.split(' ').slice(-2).join(' ')}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Camera</span>
                <span className={navigator.mediaDevices ? 'text-green-600' : 'text-red-600'}>
                  {navigator.mediaDevices ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">WebRTC</span>
                <span className={window.RTCPeerConnection ? 'text-green-600' : 'text-red-600'}>
                  {window.RTCPeerConnection ? 'Available' : 'Not Available'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-muted-foreground">Local Storage</span>
                <span className={localStorage ? 'text-green-600' : 'text-red-600'}>
                  {localStorage ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                © 2024 Espérance AYIWAHOUN. No data is stored on our servers. All communications are encrypted end-to-end.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    );
  }

