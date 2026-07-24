import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Unlock, Copy, Check, Download, AlertCircle, Zap, ShieldCheck, RefreshCw } from 'lucide-react';
import { generateRsaKeyPair, encryptRsaPublicKey, decryptRsaPrivateKey } from '../utils/webCrypto';

interface RsaCryptoProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const RsaCrypto: React.FC<RsaCryptoProps> = ({ onLog, isWiped }) => {
  const [keySize, setKeySize] = useState<2048 | 4096>(2048);
  const [publicKeyPem, setPublicKeyPem] = useState<string>('');
  const [privateKeyPem, setPrivateKeyPem] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Encryption state
  const [plaintextToEncrypt, setPlaintextToEncrypt] = useState<string>('');
  const [rsaCiphertext, setRsaCiphertext] = useState<string>('');
  const [encryptError, setEncryptError] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  // Decryption state
  const [ciphertextToDecrypt, setCiphertextToDecrypt] = useState<string>('');
  const [rsaDecryptedText, setRsaDecryptedText] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isWiped) {
      setPublicKeyPem('');
      setPrivateKeyPem('');
      setPlaintextToEncrypt('');
      setRsaCiphertext('');
      setCiphertextToDecrypt('');
      setRsaDecryptedText('');
      setEncryptError('');
      setDecryptError('');
    }
  }, [isWiped]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    const start = performance.now();

    try {
      const { publicKeyPem: pub, privateKeyPem: priv } = await generateRsaKeyPair(keySize);
      const elapsed = Math.round(performance.now() - start);

      setPublicKeyPem(pub);
      setPrivateKeyPem(priv);
      onLog('RSA Keygen', `Generated RSA-OAEP ${keySize}-bit key pair in ${elapsed}ms`, 'success');
    } catch (err: any) {
      onLog('RSA Keygen Error', err.message || 'Key generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEncryptWithPublic = async () => {
    if (!plaintextToEncrypt.trim()) {
      setEncryptError('Please enter plain text to encrypt.');
      return;
    }
    if (!publicKeyPem.trim()) {
      setEncryptError('Public key required. Generate key pair above or paste PEM.');
      return;
    }

    setEncryptError('');
    setIsEncrypting(true);

    try {
      const cipher = await encryptRsaPublicKey(plaintextToEncrypt, publicKeyPem);
      setRsaCiphertext(cipher);
      onLog('RSA Encrypt', 'Message encrypted using RSA public key', 'success');
    } catch (err: any) {
      setEncryptError(err.message || 'RSA Encryption failed');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptWithPrivate = async () => {
    if (!ciphertextToDecrypt.trim()) {
      setDecryptError('Please enter RSA ciphertext to decrypt.');
      return;
    }
    if (!privateKeyPem.trim()) {
      setDecryptError('Private key required. Generate key pair above or paste PEM.');
      return;
    }

    setDecryptError('');
    setIsDecrypting(true);

    try {
      const plain = await decryptRsaPrivateKey(ciphertextToDecrypt, privateKeyPem);
      setRsaDecryptedText(plain);
      onLog('RSA Decrypt', 'Ciphertext decrypted using RSA private key', 'success');
    } catch (err: any) {
      setDecryptError(err.message || 'RSA Decryption failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  const transferCipherToDecrypt = () => {
    if (rsaCiphertext) {
      setCiphertextToDecrypt(rsaCiphertext);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Key Generation Section */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>RSA Key Pair Generator (RSA-OAEP / SHA-256)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates asymmetric key pair natively inside Chrome engine via <code className="text-cyan-300 font-mono">crypto.subtle.generateKey</code>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={keySize}
              onChange={(e) => setKeySize(Number(e.target.value) as 2048 | 4096)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={2048}>2048-bit (Fast & Standard)</option>
              <option value={4096}>4096-bit (Military Grade)</option>
            </select>

            <button
              onClick={handleGenerateKeys}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-950 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Prime Modulus...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Key Pair</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Keys Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          
          {/* Public Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Public Key (SPKI)</span>
              </span>
              {publicKeyPem && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(publicKeyPem, 'pubKey')}
                    className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'pubKey' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'pubKey' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(publicKeyPem, 'public_key.pem')}
                    className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={publicKeyPem}
              onChange={(e) => setPublicKeyPem(e.target.value)}
              placeholder="Public Key PEM will appear here after generation or paste existing SPKI PEM..."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-cyan-200 text-[11px] font-mono focus:outline-none focus:border-cyan-500 resize-none scrollbar-thin"
            />
          </div>

          {/* Private Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Private Key (PKCS#8 - Keep Secret)</span>
              </span>
              {privateKeyPem && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(privateKeyPem, 'privKey')}
                    className="text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    {copiedField === 'privKey' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'privKey' ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload(privateKeyPem, 'private_key.pem')}
                    className="text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            <textarea
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="Private Key PEM will appear here after generation or paste existing PKCS#8 PEM..."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-rose-200 text-[11px] font-mono focus:outline-none focus:border-rose-500 resize-none scrollbar-thin"
            />
          </div>

        </div>
      </div>

      {/* Operations Grid: Encrypt / Decrypt */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RSA Encryption Panel */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Encrypt with Public Key</span>
          </label>

          <textarea
            value={plaintextToEncrypt}
            onChange={(e) => setPlaintextToEncrypt(e.target.value)}
            placeholder="Enter message to encrypt with RSA public key..."
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
          />

          {encryptError && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{encryptError}</span>
            </div>
          )}

          <button
            onClick={handleEncryptWithPublic}
            disabled={isEncrypting}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Execute Public Key Encryption</span>
          </button>

          {rsaCiphertext && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">RSA Ciphertext Output (Base64)</span>
                <button
                  onClick={transferCipherToDecrypt}
                  className="text-emerald-400 hover:underline font-mono text-[11px]"
                >
                  Send to Decrypt →
                </button>
              </div>
              <textarea
                readOnly
                value={rsaCiphertext}
                className="w-full h-20 bg-slate-950 border border-cyan-900/40 rounded-xl p-2.5 text-cyan-300 font-mono text-[11px] resize-none"
              />
            </div>
          )}
        </div>

        {/* RSA Decryption Panel */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Unlock className="w-3.5 h-3.5" />
            <span>Decrypt with Private Key</span>
          </label>

          <textarea
            value={ciphertextToDecrypt}
            onChange={(e) => setCiphertextToDecrypt(e.target.value)}
            placeholder="Paste RSA Base64 ciphertext here..."
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-200 text-xs font-mono focus:outline-none focus:border-emerald-500 resize-none"
          />

          {decryptError && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{decryptError}</span>
            </div>
          )}

          <button
            onClick={handleDecryptWithPrivate}
            disabled={isDecrypting}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Execute Private Key Decryption</span>
          </button>

          {rsaDecryptedText && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-emerald-400 font-mono">Decrypted Plaintext:</span>
              <textarea
                readOnly
                value={rsaDecryptedText}
                className="w-full h-20 bg-slate-950 border border-emerald-900/40 rounded-xl p-2.5 text-slate-100 font-mono text-xs resize-none"
              />
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
