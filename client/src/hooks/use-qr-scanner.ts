import { useState, useEffect, useCallback, useRef } from 'react';
import { useCamera } from './use-camera';
import { parseQRUrl, isQRExpired } from '../lib/qr-utils';
import jsQR from 'jsqr';
import type { QRData } from '../types';

// QR Scanner implementation using jsQR library
export function useQRScanner() {
  const { videoRef, isInitialized, isLoading, error: cameraError, startCamera, stopCamera } = useCamera();
  const [isScanning, setIsScanning] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scanIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !isInitialized) {
      return;
    }
    
    const video = videoRef.current;
    
    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }
    
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR to scan for QR codes
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        const parsed = parseQRUrl(code.data);
        
        if (parsed && !isQRExpired(parsed)) {
          setQrData(parsed);
          setIsScanning(false);
          // stopScanning will be called externally
        } else if (parsed && isQRExpired(parsed)) {
          setError('QR code has expired');
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      // Continue scanning despite error
    }
  }, [isInitialized, videoRef]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setQrData(null);
      
      // Always start camera first
      await startCamera();
      
      // Wait a bit for camera to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsScanning(true);
      
      // Start scanning frames
      scanIntervalRef.current = window.setInterval(scanFrame, 100); // 10 FPS
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start scanning');
    }
  }, [startCamera, scanFrame]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const resetScanner = useCallback(() => {
    stopScanning();
    setQrData(null);
    setError(null);
  }, [stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      stopCamera();
    };
  }, [stopScanning, stopCamera]);

  return {
    videoRef,
    isInitialized,
    isLoading,
    isScanning,
    qrData,
    error: error || cameraError,
    startScanning,
    stopScanning,
    resetScanner,
    startCamera,
    stopCamera
  };
}
