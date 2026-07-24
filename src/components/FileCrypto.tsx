import React, { useState, useEffect, useRef } from 'react';
import { FileUp, FileCheck, Lock, Unlock, Download, Eye, EyeOff, AlertCircle, File, Check, Zap, Layers, RefreshCw } from 'lucide-react';
import { encryptFile, decryptFile } from '../utils/webCrypto';

interface FileCryptoProps {
  onLog: (title: string, details: string, status: 'success' | 'error' | 'info') => void;
  isWiped: boolean;
}

export const FileCrypto: React.FC<FileCryptoProps> = ({ onLog, isWiped }) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Encryption state
  const [selectedEncryptFile, setSelectedEncryptFile] = useState<File | null>(null);
  const [encryptPass, setEncryptPass] = useState<string>('');
  const [showEncryptPass, setShowEncryptPass] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [encryptedBlobUrl, setEncryptedBlobUrl] = useState<string | null>(null);
  const [encryptedFilename, setEncryptedFilename] = useState<string>('');
  const [encryptError, setEncryptError] = useState<string>('');

  // Decryption state
  const [selectedDecryptFile, setSelectedDecryptFile] = useState<File | null>(null);
  const [decryptPass, setDecryptPass] = useState<string>('');
  const [showDecryptPass, setShowDecryptPass] = useState<boolean>(false);
  const [decryptedBlobUrl, setDecryptedBlobUrl] = useState<string | null>(null);
  const [decryptedOriginalFilename, setDecryptedOriginalFilename] = useState<string>('');
  const [decryptError, setDecryptError] = useState<string>('');

  const fileInputEncryptRef = useRef<HTMLInputElement>(null);
  const fileInputDecryptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isWiped) {
      setSelectedEncryptFile(null);
      setEncryptPass('');
      if (encryptedBlobUrl) URL.revokeObjectURL(encryptedBlobUrl);
      setEncryptedBlobUrl(null);
      setEncryptedFilename('');
      
      setSelectedDecryptFile(null);
      setDecryptPass('');
      if (decryptedBlobUrl) URL.revokeObjectURL(decryptedBlobUrl);
      setDecryptedBlobUrl(null);
      setDecryptedOriginalFilename('');
      
      setEncryptError('');
      setDecryptError('');
    }
  }, [isWiped]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleEncryptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedEncryptFile(e.target.files[0]);
      setEncryptError('');
      if (encryptedBlobUrl) URL.revokeObjectURL(encryptedBlobUrl);
      setEncryptedBlobUrl(null);
    }
  };

  const handleDecryptFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedDecryptFile(e.target.files[0]);
      setDecryptError('');
      if (decryptedBlobUrl) URL.revokeObjectURL(decryptedBlobUrl);
      setDecryptedBlobUrl(null);
    }
  };

  const handleExecuteEncrypt = async () => {
    if (!selectedEncryptFile) {
      setEncryptError('Please select a file to encrypt.');
      return;
    }
    if (!encryptPass) {
      setEncryptError('Please enter a secret passphrase.');
      return;
    }

    setEncryptError('');
    setIsProcessing(true);
    const start = performance.now();

    try {
      const { encryptedBlob, outputFilename } = await encryptFile(selectedEncryptFile, encryptPass);
      const url = URL.createObjectURL(encryptedBlob);
      const elapsed = Math.round(performance.now() - start);

      setEncryptedBlobUrl(url);
      setEncryptedFilename(outputFilename);
      onLog('File Encrypted', `Encrypted "${selectedEncryptFile.name}" (${formatFileSize(selectedEncryptFile.size)}) in ${elapsed}ms`, 'success');
    } catch (err: any) {
      setEncryptError(err.message || 'File encryption failed');
      onLog('File Encrypt Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteDecrypt = async () => {
    if (!selectedDecryptFile) {
      setDecryptError('Please select an encrypted (.vpm) file to decrypt.');
      return;
    }
    if (!decryptPass) {
      setDecryptError('Please enter the secret passphrase.');
      return;
    }

    setDecryptError('');
    setIsProcessing(true);
    const start = performance.now();

    try {
      const { decryptedBlob, originalFilename } = await decryptFile(selectedDecryptFile, decryptPass);
      const url = URL.createObjectURL(decryptedBlob);
      const elapsed = Math.round(performance.now() - start);

      setDecryptedBlobUrl(url);
      setDecryptedOriginalFilename(originalFilename);
      onLog('File Decrypted', `Decrypted "${originalFilename}" in ${elapsed}ms`, 'success');
    } catch (err: any) {
      setDecryptError(err.message || 'File decryption failed');
      onLog('File Decrypt Error', err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Mode Switcher */}
      <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setMode('encrypt')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'encrypt'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Encrypt File (.vpm)</span>
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
          <span>Decrypt File</span>
        </button>
      </div>

      {/* ENCRYPT FILE SECTION */}
      {mode === 'encrypt' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* File Selector & Password Input */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <label className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Select File to Encrypt</span>
            </label>

            {/* Drag Drop Box */}
            <div
              onClick={() => fileInputEncryptRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 bg-slate-950/60 hover:bg-cyan-950/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <input
                type="file"
                ref={fileInputEncryptRef}
                onChange={handleEncryptFileSelect}
                className="hidden"
              />
              <FileUp className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 mb-2 transition-colors" />
              {selectedEncryptFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-cyan-300 break-all">{selectedEncryptFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedEncryptFile.size)} • {selectedEncryptFile.type || 'Unknown MIME'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300">Click or drag & drop any file here</p>
                  <p className="text-xs text-slate-500 mt-1">PDFs, Images, ZIPs, Videos, Documents (Encrypted in RAM)</p>
                </div>
              )}
            </div>

            {/* Passkey */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Secret File Encryption Key
              </label>
              <div className="relative">
                <input
                  type={showEncryptPass ? 'text' : 'password'}
                  value={encryptPass}
                  onChange={(e) => setEncryptPass(e.target.value)}
                  placeholder="Enter passphrase to lock this file"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-3.5 pr-10 text-slate-100 text-sm focus:outline-none focus:border-cyan-500/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowEncryptPass(!showEncryptPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showEncryptPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {encryptError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{encryptError}</span>
              </div>
            )}

            {/* Action */}
            <button
              onClick={handleExecuteEncrypt}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-950/80 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Encrypting File Data...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Encrypt & Create .vpm Package</span>
                </>
              )}
            </button>
          </div>

          {/* Download Output Box */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Encrypted Package Output</span>
              </span>

              {encryptedBlobUrl ? (
                <div className="p-5 bg-slate-950 border border-cyan-800/50 rounded-xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800 flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 break-all">{encryptedFilename}</h3>
                    <p className="text-xs text-cyan-400 font-mono mt-1">AES-256-GCM Container Ready</p>
                  </div>
                  <a
                    href={encryptedBlobUrl}
                    download={encryptedFilename}
                    className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Encrypted (.vpm) File</span>
                  </a>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <File className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-medium">No encrypted package ready.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Select a file and password on the left to package it securely.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Security Guarantee:</p>
              <p>Files are encrypted purely in browser RAM using Web Crypto. No data is transmitted across any network or saved remotely.</p>
            </div>
          </div>

        </div>
      )}

      {/* DECRYPT FILE SECTION */}
      {mode === 'decrypt' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* File Selector & Password Input */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Unlock className="w-3.5 h-3.5" />
              <span>Select Encrypted (.vpm) Package</span>
            </label>

            {/* Drag Drop Box */}
            <div
              onClick={() => fileInputDecryptRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-emerald-950/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <input
                type="file"
                ref={fileInputDecryptRef}
                onChange={handleDecryptFileSelect}
                className="hidden"
              />
              <FileUp className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
              {selectedDecryptFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-emerald-300 break-all">{selectedDecryptFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedDecryptFile.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-300">Click or drag & drop encrypted file (.vpm)</p>
                  <p className="text-xs text-slate-500 mt-1">Select package created with VPM Cryptographic Studio</p>
                </div>
              )}
            </div>

            {/* Passkey */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Secret Passphrase
              </label>
              <div className="relative">
                <input
                  type={showDecryptPass ? 'text' : 'password'}
                  value={decryptPass}
                  onChange={(e) => setDecryptPass(e.target.value)}
                  placeholder="Enter the password used to lock this file"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-3.5 pr-10 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 font-mono"
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

            {/* Action */}
            <button
              onClick={handleExecuteDecrypt}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950/80 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Decrypting File Payload...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt & Restore Original File</span>
                </>
              )}
            </button>
          </div>

          {/* Download Decrypted File Box */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Restored Original File</span>
              </span>

              {decryptedBlobUrl ? (
                <div className="p-5 bg-slate-950 border border-emerald-800/50 rounded-xl space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
                    <Unlock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 break-all">{decryptedOriginalFilename}</h3>
                    <p className="text-xs text-emerald-400 font-mono mt-1">GCM Tag Verified • Restored Successfully</p>
                  </div>
                  <a
                    href={decryptedBlobUrl}
                    download={decryptedOriginalFilename}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original File</span>
                  </a>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <File className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-medium">No decrypted file ready.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Select package and password on the left to restore file.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
