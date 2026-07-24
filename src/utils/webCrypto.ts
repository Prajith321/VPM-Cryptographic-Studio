/**
 * Modern Web Cryptography API Wrapper
 * Utilizes standard browser built-in window.crypto.subtle (Google Chrome Native Engine)
 * 100% Client-Side, Zero API Keys, Purely On-Device.
 */

import { EncryptedPayload, PasswordConfig, PasswordStrength } from '../types';

// Helper: Convert ArrayBuffer to Base64 string
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.trim());
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Convert ArrayBuffer to Hex string
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex string to ArrayBuffer
export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
}

// Helper: Convert string to UTF-8 Uint8Array
export function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper: Convert UTF-8 Uint8Array to string
export function decodeUtf8(buffer: ArrayBuffer | Uint8Array): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Derive an AES-GCM CryptoKey from a user password using PBKDF2
 */
export async function deriveKeyFromPassword(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = 100000,
  algorithm: 'AES-GCM' | 'AES-CBC' = 'AES-GCM'
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: algorithm, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plain text using AES-256-GCM + PBKDF2
 */
export async function encryptTextAesGcm(
  plaintext: string,
  passphrase: string,
  iterations: number = 100000
): Promise<{ payload: EncryptedPayload; formattedArmored: string }> {
  if (!plaintext) throw new Error('Plaintext cannot be empty');
  if (!passphrase) throw new Error('Passphrase cannot be empty');

  // 1. Generate 16 bytes random salt and 12 bytes random IV for AES-GCM
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 2. Derive key from password
  const key = await deriveKeyFromPassword(passphrase, salt, iterations, 'AES-GCM');

  // 3. Encrypt data
  const data = encodeUtf8(plaintext);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  const saltB64 = arrayBufferToBase64(salt.buffer);
  const ivB64 = arrayBufferToBase64(iv.buffer);
  const ciphertextB64 = arrayBufferToBase64(encryptedBuffer);

  const payload: EncryptedPayload = {
    version: '1.0.0',
    algorithm: 'AES-GCM-256',
    ciphertext: ciphertextB64,
    salt: saltB64,
    iv: ivB64,
    iterations,
    timestamp: new Date().toISOString(),
  };

  // Create ASCII Armored Block format
  const jsonStr = JSON.stringify(payload);
  const jsonB64 = btoa(encodeURIComponent(jsonStr));
  const formattedArmored = `-----BEGIN VPM ENCRYPTED MESSAGE-----\nVersion: 1.0.0 (Web Crypto API)\nAlgorithm: AES-GCM-256/PBKDF2-SHA256\n\n${jsonB64}\n-----END VPM ENCRYPTED MESSAGE-----`;

  return { payload, formattedArmored };
}

/**
 * Decrypt ciphertext using AES-256-GCM + PBKDF2
 */
export async function decryptTextAesGcm(
  inputPayload: string | EncryptedPayload,
  passphrase: string
): Promise<string> {
  if (!inputPayload) throw new Error('Ciphertext payload required');
  if (!passphrase) throw new Error('Passphrase required');

  let payload: EncryptedPayload;

  if (typeof inputPayload === 'string') {
    const trimmed = inputPayload.trim();

    // Check if ASCII armored
    if (trimmed.includes('-----BEGIN VPM ENCRYPTED MESSAGE-----')) {
      const match = trimmed.match(/-----BEGIN VPM ENCRYPTED MESSAGE-----\n[\s\S]*?\n\n([\s\S]*?)\n-----END VPM ENCRYPTED MESSAGE-----/);
      if (match && match[1]) {
        const rawB64 = match[1].replace(/\s/g, '');
        const decodedJson = decodeURIComponent(atob(rawB64));
        payload = JSON.parse(decodedJson);
      } else {
        throw new Error('Invalid ASCII armored VPM block format');
      }
    } else {
      // Try direct JSON parse
      try {
        payload = JSON.parse(trimmed);
      } catch {
        throw new Error('Invalid payload format. Expected JSON or VPM ASCII armored block.');
      }
    }
  } else {
    payload = inputPayload;
  }

  if (!payload.ciphertext || !payload.salt || !payload.iv) {
    throw new Error('Missing essential cipher fields (ciphertext, salt, or iv)');
  }

  const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);
  const iterations = payload.iterations || 100000;

  // Derive key
  const key = await deriveKeyFromPassword(passphrase, salt, iterations, 'AES-GCM');

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertextBuffer
    );

    return decodeUtf8(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed! Incorrect password or corrupted payload.');
  }
}

