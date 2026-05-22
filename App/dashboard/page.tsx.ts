'use client';
import { Shield, Key, FileCode, Users, RefreshCw, Layers } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="min-h-screen flex bg-[#0f1115]">
      {/* Structural Left Navigation Menu */}
      <aside className="w-64 border-r border-white/[0.05] bg-[#12141c] p-6 flex flex-col justify-between hidden md:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            <span className="font-bold tracking-wider text-sm uppercase">NexusSync OS</span>
          </div>
          <nav className="space-y-1.5">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium text-sm transition-all border border-indigo-500/10">
              <Layers className="w-4 h-4" /> System Overview
            </Link>
            <Link href="/dashboard/verify" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.03] font-medium text-sm transition-all">
              <Key className="w-4 h-4" /> Account Verification
            </Link>
            <Link href="/dashboard/generator" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.03] font-medium text-sm transition-all">
              <FileCode className="w-4 h-4" /> Script Generator
            </Link>
            <Link href="/dashboard/mappings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.03] font-medium text-sm transition-all">
              <Users className="w-4 h-4" /> Role Mapping Matrix
            </Link>
          </nav>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="flex justify-between items-center text-xs text-neutral-500">
            <span>Server Instance</span>
            <span className="text-emerald-400 flex items-center gap-1">● Online</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Window */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto max-w-5xl">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-neutral-400 text-sm mt-1">Operational tracking analytics for your linked ecosystem.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-semibold glass-card border border-white/[0.08] hover:bg-white/[0.04] rounded-xl text-neutral-300 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Environment Data
          </button>
        </header>

        {/* Dynamic Analytics Panels */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Validated Profiles</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-4xl font-extrabold mt-4">1,482</div>
            <p className="text-neutral-500 text-xs mt-2">+34 profiles linked this week</p>
          </div>
          <div className="p-6 rounded-2xl glass-panel">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Active Handshake Keys</span>
              <Key className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-4xl font-extrabold mt-4">12</div>
            <p className="text-neutral-500 text-xs mt-2">Expiring cache cleaner active</p>
          </div>
          <div className="p-6 rounded-2xl glass-panel sm:col-span-2 lg:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Operational Role Maps</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-4xl font-extrabold mt-4">8</div>
            <p className="text-neutral-500 text-xs mt-2">Active mappings distributing teams</p>
          </div>
        </section>

        {/* Diagnostic Monitor Console */}
        <section className="p-6 rounded-2xl glass-panel">
          <h3 className="font-semibold text-sm tracking-wider uppercase text-neutral-300 mb-4">Live Cluster Diagnostic Logs</h3>
          <div className="bg-black/40 rounded-xl border border-white/[0.04] p-4 font-mono text-xs text-neutral-400 space-y-2 max-h-60 overflow-y-auto">
            <p><span className="text-neutral-600">[14:32:01]</span> <span className="text-indigo-400">INFO:</span> Initialized Discord runtime client connection.</p>
            <p><span className="text-neutral-600">[14:32:03]</span> <span className="text-emerald-400">SUCCESS:</span> REST payload maps successfully routed down to Discord App Guild context.</p>
            <p><span className="text-neutral-600">[14:35:12]</span> <span className="text-purple-400">DB_LOG:</span> Flushed 3 expired token instances from memory arrays automatically.</p>
          </div>
        </section>
      </main>
    </div>
  );
}