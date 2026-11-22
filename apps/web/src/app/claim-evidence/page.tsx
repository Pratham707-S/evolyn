'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Quote,
  Database,
} from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface ApprovedFact {
  id: string;
  topic: string;
  claimStatement: string;
  approvedProofSource: string;
  validUntil: string | null;
  createdAt: string;
  similarity?: number;
}

interface ClaimVerificationResult {
  claim: string;
  verdict: 'VERIFIED' | 'PARTIAL_EVIDENCE' | 'UNSUBSTANTIATED';
  evidenceStrength: number;
  confidence: number;
  matchedFact: ApprovedFact | null;
  corroboratingFacts: Array<ApprovedFact & { similarity: number }>;
  verbatimVerification: {
    isVerbatim: boolean;
    proofSource?: string;
    citationExcerpt?: string;
  };
  recommendation: string;
  auditTimestamp: string;
}

const PRESET_CLAIMS = [
  {
    label: '99.98% Uptime SLA',
    text: 'Evolyn achieved 99.98% platform uptime across all production clusters during fiscal year 2025.',
    expected: 'VERIFIED',
  },
  {
    label: 'ISO & SOC 2 Certified',
    text: 'Evolyn is ISO/IEC 27001:2022 and SOC 2 Type II certified.',
    expected: 'VERIFIED',
  },
  {
    label: '45 Enterprise Clients',
    text: 'Evolyn actively secures brand governance for 45 enterprise customers worldwide.',
    expected: 'VERIFIED',
  },
  {
    label: 'Partial Metric Claim',
    text: 'Our platform uptime is approximately 99.9% with low review latency.',
    expected: 'PARTIAL',
  },
  {
    label: '100% Infallible (Hyperbole)',
    text: 'Evolyn guarantees 100% infallible compliance and absolute zero risk without human review.',
    expected: 'UNSUBSTANTIATED',
  },
];

