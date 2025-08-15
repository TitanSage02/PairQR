import QRCode from 'qrcode';
import type { QRData } from '../types';

export async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

export function parseQRUrl(url: string): QRData | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    const sessionId = params.get('s');
    const hostPublicKey = params.get('epk');
    const expiration = params.get('exp');
    const signature = params.get('sig');
    
    if (!sessionId || !hostPublicKey || !expiration || !signature) {
      return null;
    }
    
    return {
      sessionId,
      hostPublicKey: decodeURIComponent(hostPublicKey),
      expiration: parseInt(expiration),
      signature
    };
  } catch (error) {
    console.error('QR URL parsing error:', error);
    return null;
  }
}

export function isQRExpired(qrData: QRData): boolean {
  return Date.now() > qrData.expiration;
}

export function getTimeRemaining(expirationTime: number): string {
  const remaining = Math.max(0, expirationTime - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
