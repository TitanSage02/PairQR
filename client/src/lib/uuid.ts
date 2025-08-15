/**
 * Secure UUID generation that works even without crypto.randomUUID
 * (fallback for non-secure contexts like IP addresses)
 */

// Generate UUID v4 using crypto.getRandomValues (available in more contexts than crypto.randomUUID)
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    // Use native crypto.randomUUID if available (secure contexts)
    return crypto.randomUUID();
  }
  
  // Fallback using crypto.getRandomValues (works in more contexts)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 10
    
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }
  
  // Last resort: Math.random() based UUID (less secure but works everywhere)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Check if we're in a secure context for WebCrypto APIs
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

// Generate a random client ID
export function generateClientId(): string {
  return generateSecureUUID();
}
