'use client';
import { useState } from 'react';
import { Shield, Key, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VerificationPage() {
  const [discordId, setDiscordId] = useState('');
  const [tokenCode, setTokenCode] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const executeVerificationHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordId || !tokenCode) return;
    setStatus({ type: 'loading', message: 'Checking security pipeline records...' });

    try {
      // Connects directly to the unified production engine hosted on Render
      const res = await fetch('https://YOUR-RENDER-BACKEND-URL.onrender.com/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId, verificationCode: tokenCode }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Server rejected synchronization request.');

      setStatus({ type: 'success', message: `Identity bound successfully! Linked to Roblox user: ${data.robloxUsername}` });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An error occurred during verification.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative">
        <Link href="/dashboard" className="absolute top-8 left-8 text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        
        <div className="flex flex-col items-center text-center mt-6 mb-8">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Link Account Matrix</h2>
          <p className="text-neutral-400 text-xs mt-1">Provide game tokens to sync cross-platform credentials.</p>
        </div>

        <form onSubmit={executeVerificationHandler} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Discord ID String</label>
            <input type="text" value={discordId} onChange={(e) => setDiscordId(e.target.value)} required placeholder="e.g., 1507008070528667729" className="w-full px-4 py-3 bg-[#12141c] border border-white/[0.06] rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Game Generation Code</label>
            <input type="text" value={tokenCode} onChange={(e) => setTokenCode(e.target.value)} required placeholder="e.g., A4F9E2" className="w-full px-4 py-3 bg-[#12141c] border border-white/[0.06] rounded-xl focus:outline-none focus:border-indigo-500 text-sm font-mono tracking-widest uppercase transition-all" />
          </div>

          <button type="submit" disabled={status.type === 'loading'} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-700/50 text-white font-semibold rounded-xl tracking-wide transition-all shadow-lg shadow-indigo-600/10 text-sm">
            {status.type === 'loading' ? 'Processing Handshake...' : 'Finalize Account Link'}
          </button>
        </form>

        {status.type !== 'idle' && (
          <div className={`mt-6 p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
            status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/[0.02] border-white/[0.06] text-neutral-300'
          }`}>
            {status.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
            {status.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
            <p>{status.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}