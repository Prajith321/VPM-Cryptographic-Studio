import React, { useState, useEffect } from 'react';
import { Cpu, Lock, Unlock, Copy, Check, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { vpmEncryptLegacy, vpmDecryptLegacy, VpmShiftStep } from '../utils/vpmLegacyCipher';

interface LegacyVpmCipherProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const LegacyVpmCipher: React.FC<LegacyVpmCipherProps> = ({ onLog, isWiped }) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Encryption
  const [data, setData] = useState<string>('VPM Cryptographic Studio Polymorphic Matrix Cipher');
  const [pass, setPass] = useState<string>('VPMSecretKey2026');
  const [showPass, setShowPass] = useState<boolean>(false);
  const [ciphertextB64, setCiphertextB64] = useState<string>('');
  const [traceSteps, setTraceSteps] = useState<VpmShiftStep[]>([]);
  const [encryptError, setEncryptError] = useState<string>('');

  // Decryption
  const [decryptInput, setDecryptInput] = useState<string>('');
  const [decryptPass, setDecryptPass] = useState<string>('');
  const [showDecryptPass, setShowDecryptPass] = useState<boolean>(false);
  const [decryptedPlaintext, setDecryptedPlaintext] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string>('');

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isWiped) {
      setData('');
      setPass('');
      setCiphertextB64('');
      setTraceSteps([]);
      setDecryptInput('');
      setDecryptPass('');
      setDecryptedPlaintext('');
    }
  }, [isWiped]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRunEncrypt = () => {
    if (!data.trim() || !pass.trim()) {
      setEncryptError('Please complete both raw data and passphrase parameters.');
      return;
    }

    setEncryptError('');
    try {
      const { ciphertextB64: resB64, steps } = vpmEncryptLegacy(data, pass);
      setCiphertextB64(resB64);
      setTraceSteps(steps);
      onLog('VPM Shift Matrix Encrypt', `Obfuscated ${data.length} characters via polymorphic shift matrix`, 'info');
    } catch (err: any) {
      setEncryptError(err.message || 'Legacy encryption failed');
    }
  };

  const handleRunDecrypt = () => {
    if (!decryptInput.trim() || !decryptPass.trim()) {
      setDecryptError('Please complete both ciphertext payload and passkey parameters.');
      return;
    }

    setDecryptError('');
    try {
      const plain = vpmDecryptLegacy(decryptInput, decryptPass);
      setDecryptedPlaintext(plain);
      onLog('VPM Shift Matrix Decrypt', 'Translated polymorphic cipher text back to plain text', 'info');
    } catch (err: any) {
      setDecryptError('Invalid payload structure or incorrect passkey authentication.');
    }
  };

  const transferToDecrypt = () => {
    if (ciphertextB64) {
      setDecryptInput(ciphertextB64);
      setDecryptPass(pass);
      setMode('decrypt');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Explanation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-start gap-2.5">
          <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-100">VPM Variable Polymorphic Matrix Shift Engine</span>
            <p className="text-slate-400 mt-0.5">
              Original prototype cipher mapping printable ASCII characters dynamically based on rolling passkey character codepoints.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-lg font-mono text-[11px] whitespace-nowrap">
          Educational Shift Cipher
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setMode('encrypt')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'encrypt'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>VPM Matrix Encryption</span>
        </button>
        <button
          onClick={() => setMode('decrypt')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'decrypt'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>VPM Matrix Decryption</span>
        </button>
      </div>

      {/* ENCRYPT */}
      {mode === 'encrypt' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Input Form */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
              <label className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Raw Plaintext</label>
              <textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter raw data..."
                className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Secret Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="Create a passkey"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-10 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {encryptError && (
                <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>{encryptError}</span>
                </div>
              )}

              <button
                onClick={handleRunEncrypt}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
              >
                Execute Matrix Shift Encryption
              </button>
            </div>

            {/* Cipher Output */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Generated VPM Ciphertext</span>
                  {ciphertextB64 && (
                    <button
                      onClick={() => handleCopy(ciphertextB64, 'vpmCipher')}
                      className="text-slate-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                    >
                      {copiedField === 'vpmCipher' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'vpmCipher' ? 'Copied' : 'Copy Payload'}</span>
                    </button>
                  )}
                </div>

                <textarea
                  readOnly
                  value={ciphertextB64}
                  placeholder="Cipher payload will appear here..."
                  className="w-full h-40 bg-slate-950 border border-indigo-900/40 rounded-xl p-3 text-indigo-200 font-mono text-xs focus:outline-none resize-none"
                />
              </div>

              {ciphertextB64 && (
                <button
                  onClick={transferToDecrypt}
                  className="w-full py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Send to Decryption Mode →
                </button>
              )}
            </div>

          </div>

          {/* Matrix Trace Visualizer Table */}
          {traceSteps.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Variable Polymorphic Matrix Trace Log (First {traceSteps.length} Chars)</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Shift Phase = (KeyAscii + Index) % 95</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                      <th className="py-2 px-2">Idx</th>
                      <th className="py-2 px-2">Char</th>
                      <th className="py-2 px-2">ASCII</th>
                      <th className="py-2 px-2">Key Char</th>
                      <th className="py-2 px-2">Key ASCII</th>
                      <th className="py-2 px-2 text-cyan-400">Shift Phase</th>
                      <th className="py-2 px-2 text-indigo-300">Shifted ASCII</th>
                      <th className="py-2 px-2 text-indigo-300">Result Char</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {traceSteps.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-2 text-slate-500">{idx}</td>
                        <td className="py-1.5 px-2 font-bold text-slate-100">{s.char === ' ' ? '␣' : s.char}</td>
                        <td className="py-1.5 px-2 text-slate-400">{s.ascii}</td>
                        <td className="py-1.5 px-2 text-amber-300">{s.keyChar}</td>
                        <td className="py-1.5 px-2 text-slate-400">{s.keyAscii}</td>
                        <td className="py-1.5 px-2 text-cyan-400 font-bold">+{s.dynamicPhase}</td>
                        <td className="py-1.5 px-2 text-indigo-300">{s.shiftedAscii}</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-bold">{s.resultingChar === ' ' ? '␣' : s.resultingChar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DECRYPT */}
      {mode === 'decrypt' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">VPM Cipher Text</label>
            <textarea
              value={decryptInput}
              onChange={(e) => setDecryptInput(e.target.value)}
              placeholder="Paste encrypted Base64 string..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500 resize-none"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Secret Password</label>
              <div className="relative">
                <input
                  type={showDecryptPass ? 'text' : 'password'}
                  value={decryptPass}
                  onChange={(e) => setDecryptPass(e.target.value)}
                  placeholder="Enter passkey"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-3 pr-10 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowDecryptPass(!showDecryptPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showDecryptPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {decryptError && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{decryptError}</span>
              </div>
            )}

            <button
              onClick={handleRunDecrypt}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
            >
              Execute Decryption
            </button>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Decrypted Plaintext Output</span>
            <textarea
              readOnly
              value={decryptedPlaintext}
              placeholder="Plaintext will appear here after decryption..."
              className="w-full h-52 bg-slate-950 border border-emerald-900/40 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

    </div>
  );
};
