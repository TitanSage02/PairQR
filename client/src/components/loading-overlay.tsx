import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  title?: string;
  message?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  title = "Connecting...", 
  message = "Establishing secure P2P connection" 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-40 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
