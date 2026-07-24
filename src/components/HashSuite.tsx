import React, { useState, useEffect, useRef } from 'react';
import { Hash, Copy, Check, FileUp, ShieldCheck, AlertCircle, Clock, Zap, Key } from 'lucide-react';
import { computeHash, computeHmac } from '../utils/webCrypto';

interface HashSuiteProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const HashSuite: React.FC<HashSuiteProps> = ({ onLog, isWiped }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'hmac'>('text');

  // Text Hashing
  const [textInput, setTextInput] = useState<string>('');
  const [sha1Result, setSha1Result] = useState<string>('');
  const [sha256Result, setSha256Result] = useState<string>('');
  const [sha384Result, setSha384Result] = useState<string>('');
  const [sha512Result, setSha512Result] = useState<string>('');
  const [hashTimeMs, setHashTimeMs] = useState<number | null>(null);

  // File Checksum Verification
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHashAlgorithm, setFileHashAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'SHA-1'>('SHA-256');
  const [computedFileHash, setComputedFileHash] = useState<string>('');
  const [expectedChecksum, setExpectedChecksum] = useState<string>('');
  const [isHashingFile, setIsHashingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HMAC
  const [hmacMessage, setHmacMessage] = useState<string>('');
  const [hmacSecret, setHmacSecret] = useState<string>('');
  const [hmacAlg, setHmacAlg] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [hmacHex, setHmacHex] = useState<string>('');
  const [hmacBase64, setHmacBase64] = useState<string>('');

  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isWiped) {
      setTextInput('');
      setSha1Result('');
      setSha256Result('');
      setSha384Result('');
      setSha512Result('');
      setSelectedFile(null);
      setComputedFileHash('');
      setExpectedChecksum('');
      setHmacMessage('');
      setHmacSecret('');
      setHmacHex('');
      setHmacBase64('');
    }
  }, [isWiped]);

  // Compute text hashes in real-time as user types
  useEffect(() => {
    if (!textInput) {
      setSha1Result('');
      setSha256Result('');
      setSha384Result('');
      setSha512Result('');
      setHashTimeMs(null);
      return;
    }

    let isMounted = true;
    const runTextHashes = async () => {
      const start = performance.now();
      const [h1, h256, h384, h512] = await Promise.all([
        computeHash(textInput, 'SHA-1'),
        computeHash(textInput, 'SHA-256'),
        computeHash(textInput, 'SHA-384'),
        computeHash(textInput, 'SHA-512'),
      ]);
      const elapsed = Math.round((performance.now() - start) * 100) / 100;

      if (isMounted) {
        setSha1Result(h1.hex);
        setSha256Result(h256.hex);
        setSha384Result(h384.hex);
        setSha512Result(h512.hex);
        setHashTimeMs(elapsed);
      }
    };

    runTextHashes();
    return () => { isMounted = false; };
  }, [textInput]);

  // Compute HMAC
  useEffect(() => {
    if (!hmacMessage || !hmacSecret) {
      setHmacHex('');
      setHmacBase64('');
      return;
    }

    let isMounted = true;
    const runHmac = async () => {
      try {
        const res = await computeHmac(hmacMessage, hmacSecret, hmacAlg);
        if (isMounted) {
          setHmacHex(res.hex);
          setHmacBase64(res.base64);
        }
      } catch (err) {
        // ignore
      }
    };

    runHmac();
    return () => { isMounted = false; };
  }, [hmacMessage, hmacSecret, hmacAlg]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsHashingFile(true);
      setComputedFileHash('');

      try {
        const buffer = await file.arrayBuffer();
        const res = await computeHash(buffer, fileHashAlgorithm);
        setComputedFileHash(res.hex);
        onLog('File Checksum', `Calculated ${fileHashAlgorithm} for "${file.name}" in ${res.timeMs}ms`, 'success');
      } catch (err: any) {
        onLog('Checksum Error', err.message, 'error');
      } finally {
        setIsHashingFile(false);
      }
    }
  };

  const checksumMatch = expectedChecksum.trim()
    ? computedFileHash.toLowerCase() === expectedChecksum.trim().toLowerCase()
    : null;

  return (
    <div className="space-y-6">
      
      {/* Sub Navigation */}
      <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'text'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Realtime Text Hashing</span>
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'file'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>File Checksum Integrity</span>
        </button>
        <button
          onClick={() => setActiveTab('hmac')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'hmac'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>HMAC Signatures</span>
        </button>
      </div>

      {/* TEXT HASHING */}
      {activeTab === 'text' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <span>Input Message string</span>
            </label>
            {hashTimeMs !== null && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Computed all hashes in {hashTimeMs} ms</span>
              </span>
            )}
          </div>

          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type or paste text to compute cryptographic digests in real-time..."
            className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500/60 resize-none"
          />

          {/* Hash Outputs */}
          <div className="space-y-3 pt-2">
            
            {/* SHA-256 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-400 font-mono">SHA-256 (Standard)</span>
                {sha256Result && (
                  <button
                    onClick={() => handleCopy(sha256Result, 'sha256')}
                    className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === 'sha256' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'sha256' ? 'Copied' : 'Copy Hex'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-mono text-cyan-200 break-all">{sha256Result || '—'}</p>
            </div>

            {/* SHA-512 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-400 font-mono">SHA-512 (High Security)</span>
                {sha512Result && (
                  <button
                    onClick={() => handleCopy(sha512Result, 'sha512')}
                    className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === 'sha512' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'sha512' ? 'Copied' : 'Copy Hex'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-mono text-indigo-200 break-all">{sha512Result || '—'}</p>
            </div>

            {/* SHA-384 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-400 font-mono">SHA-384</span>
                {sha384Result && (
                  <button
                    onClick={() => handleCopy(sha384Result, 'sha384')}
                    className="text-slate-400 hover:text-teal-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === 'sha384' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'sha384' ? 'Copied' : 'Copy Hex'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-mono text-teal-200 break-all">{sha384Result || '—'}</p>
            </div>

            {/* SHA-1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400 font-mono">SHA-1 (Legacy / Git compatibility)</span>
                {sha1Result && (
                  <button
                    onClick={() => handleCopy(sha1Result, 'sha1')}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
                  >
                    {copiedField === 'sha1' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'sha1' ? 'Copied' : 'Copy Hex'}</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-mono text-slate-300 break-all">{sha1Result || '—'}</p>
            </div>

          </div>
        </div>
      )}

      {/* FILE CHECKSUM INTEGRITY */}
      {activeTab === 'file' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5" />
              <span>Verify File Integrity Checksum</span>
            </label>

            <select
              value={fileHashAlgorithm}
              onChange={(e) => setFileHashAlgorithm(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              <option value="SHA-256">SHA-256 Digest</option>
              <option value="SHA-512">SHA-512 Digest</option>
              <option value="SHA-1">SHA-1 Digest</option>
            </select>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            {selectedFile ? (
              <p className="text-sm font-semibold text-cyan-300">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            ) : (
              <p className="text-sm font-medium text-slate-300">Click to select file to compute checksum</p>
            )}
          </div>

          {isHashingFile && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse font-mono">
              <Zap className="w-4 h-4 animate-spin" />
              <span>Calculating {fileHashAlgorithm} digest in memory...</span>
            </div>
          )}

          {computedFileHash && (
            <div className="space-y-4 pt-2">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase">Computed {fileHashAlgorithm} Checksum:</span>
                <p className="text-xs font-mono text-slate-100 break-all select-all">{computedFileHash}</p>
              </div>

              {/* Compare Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Compare against expected Checksum (Optional)
                </label>
                <input
                  type="text"
                  value={expectedChecksum}
                  onChange={(e) => setExpectedChecksum(e.target.value)}
                  placeholder="Paste official checksum provided by publisher..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Match Indicator */}
              {checksumMatch !== null && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                  checksumMatch
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                }`}>
                  {checksumMatch ? (
                    <>
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>MATCH VERIFIED: The file checksum exactly matches the expected hash value! File is authentic.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>CHECKSUM MISMATCH: The calculated hash does not match! File may be altered or corrupted.</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* HMAC SIGNATURES */}
      {activeTab === 'hmac' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              <span>HMAC Message Authentication Code</span>
            </label>

            <select
              value={hmacAlg}
              onChange={(e) => setHmacAlg(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              <option value="SHA-256">HMAC-SHA256</option>
              <option value="SHA-384">HMAC-SHA384</option>
              <option value="SHA-512">HMAC-SHA512</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Message Payload</label>
              <textarea
                value={hmacMessage}
                onChange={(e) => setHmacMessage(e.target.value)}
                placeholder="Message to sign..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">HMAC Secret Key</label>
              <input
                type="text"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                placeholder="Secret key string..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {hmacHex && (
            <div className="space-y-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-400 font-semibold">HMAC Signature (Hex):</span>
                  <button
                    onClick={() => handleCopy(hmacHex, 'hmacHex')}
                    className="text-slate-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
                  >
                    {copiedField === 'hmacHex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'hmacHex' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-cyan-200 break-all">{hmacHex}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-400 font-semibold">HMAC Signature (Base64):</span>
                  <button
                    onClick={() => handleCopy(hmacBase64, 'hmacB64')}
                    className="text-slate-400 hover:text-indigo-300 text-[11px] flex items-center gap-1"
                  >
                    {copiedField === 'hmacB64' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'hmacB64' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-indigo-200 break-all">{hmacBase64}</p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
