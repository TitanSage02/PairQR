import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { useCamera } from './use-camera';
import { parseQRUrl, isQRExpired } from '../lib/qr-utils';
import jsQR from 'jsqr';
import type { QRData } from '../types';

// QR Scanner implementation using jsQR library
export function useQRScanner(videoRef?: RefObject<HTMLVideoElement>) {
  const cameraHook = useCamera();
  const { isInitialized, isLoading, error: cameraError, startCamera, stopCamera } = cameraHook;
  
  // Use provided videoRef or fallback to camera hook's videoRef
  const actualVideoRef = videoRef || cameraHook.videoRef;
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
    if (!actualVideoRef.current || !isInitialized || !isScanning) {
      return;
    }
    
    const video = actualVideoRef.current;
    
    // Check if video has valid dimensions and is playing
    if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.readyState < 2) {
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
      
      // Use jsQR with optimized settings for better real-time detection
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      
      if (code && code.data) {
        console.log('QR Code detected:', code.data);
        const parsed = parseQRUrl(code.data);
        
        if (parsed && !isQRExpired(parsed)) {
          console.log('Valid QR code found:', parsed);
          setQrData(parsed);
          stopScanning(); // Auto-stop scanning when valid QR is found
          return; // Exit early to prevent multiple detections
        } else if (parsed && isQRExpired(parsed)) {
          setError('QR code has expired. Please request a new one.');
          stopScanning();
          return;
        } else {
          // Invalid QR format - continue scanning
          console.log('Invalid QR code format, continuing scan...');
        }
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      // Continue scanning despite errors
    }
  }, [isInitialized, isScanning, actualVideoRef, stopScanning]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setQrData(null);
      
      // Ensure camera is started and ready
      if (!isInitialized) {
        await startCamera();
        // Wait for camera to be fully ready
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setIsScanning(true);
      
      // Start scanning frames at optimal frequency for real-time detection
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      scanIntervalRef.current = window.setInterval(scanFrame, 33); // ~30 FPS for smooth detection
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start scanning');
    }
  }, [isInitialized, startCamera, scanFrame]);

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