/**
 * Encrypt File using AES-256-GCM
 */
export async function encryptFile(
  file: File,
  passphrase: string,
  iterations: number = 100000
): Promise<{ encryptedBlob: Blob; outputFilename: string }> {
  const fileBuffer = await file.arrayBuffer();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKeyFromPassword(passphrase, salt, iterations, 'AES-GCM');

  // Encrypt file contents
  const encryptedContents = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  // Prepare metadata header
  const metadata = {
    v: 1,
    alg: 'AES-256-GCM',
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    iterations,
  };

  const headerJson = JSON.stringify(metadata);
  const headerBytes = new TextEncoder().encode(headerJson);
  const headerLenView = new Uint32Array([headerBytes.length]);

  // Combined Binary structure: [4 bytes header length][header JSON bytes][encrypted file bytes]
  const combinedBuffer = new Uint8Array(
    4 + headerBytes.length + encryptedContents.byteLength
  );

  combinedBuffer.set(new Uint8Array(headerLenView.buffer), 0);
  combinedBuffer.set(headerBytes, 4);
  combinedBuffer.set(new Uint8Array(encryptedContents), 4 + headerBytes.length);

  const encryptedBlob = new Blob([combinedBuffer], { type: 'application/octet-stream' });
  const outputFilename = `${file.name}.vpm`;

  return { encryptedBlob, outputFilename };
}

/**
 * Decrypt File using AES-256-GCM
 */
export async function decryptFile(
  file: File,
  passphrase: string
): Promise<{ decryptedBlob: Blob; originalFilename: string }> {
  const combinedBuffer = new Uint8Array(await file.arrayBuffer());

  if (combinedBuffer.length < 8) {
    throw new Error('File too short or corrupted VPM container.');
  }

  // Extract header length
  const headerLen = new Uint32Array(combinedBuffer.buffer, 0, 1)[0];
  if (headerLen > 10000 || headerLen <= 0) {
    throw new Error('Invalid VPM encrypted file format.');
  }

  // Extract header JSON
  const headerBytes = combinedBuffer.slice(4, 4 + headerLen);
  const headerJson = new TextDecoder().decode(headerBytes);
  let metadata: any;

  try {
    metadata = JSON.parse(headerJson);
  } catch {
    throw new Error('Failed to parse VPM file header metadata.');
  }

  // Extract encrypted body
  const encryptedBody = combinedBuffer.slice(4 + headerLen);

  const salt = new Uint8Array(base64ToArrayBuffer(metadata.salt));
  const iv = new Uint8Array(base64ToArrayBuffer(metadata.iv));
  const iterations = metadata.iterations || 100000;

  const key = await deriveKeyFromPassword(passphrase, salt, iterations, 'AES-GCM');

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBody
    );

    const decryptedBlob = new Blob([decryptedBuffer], { type: metadata.type || 'application/octet-stream' });
    return { decryptedBlob, originalFilename: metadata.name || 'decrypted_file' };
  } catch {
    throw new Error('File decryption failed! Incorrect password or file corrupted.');
  }
}

/**
 * Generate RSA Key Pair (RSA-OAEP)
 */
export async function generateRsaKeyPair(
  modulusLength: 2048 | 4096 = 2048
): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Export SPKI Public Key
  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const spkiB64 = arrayBufferToBase64(spkiBuffer);
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${spkiB64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;

  // Export PKCS8 Private Key
  const pkcs8Buffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pkcs8B64 = arrayBufferToBase64(pkcs8Buffer);
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${pkcs8B64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  return { publicKeyPem, privateKeyPem };
}

/**
 * Encrypt text using RSA Public Key
 */
export async function encryptRsaPublicKey(plaintext: string, publicKeyPem: string): Promise<string> {
  const cleanPem = publicKeyPem
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\s/g, '');

  const keyBuffer = base64ToArrayBuffer(cleanPem);

  const importedPublicKey = await window.crypto.subtle.importKey(
    'spki',
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    importedPublicKey,
    encodeUtf8(plaintext)
  );

  return arrayBufferToBase64(encryptedBuffer);
}

/**
 * Decrypt text using RSA Private Key
 */
export async function decryptRsaPrivateKey(ciphertextB64: string, privateKeyPem: string): Promise<string> {
  const cleanPem = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyBuffer = base64ToArrayBuffer(cleanPem);

  const importedPrivateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    importedPrivateKey,
    base64ToArrayBuffer(ciphertextB64)
  );

  return decodeUtf8(decryptedBuffer);
}

