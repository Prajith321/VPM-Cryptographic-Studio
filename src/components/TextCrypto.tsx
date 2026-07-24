import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy, Check, Download, Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle, Clock, Zap, ArrowRightLeft } from 'lucide-react';
import { encryptTextAesGcm, decryptTextAesGcm, analyzePasswordStrength } from '../utils/webCrypto';
import { EncryptedPayload } from '../types';

interface TextCryptoProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const TextCrypto: React.FC<TextCryptoProps> = ({ onLog, isWiped }) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  
  // Encryption state
  const [plaintext, setPlaintext] = useState<string>('');
  const [encryptPass, setEncryptPass] = useState<string>('');
  const [showEncryptPass, setShowEncryptPass] = useState<boolean>(false);
  const [iterations, setIterations] = useState<number>(100000);
  const [outputFormat, setOutputFormat] = useState<'armored' | 'json' | 'base64'>('armored');
  const [encryptedArmored, setEncryptedArmored] = useState<string>('');
  const [encryptedPayloadObj, setEncryptedPayloadObj] = useState<EncryptedPayload | null>(null);
  const [encryptTimeMs, setEncryptTimeMs] = useState<number | null>(null);
  const [encryptError, setEncryptError] = useState<string>('');
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);

  // Decryption state
  const [ciphertextInput, setCiphertextInput] = useState<string>('');
  const [decryptPass, setDecryptPass] = useState<string>('');
  const [showDecryptPass, setShowDecryptPass] = useState<boolean>(false);
  const [decryptedText, setDecryptedText] = useState<string>('');
  const [decryptTimeMs, setDecryptTimeMs] = useState<number | null>(null);
  const [decryptError, setDecryptError] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Clear state when wiped
  useEffect(() => {
    if (isWiped) {
      setPlaintext('');
      setEncryptPass('');
      setEncryptedArmored('');
      setEncryptedPayloadObj(null);
      setCiphertextInput('');
      setDecryptPass('');
      setDecryptedText('');
      setEncryptError('');
      setDecryptError('');
    }
  }, [isWiped]);

  const passStrength = analyzePasswordStrength(encryptPass);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleEncrypt = async () => {
    if (!plaintext.trim()) {
      setEncryptError('Please enter plain text to encrypt.');
      return;
    }
    if (!encryptPass) {
      setEncryptError('Please enter a secret passphrase.');
      return;
    }

    setEncryptError('');
    setIsEncrypting(true);
    const start = performance.now();

    try {
      const { payload, formattedArmored } = await encryptTextAesGcm(plaintext, encryptPass, iterations);
      const elapsed = Math.round((performance.now() - start) * 10) / 10;
      
      setEncryptedPayloadObj(payload);
      setEncryptedArmored(formattedArmored);
      setEncryptTimeMs(elapsed);
      onLog('AES-256-GCM Encryption', `Encrypted ${plaintext.length} characters in ${elapsed}ms`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Encryption failed';
      setEncryptError(msg);
      onLog('Encryption Error', msg, 'error');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!ciphertextInput.trim()) {
      setDecryptError('Please paste the encrypted payload or VPM block.');
      return;
    }
    if (!decryptPass) {
      setDecryptError('Please enter the secret passphrase.');
      return;
    }

    setDecryptError('');
    setIsDecrypting(true);
    const start = performance.now();

    try {
      const result = await decryptTextAesGcm(ciphertextInput, decryptPass);
      const elapsed = Math.round((performance.now() - start) * 10) / 10;

      setDecryptedText(result);
      setDecryptTimeMs(elapsed);
      onLog('AES-256-GCM Decryption', `Decrypted payload successfully in ${elapsed}ms`, 'success');
    } catch (err: any) {
      const msg = err.message || 'Decryption failed';
      setDecryptError(msg);
      setDecryptedText('');
      onLog('Decryption Failure', msg, 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadSampleData = () => {
    setPlaintext('CONFIDENTIAL: VPM Cryptographic Studio executes 100% client-side AES-256-GCM authenticated encryption using Google Chrome\'s built-in Web Crypto API.');
    setEncryptPass('QuantumSafePassphrase!2026');
  };

  const transferToDecrypt = () => {
    if (encryptedArmored) {
      setCiphertextInput(encryptedArmored);
      setDecryptPass(encryptPass);
      setMode('decrypt');
    }
  };

  const getOutputText = () => {
    if (!encryptedPayloadObj) return '';
    if (outputFormat === 'armored') return encryptedArmored;
    if (outputFormat === 'json') return JSON.stringify(encryptedPayloadObj, null, 2);
    return encryptedPayloadObj.ciphertext;
  };

  return (
    <div className="space-y-6">
      
      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setMode('encrypt')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'encrypt'
              ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Encrypt Plaintext</span>
        </button>
        <button
          onClick={() => setMode('decrypt')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'decrypt'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Unlock className="w-4 h-4" />
          <span>Decrypt Ciphertext</span>
        </button>
      </div>

      {/* ENCRYPT SECTION */}
      {mode === 'encrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Input Panel */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Plaintext Payload</span>
              </label>
              <button
                onClick={loadSampleData}
                className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Load Sample</span>
              </button>
            </div>

            <textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Enter text, JSON payload, or sensitive notes to encrypt..."
              className="w-full h-36 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono resize-none"
            />

            {/* Passkey Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Secret Encryption Passphrase
                </label>
                {encryptPass && (
                  <span className={`text-[11px] font-medium ${
                    passStrength.score > 70 ? 'text-emerald-400' : passStrength.score > 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {passStrength.ratingLabel} ({passStrength.entropyBits} bits)
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showEncryptPass ? 'text' : 'password'}
                  value={encryptPass}
                  onChange={(e) => setEncryptPass(e.target.value)}
                  placeholder="Create a strong secret password"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-3.5 pr-10 text-slate-100 text-sm focus:outline-none focus:border-cyan-500/60 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowEncryptPass(!showEncryptPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showEncryptPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength Meter Bar */}
              {encryptPass && (
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passStrength.score > 70 ? 'bg-emerald-500' : passStrength.score > 40 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, passStrength.score)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Advanced Settings (PBKDF2 Iterations) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>PBKDF2 Key Derivation Iterations</span>
                <span className="font-mono text-cyan-400 font-semibold">{iterations.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Higher iterations increase protection against brute-force attacks at the cost of processing time.
              </p>
            </div>

            {/* Error Message */}
            {encryptError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{encryptError}</span>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleEncrypt}
              disabled={isEncrypting}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isEncrypting ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Deriving Key & Encrypting...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Execute AES-256-GCM Encryption</span>
                </>
              )}
            </button>
          </div>

          {/* Output Panel */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                    Encrypted Cipher Output
                  </span>
                </div>

                {/* Format Toggle */}
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setOutputFormat('armored')}
                    className={`px-2 py-1 rounded ${outputFormat === 'armored' ? 'bg-cyan-950 text-cyan-300 font-semibold' : 'text-slate-400'}`}
                  >
                    VPM Armored
                  </button>
                  <button
                    onClick={() => setOutputFormat('json')}
                    className={`px-2 py-1 rounded ${outputFormat === 'json' ? 'bg-cyan-950 text-cyan-300 font-semibold' : 'text-slate-400'}`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setOutputFormat('base64')}
                    className={`px-2 py-1 rounded ${outputFormat === 'base64' ? 'bg-cyan-950 text-cyan-300 font-semibold' : 'text-slate-400'}`}
                  >
                    Base64
                  </button>
                </div>
              </div>

              {encryptedPayloadObj ? (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      readOnly
                      value={getOutputText()}
                      className="w-full h-52 bg-slate-950 border border-cyan-900/40 rounded-xl p-3.5 text-cyan-200 font-mono text-xs focus:outline-none resize-none scrollbar-thin"
                    />
                  </div>

                  {/* Encryption Details Pill */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <div>Algorithm: <span className="text-cyan-300">{encryptedPayloadObj.algorithm}</span></div>
                    <div>PBKDF2 Salt: <span className="text-slate-300">{encryptedPayloadObj.salt.substring(0, 10)}...</span></div>
                    <div>GCM IV: <span className="text-slate-300">{encryptedPayloadObj.iv.substring(0, 10)}...</span></div>
                    {encryptTimeMs !== null && (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <Clock className="w-3 h-3" />
                        <span>Execution: {encryptTimeMs} ms</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Lock className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-medium">No ciphertext generated yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Enter plain text and passphrase on the left to execute.</p>
                </div>
              )}
            </div>

            {/* Output Toolbar */}
            {encryptedPayloadObj && (
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(getOutputText(), 'encryptOutput')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    {copiedField === 'encryptOutput' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'encryptOutput' ? 'Copied!' : 'Copy Payload'}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadText(getOutputText(), 'encrypted_message.vpm.txt')}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download (.vpm.txt)</span>
                  </button>
                </div>

                <button
                  onClick={transferToDecrypt}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Test Decrypt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DECRYPT SECTION */}
      {mode === 'decrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Input Panel */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              <span>Encrypted Payload or VPM Armored Block</span>
            </label>

            <textarea
              value={ciphertextInput}
              onChange={(e) => setCiphertextInput(e.target.value)}
              placeholder="Paste JSON payload or VPM ASCII armored block (-----BEGIN VPM ENCRYPTED MESSAGE-----)..."
              className="w-full h-44 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-emerald-200 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
            />

            {/* Decrypt Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Secret Passphrase
              </label>

              <div className="relative">
                <input
                  type={showDecryptPass ? 'text' : 'password'}
                  value={decryptPass}
                  onChange={(e) => setDecryptPass(e.target.value)}
                  placeholder="Enter the corresponding secret password"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-3.5 pr-10 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowDecryptPass(!showDecryptPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showDecryptPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {decryptError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{decryptError}</span>
              </div>
            )}

            {/* Decrypt Execute Button */}
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/80 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isDecrypting ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Decrypting Payload...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Execute AES-256-GCM Decryption</span>
                </>
              )}
            </button>
          </div>

          {/* Decryption Result Output */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Decrypted Plaintext Result</span>
                </span>

                {decryptTimeMs !== null && (
                  <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{decryptTimeMs} ms</span>
                  </span>
                )}
              </div>

              {decryptedText ? (
                <div className="space-y-3">
                  <textarea
                    readOnly
                    value={decryptedText}
                    className="w-full h-56 bg-slate-950 border border-emerald-900/40 rounded-xl p-3.5 text-slate-100 font-mono text-sm focus:outline-none resize-none scrollbar-thin"
                  />
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-300 flex items-center justify-between font-mono">
                    <span>Authentication Tag Verified</span>
                    <span>AES-256-GCM Integrity OK</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Unlock className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-medium">No decrypted text yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Paste payload and passphrase on the left to restore plaintext.</p>
                </div>
              )}
            </div>

            {decryptedText && (
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleCopy(decryptedText, 'decryptOutput')}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  {copiedField === 'decryptOutput' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'decryptOutput' ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={() => handleDownloadText(decryptedText, 'decrypted_message.txt')}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save as File</span>
                </button>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
