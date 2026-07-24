import React, { useState } from 'react';
import { Header } from './components/Header';
import { TextCrypto } from './components/TextCrypto';
import { FileCrypto } from './components/FileCrypto';
import { RsaCrypto } from './components/RsaCrypto';
import { HashSuite } from './components/HashSuite';
import { PasswordTools } from './components/PasswordTools';
import { LegacyVpmCipher } from './components/LegacyVpmCipher';
import { CodeInspector } from './components/CodeInspector';
import { ActiveTab, OperationLog } from './types';
import { ShieldCheck, Activity, Trash2, CheckCircle2, AlertTriangle, Info, Terminal } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');
  const [isWiped, setIsWiped] = useState<boolean>(false);
  const [logs, setLogs] = useState<OperationLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'encrypt',
      title: 'Web Crypto Engine Ready',
      details: 'Google Chrome Native window.crypto.subtle initialized successfully.',
      status: 'info',
    },
  ]);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const handleLog = (title: string, details: string, status: 'success' | 'error' | 'info') => {
    const newLog: OperationLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type: 'encrypt',
      title,
      details,
      status,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const handleWipeMemory = () => {
    setIsWiped(true);
    handleLog('RAM Memory Cleared', 'All active keys, passphrases, and plaintexts scrubbed from browser memory.', 'info');
    setTimeout(() => setIsWiped(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onWipeMemory={handleWipeMemory}
        isWiped={isWiped}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Security Status Banner */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">100% On-Device Client-Side Encryption</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                No telemetry, zero cloud server dependencies, zero external API keys required.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-[11px] font-mono flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showLogs ? 'Hide Activity Log' : `Activity Log (${logs.length})`}</span>
          </button>
        </div>

        {/* Activity Log Drawer */}
        {showLogs && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Realtime Execution Logs</span>
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Logs</span>
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px] scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                  {log.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                  {log.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                  {log.status === 'info' && <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <span className="font-semibold text-slate-200">{log.title}: </span>
                    <span className="text-slate-400">{log.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Tab Views */}
        <div className="transition-all duration-200">
          {activeTab === 'text' && <TextCrypto onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'file' && <FileCrypto onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'rsa' && <RsaCrypto onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'hash' && <HashSuite onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'password' && <PasswordTools onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'legacy' && <LegacyVpmCipher onLog={handleLog} isWiped={isWiped} />}
          {activeTab === 'inspector' && <CodeInspector />}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p>VPM Cryptographic Studio • Purely Client-Side Open-Source Security Suite</p>
          <p className="text-[11px] text-slate-600 font-mono">
            Powered by Google Chrome Web Cryptography API (<code className="text-slate-400">window.crypto.subtle</code>)
          </p>
        </div>
      </footer>

    </div>
  );
}
