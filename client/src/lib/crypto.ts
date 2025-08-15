export class CryptoManager {
  private keyPair: CryptoKeyPair | null = null;
  private sharedSecret: CryptoKey | null = null;
  private aesKey: CryptoKey | null = null;

  async generateKeyPair(): Promise<CryptoKeyPair> {
    this.keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey']
    );
    return this.keyPair;
  }

  async exportPublicKey(keyPair?: CryptoKeyPair): Promise<string> {
    const keys = keyPair || this.keyPair;
    if (!keys) throw new Error('No key pair available');
    
    const exported = await crypto.subtle.exportKey('spki', keys.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  async importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      false,
      []
    );
  }

  async deriveSharedSecret(peerPublicKey: CryptoKey): Promise<void> {
    if (!this.keyPair) throw new Error('No key pair available');
    
    this.sharedSecret = await crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey
      },
      this.keyPair.privateKey,
      {
        name: 'HKDF'
      },
      false,
      ['deriveKey']
    );

    // Derive AES key from shared secret
    this.aesKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(0),
        info: new TextEncoder().encode('QRNote-AES-Key')
      },
      this.sharedSecret,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(plaintext: string): Promise<{ ciphertext: string; nonce: string }> {
    if (!this.aesKey) throw new Error('No AES key available');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce
      },
      this.aesKey,
      data
    );

    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      nonce: btoa(String.fromCharCode(...nonce))
    };
  }

  async decrypt(ciphertext: string, nonce: string): Promise<string> {
    if (!this.aesKey) throw new Error('No AES key available');
    
    const ciphertextData = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const nonceData = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonceData
      },
      this.aesKey,
      ciphertextData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  cleanup(): void {
    this.keyPair = null;
    this.sharedSecret = null;
    this.aesKey = null;
  }

  isReady(): boolean {
    return this.aesKey !== null;
  }
}
