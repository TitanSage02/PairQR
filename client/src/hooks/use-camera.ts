import { useState, useEffect, useRef, useCallback } from 'react';

export function useCamera() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Wait for video element to be available
      if (!videoRef.current) {
        // Wait a bit for the component to render
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!videoRef.current) {
          throw new Error('Video element not available. Please try again.');
        }
      }
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Request camera permission and stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      streamRef.current = stream;
      console.log('Camera stream obtained:', stream);
      
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element became unavailable');
      }
      
      // Set video properties
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      
      console.log('Video element configured with stream');
      
      // Wait for video to load and then play
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000);
        
        const handleCanPlay = async () => {
          clearTimeout(timeoutId);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
          
          try {
            await video.play();
            console.log('Video playing successfully');
            resolve();
          } catch (playError) {
            console.error('Video play failed:', playError);
            reject(playError);
          }
        };
        
        const handleError = () => {
          clearTimeout(timeoutId);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
          reject(new Error('Video loading failed'));
        };
        
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA
          handleCanPlay();
        } else {
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);
        }
      });
      
      setIsInitialized(true);
    } catch (error) {
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permission and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.error('Camera error:', error);
      setError(errorMessage);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsInitialized(false);
    setError(null);
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isInitialized) {
      return null;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [isInitialized]);

  // Ensure video starts playing when stream and element are both available
  useEffect(() => {
    if (streamRef.current && videoRef.current && isInitialized) {
      const video = videoRef.current;
      if (video.paused && video.srcObject) {
        console.log('Ensuring video plays...');
        video.play().catch(error => {
          console.error('Failed to ensure video playback:', error);
        });
      }
    }
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isInitialized,
    isLoading,
    error,
    startCamera,
    stopCamera,
    captureFrame
  };
}
