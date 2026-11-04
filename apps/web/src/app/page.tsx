import { FileText, CheckCircle2, AlertTriangle, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-12 max-w-7xl mx-auto">
      {/* Header */}
      <Navbar />

      {/* Hero / Judge Evaluation Notice */}
      <section className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
            Phase 1 Foundation Complete
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            High-Precision Brand Governance for Autonomous Content Verification
          </h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Evolyn ensures zero ungrounded marketing claims, enforces strict brand consistency, and provides full transparency with verbatim source citations before human review decisions.
          </p>
        </div>
      </section>

      {/* 5-Step Core Judge Workflow */}
      <section className="mt-10">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          The 5-Step Judge Evaluation Workflow
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Our highest priority architecture paths configured for Round 2:
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Upload Guidelines',
              desc: 'Ingest brand rules, legal policies, and approved facts with pgvector embeddings.',
              icon: FileText,
            },
            {
              step: '02',
              title: 'Submit Content',
              desc: 'Submit copy, press releases, or marketing assets for governance evaluation.',
              icon: Scale,
            },
            {
              step: '03',
              title: 'Verify Rules & Facts',
              desc: 'Multi-layer semantic audit matching claims against approved truth sources.',
              icon: Scale,
            },
            {
              step: '04',
              title: 'Inspect Citations',
              desc: 'Review flagged issues with exact source quotes and evidence strength scores.',
              icon: AlertTriangle,
            },
            {
              step: '05',
              title: 'Human Decision',
              desc: 'Mandatory human approval or rejection with structured feedback recording.',
              icon: CheckCircle2,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono font-semibold text-blue-600">
                  STEP {item.step}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-slate-700" />
                  <h4 className="font-semibold text-sm text-slate-900">
                    {item.title}
                  </h4>
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Core Innovations Section */}
      <section className="mt-10">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Three Core Innovations (Prepared for Phase 2-5)
        </h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/40">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
              <Scale className="w-4 h-4 text-indigo-600" />
              1. Guideline Conflict & Ambiguity Detector
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Detects contradictions, overlapping boundaries, and vague wording across active brand guidelines before they cause compliance errors.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
              <Scale className="w-4 h-4 text-emerald-600" />
              2. Claim Evidence Strength Engine
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Quantifies evidence strength (0-100%) for factual claims, ensuring no metric is accepted without verbatim proof.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/40">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <RefreshCw className="w-4 h-4 text-amber-600" />
              3. Recurring Mistake Loop
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Synthesizes frequent review violations into actionable guideline improvements to permanently eliminate recurring human errors.
            </p>
          </div>
        </div>
      </section>

      {/* Team Matrix Mechanics Footer */}
      <footer className="mt-14 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          Built by <strong className="text-slate-700">Team Matrix Mechanics</strong>: Pratham (Lead & Architecture), Ayan (Backend & DB), Mann (Knowledge & Retrieval), Pratham Kave (Frontend & UI).
        </p>
        <p>Evolyn Platform · Phase 1 Scaffolding Verified</p>
      </footer>
    </main>
  );
}
