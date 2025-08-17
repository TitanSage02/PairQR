import { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Shield, 
  MessageSquare, 
  Palette, 
  Database, 
  Info, 
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
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your PairQR experience and preferences
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Chat Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Settings
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-clear">Auto-clear messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically clear messages when session ends
                  </p>
                </div>
                <Switch
                  id="auto-clear"
                  checked={settings.autoClear}
                  onCheckedChange={(checked) => updateSetting('autoClear', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-typing">Show typing indicators</Label>
                  <p className="text-sm text-muted-foreground">
                    Display when others are typing
                  </p>
                </div>
                <Switch
                  id="show-typing"
                  checked={settings.showTyping}
                  onCheckedChange={(checked) => updateSetting('showTyping', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Settings
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="require-https">Require HTTPS</Label>
                <p className="text-sm text-muted-foreground">
                  Only allow secure connections
                </p>
              </div>
              <Switch
                id="require-https"
                checked={settings.requireHttps}
                onCheckedChange={(checked) => updateSetting('requireHttps', checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark mode</Label>
                <p className="text-sm text-muted-foreground">
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

          <Separator />

          {/* Data Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Management
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                onClick={exportSettings}
                className="justify-start"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Settings
              </Button>
              
              <Button 
                variant="outline" 
                onClick={importSettings}
                className="justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Settings
              </Button>
              
              <Button 
                variant="outline" 
                onClick={resetSettings}
                className="justify-start text-destructive hover:text-destructive"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>

          <Separator />

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              System Information
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Browser:</span>
                <span>{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Camera Support:</span>
                <span className={navigator.mediaDevices ? "text-green-600" : "text-red-600"}>
                  {navigator.mediaDevices ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">WebRTC Support:</span>
                <span className={window.RTCPeerConnection ? "text-green-600" : "text-red-600"}>
                  {window.RTCPeerConnection ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local Storage:</span>
                <span className={localStorage ? "text-green-600" : "text-red-600"}>
                  {localStorage ? "Available" : "Not Available"}
                </span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              About PairQR
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protocol:</span>
                <span>WebRTC + E2EE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Encryption:</span>
                <span>AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">License:</span>
                <span>MIT</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                © 2024 Espérance AYIWAHOUN. No data is stored on our servers. 
                All communications are encrypted end-to-end.
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