export default function ClaimEvidencePage() {
  const { showToast } = useAppShell();
  const queryClient = useQueryClient();

  const [inputClaim, setInputClaim] = useState(
    'Evolyn achieved 99.98% platform uptime across all production clusters during fiscal year 2025.'
  );
  const [verificationResult, setVerificationResult] = useState<ClaimVerificationResult | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [factsSearch, setFactsSearch] = useState('');

  // 1. Fetch Approved Facts from Knowledge Library
  const {
    data: facts = [],
    isLoading: isFactsLoading,
    refetch: refetchFacts,
  } = useQuery<ApprovedFact[]>({
    queryKey: ['knowledge', 'facts'],
    queryFn: async () => {
      return apiClient.get<ApprovedFact[]>('/api/knowledge/facts');
    },
  });

  // 2. Verify Claim Mutation
  const verifyMutation = useMutation({
    mutationFn: async (claimText: string) => {
      return apiClient.post<ClaimVerificationResult>('/api/knowledge/verify-claim', {
        claim: claimText,
      });
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      if (data.verdict === 'VERIFIED') {
        showToast(`Claim verified! Evidence strength: ${Math.round(data.evidenceStrength * 100)}%`);
      } else if (data.verdict === 'PARTIAL_EVIDENCE') {
        showToast(`Partial evidence found (${Math.round(data.evidenceStrength * 100)}%). Needs qualification.`);
      } else {
        showToast('Unsubstantiated claim! No verified corporate evidence found.');
      }
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to verify claim evidence.');
    },
  });

  // 3. Seed Sample Facts Mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ message: string; facts: ApprovedFact[] }>(
        '/api/knowledge/facts/seed-samples'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge', 'facts'] });
      showToast('Sample approved facts ensured in Knowledge Library!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to seed sample facts.');
    },
  });

  const handleVerify = () => {
    if (!inputClaim.trim()) {
      showToast('Please enter or select a claim statement to verify.');
      return;
    }
    verifyMutation.mutate(inputClaim);
  };

  const filteredFacts = useMemo(() => {
    if (!factsSearch.trim()) return facts;
    const q = factsSearch.toLowerCase();
    return facts.filter(
      (f) =>
        f.topic.toLowerCase().includes(q) ||
        f.claimStatement.toLowerCase().includes(q) ||
        f.approvedProofSource.toLowerCase().includes(q)
    );
  }, [facts, factsSearch]);

  return (
    <AppShell activeItem="Claim Evidence">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                Claim Evidence & Citation Workbench
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-[#F3F0E6] text-[#68745D] border border-[#E5E1D8] rounded-full">
                Core Innovation 2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#73736C] mt-1">
              Deterministic corporate evidence strength scoring, factual claim validation, and zero-hallucination citation verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25251F] bg-[#F3F0E6] hover:bg-[#EBE7DC] border border-[#E5E1D8] rounded-lg transition-colors disabled:opacity-50"
              title="Ensure sample approved facts exist in Knowledge Library"
            >
              <Database className="w-3.5 h-3.5 text-[#68745D]" />
              {seedMutation.isPending ? 'Seeding...' : 'Seed Corporate Proofs'}
            </button>
            <Link
              href="/knowledge-library"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#68745D] bg-[#EEF2EB] hover:bg-[#E2E8DD] border border-[#D5DDD0] rounded-lg transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Knowledge Library
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Approved Facts</span>
              <FileCheck2 className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#25251F] font-semibold">
              {facts.length}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Ground truth records</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Citation Guard</span>
              <ShieldCheck className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#68745D] font-semibold">
              100%
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Zero-hallucination quota</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Match Engine</span>
              <Layers className="w-4 h-4 text-[#25251F]" />
            </div>
            <div className="text-base font-semibold text-[#25251F] mt-1 truncate">
              Hybrid Cosine + Token
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">768-dim vector embeddings</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Enforcement</span>
              <Award className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-base font-semibold text-[#68745D] mt-1">
              Deterministic
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Verbatim proof required</p>
          </div>
        </div>

        {/* Explainability Accordion */}
        <div className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl overflow-hidden text-xs text-[#52524B]">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="w-full px-4 py-2.5 flex items-center justify-between font-medium text-[#25251F] hover:bg-[#F3F0E6] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#68745D]" />
              <span>How the Claim Evidence Strength Engine Works</span>
            </div>
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHowItWorks && (
            <div className="px-4 pb-3 pt-1 border-t border-[#E5E1D8] space-y-2 leading-relaxed">
              <p>
                In enterprise communications, unauthorized statistical and factual claims can trigger massive regulatory fines and reputational liability.
                Evolyn guarantees factual integrity through a 3-layer verification model:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#73736C]">
                <li>
                  <strong className="text-[#25251F]">Semantic Ground Truth Matching:</strong> The engine indexes all corporate audit reports, certifications, and shareholder updates in the Knowledge Library.
                </li>
                <li>
                  <strong className="text-[#25251F]">Evidence Strength Scoring (0–100%):</strong> Computes exact certainty based on numeric corroboration, token overlap, and semantic similarity.
                </li>
                <li>
                  <strong className="text-[#25251F]">Zero-Hallucination Verbatim Guard:</strong> Programmatically checks that citations exist word-for-word in the canonical source document, preventing AI hallucinations.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Interactive Claim Verification Sandbox */}
        <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-[#68745D]" />
              <h2 className="font-serif text-lg text-[#25251F]">Claim Verification Sandbox</h2>
            </div>
            <span className="text-[11px] text-[#73736C]">Type or choose a test claim</span>
          </div>

          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[#73736C] uppercase tracking-wider">
              Judge Quick Test Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_CLAIMS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputClaim(preset.text);
                    verifyMutation.mutate(preset.text);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                    inputClaim === preset.text
                      ? 'bg-[#68745D] text-white border-[#68745D]'
                      : 'bg-[#F8F7F2] text-[#25251F] border-[#E5E1D8] hover:bg-[#F3F0E6]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      preset.expected === 'VERIFIED'
                        ? 'bg-emerald-500'
                        : preset.expected === 'PARTIAL'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Claim Input Box */}
          <div className="space-y-2">
            <textarea
              rows={3}
              value={inputClaim}
              onChange={(e) => setInputClaim(e.target.value)}
              placeholder="Paste or write any marketing claim, statistical assertion, or SLA commitment..."
              className="w-full p-3.5 text-xs sm:text-sm bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg text-[#25251F] placeholder-[#A3A39D] focus:outline-none focus:ring-1 focus:ring-[#68745D] leading-relaxed resize-none"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#73736C] text-[11px]">
                {inputClaim.length} characters • Analyzed against corporate proof registry
              </span>
              <button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !inputClaim.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {verifyMutation.isPending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {verifyMutation.isPending ? 'Verifying Evidence...' : 'Verify Claim & Evidence'}
              </button>
            </div>
          </div>

          {/* Verification Result Card */}
          {verificationResult && (
            <div
              className={`mt-4 border rounded-xl overflow-hidden transition-all ${
                verificationResult.verdict === 'VERIFIED'
                  ? 'bg-[#FAFDF9] border-[#D5DDD0]'
                  : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                  ? 'bg-[#FFFDF5] border-[#F4D99D]'
                  : 'bg-[#FFFBFB] border-[#F1D1CB]'
              }`}
            >
              {/* Result Header */}
              <div className="p-4 sm:p-5 border-b border-black/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {verificationResult.verdict === 'VERIFIED' ? (
                    <div className="w-8 h-8 rounded-full bg-[#EEF2EB] text-[#68745D] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : verificationResult.verdict === 'PARTIAL_EVIDENCE' ? (
                    <div className="w-8 h-8 rounded-full bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#FDF4F2] text-[#B56E63] flex items-center justify-center">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          verificationResult.verdict === 'VERIFIED'
                            ? 'bg-[#EEF2EB] text-[#68745D] border-[#D5DDD0]'
                            : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                            ? 'bg-[#FFFBEB] text-[#D97706] border-[#F4D99D]'
                            : 'bg-[#FDF4F2] text-[#B56E63] border-[#F1D1CB]'
                        }`}
                      >
                        {verificationResult.verdict === 'VERIFIED'
                          ? 'VERIFIED CLAIM'
                          : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                          ? 'PARTIAL EVIDENCE'
                          : 'UNSUBSTANTIATED CLAIM'}
                      </span>
                      <span className="text-xs text-[#73736C]">
                        Confidence: {Math.round(verificationResult.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-sm font-medium text-[#25251F] mt-0.5">
                      {verificationResult.verdict === 'VERIFIED'
                        ? 'Ground Truth Verified & Certified'
                        : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                        ? 'Precedent Found But Scope Incomplete'
                        : 'No Verified Corporate Evidence Found'}
                    </div>
                  </div>
                </div>

                {/* Evidence Strength Meter */}
                <div className="text-right">
                  <div className="text-xs text-[#73736C] uppercase tracking-wider font-medium">
                    Evidence Strength
                  </div>
                  <div
                    className={`text-2xl font-serif font-bold ${
                      verificationResult.verdict === 'VERIFIED'
                        ? 'text-[#68745D]'
                        : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                        ? 'text-[#D97706]'
                        : 'text-[#B56E63]'
                    }`}
                  >
                    {Math.round(verificationResult.evidenceStrength * 100)}%
                  </div>
                </div>
              </div>

              {/* Strength Progress Bar */}
              <div className="w-full bg-black/5 h-1.5">
                <div
                  className={`h-1.5 transition-all duration-500 ${
                    verificationResult.verdict === 'VERIFIED'
                      ? 'bg-[#68745D]'
                      : verificationResult.verdict === 'PARTIAL_EVIDENCE'
                      ? 'bg-[#D97706]'
                      : 'bg-[#B56E63]'
                  }`}
                  style={{ width: `${Math.round(verificationResult.evidenceStrength * 100)}%` }}
                />
              </div>

              {/* Result Details */}
              <div className="p-4 sm:p-5 space-y-4 text-xs">
                {/* Side-by-Side: Claim vs Ground Truth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 border border-black/5 rounded-lg p-3.5 space-y-1.5">
                    <span className="text-[10px] font-semibold text-[#73736C] uppercase tracking-wider">
                      Audited Statement
                    </span>
                    <p className="text-xs text-[#25251F] font-medium leading-relaxed">
                      &ldquo;{verificationResult.claim}&rdquo;
                    </p>
                  </div>

                  <div className="bg-white/80 border border-black/5 rounded-lg p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-[#68745D] uppercase tracking-wider">
                        Matched Corporate Source
                      </span>
                      {verificationResult.matchedFact && (
                        <span className="text-[10px] bg-[#EEF2EB] text-[#68745D] px-1.5 py-0.5 rounded">
                          {verificationResult.matchedFact.topic}
                        </span>
                      )}
                    </div>

                    {verificationResult.matchedFact ? (
                      <div className="space-y-1">
                        <p className="text-xs text-[#25251F] font-medium leading-relaxed">
                          &ldquo;{verificationResult.matchedFact.claimStatement}&rdquo;
                        </p>
                        <div className="pt-1 text-[11px] text-[#68745D] flex items-center gap-1 font-medium">
                          <FileCheck2 className="w-3 h-3 shrink-0" />
                          <span>Citation: {verificationResult.matchedFact.approvedProofSource}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#B56E63] italic">
                        No matching fact found in the corporate Knowledge Library.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recommendation Box */}
                <div className="bg-white/80 border border-black/5 rounded-lg p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#25251F]">
                    <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                    <span>Compliance Action & Recommendation</span>
                  </div>
                  <p className="text-xs text-[#52524B] leading-relaxed">
                    {verificationResult.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Corporate Knowledge Library Registry */}
        <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg text-[#25251F]">
                Knowledge Library Verified Proof Registry
              </h3>
              <p className="text-xs text-[#73736C]">
                Active certified facts available for claim verification and AI governance grounding.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#73736C]" />
              <input
                type="text"
                placeholder="Search facts or citations..."
                value={factsSearch}
                onChange={(e) => setFactsSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg text-[#25251F] placeholder-[#A3A39D] focus:outline-none focus:ring-1 focus:ring-[#68745D]"
              />
            </div>
          </div>

          {isFactsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 bg-[#FAF9F5] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredFacts.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#73736C] bg-[#FAF9F5] rounded-xl border border-[#E5E1D8]">
              No approved facts found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredFacts.map((fact) => (
                <div
                  key={fact.id}
                  className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4 space-y-2.5 hover:border-[#68745D]/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#68745D] uppercase tracking-wide text-[10px]">
                      {fact.topic}
                    </span>
                    {fact.validUntil && (
                      <span className="text-[10px] text-[#73736C]">
                        Valid thru {new Date(fact.validUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#25251F] font-medium leading-relaxed">
                    &ldquo;{fact.claimStatement}&rdquo;
                  </p>
                  <div className="pt-1 border-t border-[#E5E1D8]/60 flex items-center justify-between text-[11px] text-[#73736C]">
                    <span className="truncate max-w-[240px] text-[#68745D] font-medium">
                      Source: {fact.approvedProofSource}
                    </span>
                    <button
                      onClick={() => {
                        setInputClaim(fact.claimStatement);
                        verifyMutation.mutate(fact.claimStatement);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-[#25251F] hover:text-[#68745D] transition-colors"
                    >
                      <span>Verify This</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