/**
 * Generate Digest (SHA-1, SHA-256, SHA-384, SHA-512)
 */
export async function computeHash(
  data: string | ArrayBuffer,
  algorithm: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<{ hex: string; base64: string; timeMs: number }> {
  const start = performance.now();
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    buffer = encodeUtf8(data).buffer;
  } else {
    buffer = data;
  }

  const hashBuffer = await window.crypto.subtle.digest(algorithm, buffer);
  const timeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    hex: arrayBufferToHex(hashBuffer),
    base64: arrayBufferToBase64(hashBuffer),
    timeMs,
  };
}

/**
 * Generate HMAC Signature
 */
export async function computeHmac(
  message: string,
  secretKey: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<{ hex: string; base64: string }> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secretKey);

  const importedKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    importedKey,
    enc.encode(message)
  );

  return {
    hex: arrayBufferToHex(signatureBuffer),
    base64: arrayBufferToBase64(signatureBuffer),
  };
}

/**
 * Cryptographically Secure Password Generator using crypto.getRandomValues
 */
export function generateSecurePassword(config: PasswordConfig): string {
  let charPool = '';
  if (config.includeLower) charPool += 'abcdefghijklmnopqrstuvwxyz';
  if (config.includeUpper) charPool += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (config.includeNumbers) charPool += '0123456789';
  if (config.includeSymbols) charPool += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (config.excludeSimilar) {
    charPool = charPool.replace(/[il1Lo0OI]/g, '');
  }

  if (!charPool) charPool = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const randomBytes = new Uint32Array(config.length);
  window.crypto.getRandomValues(randomBytes);

  let password = '';
  for (let i = 0; i < config.length; i++) {
    password += charPool[randomBytes[i] % charPool.length];
  }

  return password;
}

/**
 * Calculate Password Entropy and crack estimate
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      entropyBits: 0,
      crackTimeDisplay: '0 seconds',
      ratingLabel: 'Very Weak',
      feedback: ['Enter a password to evaluate strength'],
    };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 33;

  const entropyBits = Math.round(password.length * Math.log2(poolSize || 1));

  // Assume 100 Billion guesses per second (High-end GPU array)
  const guessesPerSecond = 100_000_000_000;
  const combinations = Math.pow(2, entropyBits);
  const secondsToCrack = combinations / guessesPerSecond;

  let crackTimeDisplay = '';
  if (secondsToCrack < 1) crackTimeDisplay = 'Instant';
  else if (secondsToCrack < 60) crackTimeDisplay = `${Math.round(secondsToCrack)} seconds`;
  else if (secondsToCrack < 3600) crackTimeDisplay = `${Math.round(secondsToCrack / 60)} minutes`;
  else if (secondsToCrack < 86400) crackTimeDisplay = `${Math.round(secondsToCrack / 3600)} hours`;
  else if (secondsToCrack < 31536000) crackTimeDisplay = `${Math.round(secondsToCrack / 86400)} days`;
  else if (secondsToCrack < 31536000 * 1000) crackTimeDisplay = `${Math.round(secondsToCrack / 31536000)} years`;
  else if (secondsToCrack < 31536000 * 1e9) crackTimeDisplay = `${(secondsToCrack / (31536000 * 1e6)).toFixed(1)} Million years`;
  else crackTimeDisplay = 'Trillions of years (Unbreakable)';

  let score = Math.min(100, Math.round((entropyBits / 100) * 100));
  let ratingLabel: PasswordStrength['ratingLabel'] = 'Weak';
  const feedback: string[] = [];

  if (entropyBits < 30) {
    ratingLabel = 'Very Weak';
    feedback.push('Too short or lacks character diversity.');
  } else if (entropyBits < 50) {
    ratingLabel = 'Weak';
    feedback.push('Consider adding uppercase, numbers, or special symbols.');
  } else if (entropyBits < 70) {
    ratingLabel = 'Fair';
    feedback.push('Good strength for standard accounts.');
  } else if (entropyBits < 90) {
    ratingLabel = 'Strong';
    feedback.push('High security level suitable for sensitive data.');
  } else {
    ratingLabel = 'Unbreakable';
    feedback.push('Military grade cryptographic key entropy.');
  }

  return {
    score,
    entropyBits,
    crackTimeDisplay,
    ratingLabel,
    feedback,
  };
}
