import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';
import { Badge } from '../ui/badge';

export function Navbar() {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-200 gap-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            EVOLYN
          </h1>
          <Badge variant="info">Round 2 · CodeNexus 2026</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Enterprise AI Brand Governance · Team Matrix Mechanics
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          API & pgvector Ready
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
          Gemini Flash Driven
        </div>
      </div>
    </header>
  );
}
