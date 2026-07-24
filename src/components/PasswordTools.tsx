import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, RefreshCw, Key, ShieldAlert, Sparkles } from 'lucide-react';
import { generateSecurePassword, analyzePasswordStrength } from '../utils/webCrypto';
import { PasswordConfig } from '../types';

interface PasswordToolsProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const PasswordTools: React.FC<PasswordToolsProps> = ({ onLog, isWiped }) => {
  const [config, setConfig] = useState<PasswordConfig>({
    length: 20,
    includeUpper: true,
    includeLower: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  });

  const [generatedPass, setGeneratedPass] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Custom auditor input
  const [auditPassword, setAuditPassword] = useState<string>('');

  useEffect(() => {
    handleGenerate();
  }, [config]);

  useEffect(() => {
    if (isWiped) {
      setGeneratedPass('');
      setAuditPassword('');
    }
  }, [isWiped]);

  const handleGenerate = () => {
    const pass = generateSecurePassword(config);
    setGeneratedPass(pass);
    setCopied(false);
  };

  const handleCopyPass = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const genStrength = analyzePasswordStrength(generatedPass);
  const auditStrength = analyzePasswordStrength(auditPassword);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Password Generator Panel */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span>Secure Password Generator</span>
          </label>
          <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full">
            crypto.getRandomValues
          </span>
        </div>

        {/* Output Box */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm sm:text-base font-mono text-cyan-300 break-all select-all font-semibold">
              {generatedPass || 'Select options below'}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleGenerate}
                title="Regenerate"
                className="p-2 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleCopyPass(generatedPass)}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Strength summary pill */}
          <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800">
            <span className="text-slate-400">Entropy: <strong className="text-cyan-300">{genStrength.entropyBits} bits</strong></span>
            <span className="text-slate-400">Crack Time: <strong className="text-emerald-400">{genStrength.crackTimeDisplay}</strong></span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Password Length</span>
              <span className="text-cyan-400 font-mono font-bold">{config.length} characters</span>
            </div>
            <input
              type="range"
              min="8"
              max="128"
              value={config.length}
              onChange={(e) => setConfig({ ...config, length: Number(e.target.value) })}
              className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeUpper}
                onChange={(e) => setConfig({ ...config, includeUpper: e.target.checked })}
                className="rounded accent-cyan-500 bg-slate-950 border-slate-700"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeLower}
                onChange={(e) => setConfig({ ...config, includeLower: e.target.checked })}
                className="rounded accent-cyan-500 bg-slate-950 border-slate-700"
              />
              <span>Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeNumbers}
                onChange={(e) => setConfig({ ...config, includeNumbers: e.target.checked })}
                className="rounded accent-cyan-500 bg-slate-950 border-slate-700"
              />
              <span>Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeSymbols}
                onChange={(e) => setConfig({ ...config, includeSymbols: e.target.checked })}
                className="rounded accent-cyan-500 bg-slate-950 border-slate-700"
              />
              <span>Symbols (!@#$%)</span>
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-2 border-t border-slate-800">
            <input
              type="checkbox"
              checked={config.excludeSimilar}
              onChange={(e) => setConfig({ ...config, excludeSimilar: e.target.checked })}
              className="rounded accent-cyan-500 bg-slate-950 border-slate-700"
            />
            <span>Exclude ambiguous characters (i, l, 1, L, o, 0, O)</span>
          </label>
        </div>
      </div>

      {/* Password Strength Auditor Panel */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-5 backdrop-blur-sm flex flex-col justify-between">
        <div className="space-y-4">
          <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Entropy & Strength Auditor</span>
          </label>

          <input
            type="text"
            value={auditPassword}
            onChange={(e) => setAuditPassword(e.target.value)}
            placeholder="Type any password to test resilience against brute-force..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
          />

          {auditPassword ? (
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Rating:</span>
                <span className={`text-xs font-bold font-mono ${
                  auditStrength.score > 70 ? 'text-emerald-400' : auditStrength.score > 40 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {auditStrength.ratingLabel} ({auditStrength.score}/100)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    auditStrength.score > 70 ? 'bg-emerald-500' : auditStrength.score > 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(5, auditStrength.score)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-2 border-t border-slate-800">
                <div>Entropy: <span className="text-cyan-300">{auditStrength.entropyBits} bits</span></div>
                <div>Crack Time: <span className="text-emerald-400">{auditStrength.crackTimeDisplay}</span></div>
              </div>

              {auditStrength.feedback.length > 0 && (
                <div className="text-xs text-slate-400 space-y-1 pt-1">
                  {auditStrength.feedback.map((fb, idx) => (
                    <p key={idx} className="flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{fb}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-slate-800 rounded-xl text-center text-slate-500 text-xs">
              <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p>Type a password above to evaluate entropy and estimated crack time under modern GPU cluster attacks.</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Entropy Calculation Standard:</p>
          <p>Entropy measures randomness in bits (<code className="text-cyan-300">E = log2(Pool^Length)</code>). Passwords over 80 bits resist dictionary and rainbow table lookups.</p>
        </div>
      </div>

    </div>
  );
};
