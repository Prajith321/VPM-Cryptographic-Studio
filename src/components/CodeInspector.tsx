import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

export const CodeInspector: React.FC = () => {
  const [selectedSnippet, setSelectedSnippet] = useState<'aes' | 'file' | 'rsa' | 'hash'>('aes');
  const [copied, setCopied] = useState<boolean>(false);

  const snippets = {
    aes: `// Native Web Crypto API (Google Chrome Built-In)
// AES-256-GCM Text Encryption with PBKDF2 Key Derivation

async function encryptAesGcm(plaintext, password) {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 1. Import raw password
  const passKey = await window.crypto.subtle.importKey(
    'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );

  // 2. Derive 256-bit AES-GCM key via PBKDF2 (100,000 iterations)
  const key = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 3. Encrypt payload
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertextB64: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    saltB64: btoa(String.fromCharCode(...salt)),
    ivB64: btoa(String.fromCharCode(...iv))
  };
}`,

    file: `// Native Web Crypto API - Client-Side File Encryption
async function encryptFileInRam(file, password) {
  const fileBuffer = await file.arrayBuffer();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const passKey = await window.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedContents = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  return new Blob([encryptedContents], { type: 'application/octet-stream' });
}`,

    rsa: `// Native Web Crypto API - RSA Key Pair Generation (RSA-OAEP 2048/4096-bit)
async function generateRsaKeys() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Export SPKI Public Key
  const spki = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  
  // Export PKCS8 Private Key
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return { keyPair, spki, pkcs8 };
}`,

    hash: `// Native Web Crypto API - SHA-256 Digest Computation
async function computeSha256(dataString) {
  const msgBuffer = new TextEncoder().encode(dataString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  
  // Convert buffer to Hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Terminal className="w-4 h-4" />
          <span>Open-Source Implementation Reference</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This application uses 100% standard W3C Web Cryptography API primitives built directly into all modern web browsers (Google Chrome, Firefox, Safari, Edge). Zero external NPM dependencies or remote API calls are required for encryption or key derivation.
        </p>
      </div>

      {/* Code Snippet Viewer */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedSnippet('aes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedSnippet === 'aes' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AES-256-GCM Text
            </button>
            <button
              onClick={() => setSelectedSnippet('file')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedSnippet === 'file' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              File RAM Crypto
            </button>
            <button
              onClick={() => setSelectedSnippet('rsa')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedSnippet === 'rsa' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              RSA Keypair
            </button>
            <button
              onClick={() => setSelectedSnippet('hash')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                selectedSnippet === 'hash' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SHA-256 Digest
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Code Copied!' : 'Copy Code Snippet'}</span>
          </button>
        </div>

        {/* Code Box */}
        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed scrollbar-thin">
          <code>{snippets[selectedSnippet]}</code>
        </pre>
      </div>

    </div>
  );
};
