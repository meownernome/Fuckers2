'use client';
import { motion } from 'framer-motion';
import { Shield, Radio, Key, Terminal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 min-h-screen flex flex-col justify-between relative z-10">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-bold text-xl tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
            NexusSync
          </span>
        </div>
        <Link href="/dashboard" className="px-5 py-2 rounded-xl glass-card hover:bg-white/[0.05] border border-white/[0.08] text-sm font-medium transition-all">
          Open Console
        </Link>
      </header>

      <main className="my-auto max-w-3xl py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 uppercase tracking-widest">
            Uptime Engine Active (24/7 Render)
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mt-6 mb-6 leading-[1.1]">
            Bridge Your Roblox World <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              With Discord Operations
            </span>
          </h1>
          <p className="text-neutral-400 text-lg mb-10 leading-relaxed max-w-2xl">
            A production-ready synchronization pipeline. Map corporate guilds, military divisions, or staff ranks instantly to native game servers with zero manual scripts required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard" className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all group">
              Launch Configuration Dashboard
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-white/[0.05]">
        <div className="flex gap-4 items-start">
          <Radio className="w-5 h-5 text-indigo-400 mt-1 shrink-0" />
          <div>
            <h3 className="font-semibold text-neutral-200 text-sm">Real-Time Sync Engine</h3>
            <p className="text-neutral-500 text-xs mt-1">HttpService streaming feeds verified credentials straight to active server memory blocks safely.</p>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <Key className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
          <div>
            <h3 className="font-semibold text-neutral-200 text-sm">Atomic Security Layers</h3>
            <p className="text-neutral-500 text-xs mt-1">Expiring cross-handshake tokens isolate database assets against exploitation vectors.</p>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <Terminal className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h3 className="font-semibold text-neutral-200 text-sm">Auto-Inject Frameworks</h3>
            <p className="text-neutral-500 text-xs mt-1">Generated copy-paste payloads handle dynamic UI and remote networks out-of-the-box.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}