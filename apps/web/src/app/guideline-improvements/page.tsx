'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  BookOpen,
  Check,
  RotateCcw,
  History,
  TrendingUp,
  FileText,
  XCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  Flame,
} from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface EnrichedRecurringMistake {
  id: string;
  ruleId: string;
  violationCount: number;
  sampleExcerpts: string[];
  suggestedGuidelineRevision: string | null;
  status: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
  rule: {
    id: string;
    statement: string;
    ruleType: string;
    severity: string;
    explanation: string;
    guidelineId: string;
    guidelineTitle: string;
  };
}

interface MistakesListResponse {
  mistakes: EnrichedRecurringMistake[];
  total: number;
}

export default function GuidelineImprovementsPage() {
  const { showToast } = useAppShell();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPLIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // 1. Fetch Recurring Mistakes
  const {
    data: mistakeData,
    isLoading: isMistakesLoading,
    isRefetching: isMistakesRefetching,
    refetch: refetchMistakes,
  } = useQuery<MistakesListResponse>({
    queryKey: ['insights', 'recurring-mistakes'],
    queryFn: async () => {
      return apiClient.get<MistakesListResponse>('/api/insights/recurring-mistakes');
    },
  });

  // 2. Seed Demo Mistakes Mutation
  const seedDemoMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ message: string; mistakes: EnrichedRecurringMistake[]; total: number }>(
        '/api/insights/seed-demo'
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring-mistakes'] });
      showToast(data.message || 'Demo recurring mistakes seeded successfully!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to seed demo recurring mistakes.');
    },
  });

  // 3. Generate Refinement Mutation
  const refineMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiClient.post<{
        ruleId: string;
        originalStatement: string;
        suggestedRevision: string;
        rationale: string;
      }>(`/api/insights/refine/${ruleId}`);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring-mistakes'] });
      showToast('AI synthesized a new clarified guideline refinement!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to generate refinement.');
    },
  });

  // 4. Apply Refinement Mutation
  const applyMutation = useMutation({
    mutationFn: async ({ ruleId, newStatement }: { ruleId: string; newStatement: string }) => {
      return apiClient.post<{ success: boolean; message: string }>(
        `/api/insights/apply/${ruleId}`,
        { newStatement }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring-mistakes'] });
      queryClient.invalidateQueries({ queryKey: ['guidelines', 'list'] });
      showToast('Guideline rule updated with refined wording! Feedback loop closed.');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to apply refinement.');
    },
  });

  // 5. Dismiss Mutation
  const dismissMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return apiClient.post<{ success: boolean; message: string }>(
        `/api/insights/dismiss/${ruleId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'recurring-mistakes'] });
      showToast('Recurring mistake dismissed.');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to dismiss mistake.');
    },
  });

  const mistakes = mistakeData?.mistakes || [];

  // Filter & Search
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (activeTab === 'PENDING' && m.status !== 'PENDING_REVIEW') return false;
      if (activeTab === 'APPLIED' && m.status !== 'APPLIED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ruleText = m.rule?.statement?.toLowerCase() || '';
        const guideTitle = m.rule?.guidelineTitle?.toLowerCase() || '';
        const revision = m.suggestedGuidelineRevision?.toLowerCase() || '';

        return ruleText.includes(q) || guideTitle.includes(q) || revision.includes(q);
      }

      return true;
    });
  }, [mistakes, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = mistakes.length;
    const highFreq = mistakes.filter((m) => m.violationCount >= 3).length;
    const pending = mistakes.filter((m) => m.status === 'PENDING_REVIEW').length;
    const applied = mistakes.filter((m) => m.status === 'APPLIED').length;

    return { total, highFreq, pending, applied };
  }, [mistakes]);

  return (
    <AppShell activeItem="Guideline Improvements">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                Guideline Improvement Loop
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-[#F3F0E6] text-[#68745D] border border-[#E5E1D8] rounded-full">
                Core Innovation 3
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#73736C] mt-1">
              Continuous recurring mistake tracking and autonomous guideline refinement loop.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => seedDemoMutation.mutate()}
              disabled={seedDemoMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B56E63] bg-[#FDF4F2] hover:bg-[#FBEAE7] border border-[#F1D1CB] rounded-lg transition-colors disabled:opacity-50"
              title="Inject demo recurring mistake patterns to demonstrate feedback loop"
            >
              <Flame className="w-3.5 h-3.5 text-[#B56E63]" />
              {seedDemoMutation.isPending ? 'Seeding...' : 'Inject Demo Mistakes'}
            </button>

            <Link
              href="/guidelines"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-lg shadow-sm transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              View Guidelines
            </Link>

            <button
              onClick={() => refetchMistakes()}
              disabled={isMistakesRefetching}
              className="p-1.5 text-[#73736C] hover:text-[#25251F] hover:bg-[#F3F0E6] rounded-lg transition-colors"
              title="Refresh mistake list"
            >
              <RefreshCw
                className={`w-4 h-4 ${isMistakesRefetching ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Mistakes Tracked</span>
              <Sliders className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#25251F] font-semibold">
              {stats.total}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Rules with repeated flags</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">High Frequency</span>
              <Flame className="w-4 h-4 text-[#B56E63]" />
            </div>
            <div className="text-2xl font-serif text-[#B56E63] font-semibold">
              {stats.highFreq}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">3+ repeated violations</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Refinements</span>
              <Sparkles className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-serif text-[#D97706] font-semibold">
              {stats.pending}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Awaiting Brand Guardian sign-off</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Feedback Loop Closed</span>
              <CheckCircle2 className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#68745D] font-semibold">
              {stats.applied}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Applied to live rules</p>
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
              <span>How the Continuous Guideline Improvement Loop Works</span>
            </div>
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHowItWorks && (
            <div className="px-4 pb-3 pt-1 border-t border-[#E5E1D8] space-y-2 leading-relaxed">
              <p>
                In standard organizations, writers repeatedly fail reviews because guidelines are ambiguously phrased, lacking concrete DO/DON&apos;T examples, or overly restrictive.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#73736C]">
                <li>
                  <strong className="text-[#25251F]">Automated Aggregation:</strong> Every rejection or flagged issue in the Review Workspace automatically increments a counter in the <code className="bg-[#EBE7DC] px-1 py-0.5 rounded text-[10px]">recurring_mistakes</code> table.
                </li>
                <li>
                  <strong className="text-[#25251F]">AI Rule Synthesis:</strong> When a rule crosses threshold violations, AI analyzes real-world writer draft excerpts and generates clarified rule phrasing.
                </li>
                <li>
                  <strong className="text-[#25251F]">One-Click Sign-Off:</strong> Brand Guardians review the proposal with a single click, immediately updating the active guideline standard and stopping future violations at the source!
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-[#F3F0E6] p-1 rounded-lg border border-[#E5E1D8] text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              All ({mistakes.length})
            </button>
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'PENDING'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              Pending Review ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('APPLIED')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'APPLIED'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              Applied ({stats.applied})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#73736C]" />
            <input
              type="text"
              placeholder="Filter by rule or guideline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg text-[#25251F] placeholder-[#A3A39D] focus:outline-none focus:ring-1 focus:ring-[#68745D]"
            />
          </div>
        </div>

        {/* Mistakes List */}
        {isMistakesLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-[#F3F0E6] rounded w-1/4" />
                <div className="h-20 bg-[#F8F7F2] rounded-lg" />
                <div className="h-16 bg-[#F3F0E6] rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredMistakes.length === 0 ? (
          /* Empty State */
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-10 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EEF2EB] text-[#68745D] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-serif text-lg text-[#25251F]">
                {activeTab === 'APPLIED'
                  ? 'No Applied Refinements Yet'
                  : 'Zero Recurring Mistakes Detected'}
              </h3>
              <p className="text-xs text-[#73736C] leading-relaxed">
                {activeTab === 'APPLIED'
                  ? 'Applied guideline revisions will be cataloged here once confirmed by Brand Guardians.'
                  : 'All brand rules are adhering smoothly. No high-frequency violation patterns have been triggered in recent reviews.'}
              </p>
            </div>

            {activeTab !== 'APPLIED' && (
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => seedDemoMutation.mutate()}
                  disabled={seedDemoMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-lg shadow-sm transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Inject Demo Mistakes to Test Loop
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Cards */
          <div className="space-y-4">
            {filteredMistakes.map((mistake) => {
              const isApplied = mistake.status === 'APPLIED';
              const isDismissed = mistake.status === 'DISMISSED';

              return (
                <div
                  key={mistake.id}
                  className={`bg-[#FFFEFA] border rounded-xl overflow-hidden transition-all shadow-xs ${
                    isApplied
                      ? 'border-[#D5DDD0]'
                      : 'border-[#E5E1D8] hover:border-[#68745D]/40'
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-5 py-3.5 bg-[#FAF9F5] border-b border-[#E5E1D8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Frequency Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#FDF4F2] text-[#B56E63] border border-[#F1D1CB]">
                        <Flame className="w-3.5 h-3.5" />
                        {mistake.violationCount}x Violations
                      </span>

                      {/* Rule Type */}
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border bg-[#F3F0E6] text-[#73736C] border-[#E5E1D8]">
                        {mistake.rule?.ruleType || 'RULE'}
                      </span>

                      {/* Guideline Title */}
                      <span className="text-xs text-[#73736C] font-medium truncate max-w-[200px]">
                        {mistake.rule?.guidelineTitle || 'Brand Guideline'}
                      </span>

                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          isApplied
                            ? 'bg-[#EEF2EB] text-[#68745D] border border-[#D5DDD0]'
                            : isDismissed
                            ? 'bg-[#F8F7F2] text-[#73736C] border border-[#E5E1D8]'
                            : 'bg-[#FFFBEB] text-[#D97706] border border-[#F4D99D]'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-3 h-3" />
                            Refinement Applied
                          </>
                        ) : isDismissed ? (
                          'Dismissed'
                        ) : (
                          'Pending Review'
                        )}
                      </span>
                    </div>

                    {/* Actions in header */}
                    <div className="flex items-center gap-2">
                      {!isApplied && mistake.suggestedGuidelineRevision && (
                        <button
                          onClick={() =>
                            applyMutation.mutate({
                              ruleId: mistake.ruleId,
                              newStatement: mistake.suggestedGuidelineRevision!,
                            })
                          }
                          disabled={applyMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-md shadow-xs transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Apply Refinement
                        </button>
                      )}

                      {!isApplied && (
                        <button
                          onClick={() => refineMutation.mutate(mistake.ruleId)}
                          disabled={refineMutation.isPending}
                          className="p-1 text-[#73736C] hover:text-[#25251F] hover:bg-[#F3F0E6] rounded-md transition-colors"
                          title="Regenerate AI refinement"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              refineMutation.isPending ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Current Rule */}
                    <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#73736C] uppercase tracking-wider text-[10px]">
                          Current Active Guideline Rule
                        </span>
                        <span className="text-[10px] text-[#73736C]">ID: {mistake.ruleId.slice(0, 8)}...</span>
                      </div>
                      <p className="text-xs text-[#25251F] font-medium leading-relaxed bg-white border border-[#E5E1D8] p-2.5 rounded-md">
                        &ldquo;{mistake.rule?.statement}&rdquo;
                      </p>
                    </div>

                    {/* Flagged Excerpts */}
                    {mistake.sampleExcerpts && mistake.sampleExcerpts.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-semibold text-[#73736C] uppercase tracking-wider">
                          Flagged excerpts ({mistake.sampleExcerpts.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {mistake.sampleExcerpts.map((excerpt, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-[#52524B] bg-[#F8F7F2] border border-[#E5E1D8] px-2.5 py-1 rounded-md italic"
                            >
                              &ldquo;{excerpt}&rdquo;
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Proposed Refinement */}
                    {mistake.suggestedGuidelineRevision && (
                      <div className="bg-[#F4F7F2] border border-[#D5DDD0] rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#68745D]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Suggested clarified guideline phrasing</span>
                          </div>
                          {isApplied && (
                            <span className="text-[10px] bg-[#EEF2EB] text-[#68745D] px-2 py-0.5 rounded font-medium">
                              Live in Guideline
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#25251F] font-semibold leading-relaxed bg-white border border-[#D5DDD0] p-2.5 rounded-md">
                          &ldquo;{mistake.suggestedGuidelineRevision}&rdquo;
                        </p>

                        {!isApplied && (
                          <div className="pt-2 flex items-center justify-between text-xs text-[#73736C]">
                            <span>Applying this revision clarifies the rule for future writers and stops review flags.</span>
                            <button
                              onClick={() =>
                                applyMutation.mutate({
                                  ruleId: mistake.ruleId,
                                  newStatement: mistake.suggestedGuidelineRevision!,
                                })
                              }
                              disabled={applyMutation.isPending}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#68745D] hover:underline"
                            >
                              <span>Commit to Guideline</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
