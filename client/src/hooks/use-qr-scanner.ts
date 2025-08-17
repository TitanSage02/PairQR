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

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !isInitialized || !isScanning) {
      return;
    }
    
    const video = videoRef.current;
    
    // Check if video has valid dimensions and is playing
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused) {
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
      
      // Use jsQR to scan for QR codes with multiple inversion attempts for better detection
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      
      if (code) {
        console.log('QR Code detected:', code.data);
        const parsed = parseQRUrl(code.data);
        
        if (parsed && !isQRExpired(parsed)) {
          console.log('Valid QR code found:', parsed);
          setQrData(parsed);
          stopScanning(); // Stop scanning immediately when found
        } else if (parsed && isQRExpired(parsed)) {
          setError('QR code has expired');
        } else {
          console.log('Invalid QR code format');
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      // Continue scanning despite error
    }
  }, [isInitialized, isScanning, videoRef, stopScanning]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setQrData(null);
      
      // Always start camera first
      await startCamera();
      
      // Wait a bit for camera to initialize and get proper video dimensions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsScanning(true);
      
      // Start scanning frames at higher frequency for better responsiveness
      scanIntervalRef.current = window.setInterval(scanFrame, 50); // 20 FPS
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start scanning');
    }
  }, [startCamera, scanFrame]);

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
