'use client';
import { useState } from 'react';
import { Layers, Plus, Trash2, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Mapping {
  id: string;
  roleId: string;
  roleName: string;
  teamName: string;
}

export default function RoleMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([
    { id: '1', roleId: '123456789012345', roleName: 'Police Chief', teamName: 'Police Team' },
    { id: '2', roleId: '987654321098765', roleName: 'Special Forces', teamName: 'SWAT Team' }
  ]);
  const [roleId, setRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [teamName, setTeamName] = useState('');

  const executeAddMappingHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleId || !roleName || !teamName) return;

    const newMap: Mapping = {
      id: Date.now().toString(),
      roleId,
      roleName,
      teamName
    };

    setMappings([...mappings, newMap]);
    setRoleId('');
    setRoleName('');
    setTeamName('');
  };

  const executeDeleteMappingHandler = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0f1115] p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="relative mb-10">
          <Link href="/dashboard" className="absolute -top-6 left-0 text-neutral-500 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-4 mt-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Role Mapping Matrix</h1>
              <p className="text-neutral-400 text-sm mt-1">Bind your Discord Guild roles directly to live in-game server team structures.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creation Control Component Panel */}
          <div className="p-6 rounded-2xl glass-panel h-fit">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Create Deployment Link
            </h3>
            <form onSubmit={executeAddMappingHandler} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Discord Role SnowFlake ID</label>
                <input type="text" value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="e.g., 1507008070528667729" className="w-full px-3 py-2.5 bg-[#12141c] border border-white/[0.06] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Discord Display Name Reference</label>
                <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., Police Patrol" className="w-full px-3 py-2.5 bg-[#12141c] border border-white/[0.06] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Target Roblox In-Game Team Name</label>
                <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g., First Responders" className="w-full px-3 py-2.5 bg-[#12141c] border border-white/[0.06] rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-indigo-600/10">
                Commit Pipeline Mapping
              </button>
            </form>
          </div>

          {/* Table Spreadsheet View Component Data */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-neutral-200 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Operational Matrix Deployments
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="pb-3 font-semibold">Discord Metadata Target</th>
                    <th className="pb-3 font-semibold">Roblox Target Team Mapping</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02] text-xs font-medium text-neutral-300">
                  {mappings.map((m) => (
                    <tr key={m.id} className="group">
                      <td className="py-4">
                        <div className="font-semibold text-neutral-200">{m.roleName}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">ID: {m.roleId}</div>
                      </td>
                      <td className="py-4 font-mono text-indigo-400">{m.teamName}</td>
                      <td className="py-4 text-right">
                        <button onClick={() => executeDeleteMappingHandler(m.id)} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {mappings.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-neutral-500 tracking-wide font-normal">
                        No operational role routes found. Add a deployment link to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
