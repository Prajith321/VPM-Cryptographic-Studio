import React from 'react';
import { ShieldCheck, Lock, FileCode, KeyRound, Hash, Cpu, RefreshCw, Layers, ShieldAlert } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onWipeMemory: () => void;
  isWiped: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onWipeMemory,
  isWiped,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'text', label: 'AES Text Encrypt', icon: <Lock className="w-4 h-4" /> },
    { id: 'file', label: 'File Crypto', icon: <Layers className="w-4 h-4" /> },
    { id: 'rsa', label: 'RSA Key Pairs', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'hash', label: 'Hash & HMAC', icon: <Hash className="w-4 h-4" /> },
    { id: 'password', label: 'Passkey Vault', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'legacy', label: 'VPM Custom Cipher', icon: <Cpu className="w-4 h-4" />, badge: 'Custom' },
    { id: 'inspector', label: 'Source Code', icon: <FileCode className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent tracking-tight">
                  VPM Cryptographic Studio
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Client-Side Web Crypto
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Google Chrome Engine (<code className="text-cyan-300 font-mono">window.crypto.subtle</code>) • Zero API Keys • Purely On-Device
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onWipeMemory}
              title="Wipe sensitive keys & inputs from browser memory"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
                isWiped
                  ? 'bg-amber-950/50 text-amber-300 border-amber-700/60 animate-pulse'
                  : 'bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border-slate-700/60 hover:border-rose-800/50'
              }`}
            >
              {isWiped ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Memory Wiped</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear RAM State</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 mt-4 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
