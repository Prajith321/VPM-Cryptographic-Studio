export type ActiveTab = 'text' | 'file' | 'rsa' | 'hash' | 'password' | 'legacy' | 'inspector';

export type EncryptionAlgorithm = 'AES-GCM-256' | 'AES-CBC-256' | 'VPM-MATRIX-SHIFT';

export interface EncryptedPayload {
  version: string;
  algorithm: string;
  ciphertext: string; // Base64
  salt: string;       // Base64
  iv: string;         // Base64
  iterations: number;
  timestamp: string;
}

export interface EncryptedFilePayload {
  version: string;
  algorithm: string;
  filename: string;
  fileType: string;
  fileSize: number;
  salt: string;       // Base64
  iv: string;         // Base64
  ciphertext: string; // Base64 or binary ArrayBuffer stored
  timestamp: string;
}

export interface RsaKeyPairPEM {
  publicKeyPem: string;
  privateKeyPem: string;
  keySize: number;
  createdAt: string;
}

export interface HashResult {
  algorithm: string;
  hex: string;
  base64: string;
  executionTimeMs: number;
}

export interface PasswordConfig {
  length: number;
  includeUpper: boolean;
  includeLower: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export interface PasswordStrength {
  score: number; // 0-100
  entropyBits: number;
  crackTimeDisplay: string;
  ratingLabel: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Unbreakable';
  feedback: string[];
}

export interface OperationLog {
  id: string;
  timestamp: string;
  type: 'encrypt' | 'decrypt' | 'hash' | 'keygen' | 'wipe';
  title: string;
  details: string;
  status: 'success' | 'error' | 'info';
}
