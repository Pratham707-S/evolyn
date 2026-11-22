'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Check,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface GuidelineRuleDetail {
  id: string;
  statement: string;
  ruleType: string;
  severity: string;
  guidelineId: string;
  guidelineTitle: string;
}

interface GuidelineConflict {
  id: string;
  ruleAId: string;
  ruleBId: string;
  conflictType: 'CONTRADICTION' | 'AMBIGUITY' | 'OVERLAP';
  severity: 'CRITICAL' | 'WARNING';
  explanation: string;
  suggestedResolution?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
  ruleA: GuidelineRuleDetail;
  ruleB: GuidelineRuleDetail;
}

interface ConflictListResponse {
  conflicts: GuidelineConflict[];
  total: number;
}

interface BackendGuideline {
  id: string;
  title: string;
  rules?: Array<{ id: string; ruleStatement: string }>;
}

export default function ConflictDetectorPage() {
  const { showToast } = useAppShell();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // 1. Fetch Conflicts
  const {
    data: conflictData,
    isLoading: isConflictsLoading,
    isRefetching: isConflictsRefetching,
    refetch: refetchConflicts,
  } = useQuery<ConflictListResponse>({
    queryKey: ['guidelines', 'conflicts'],
    queryFn: async () => {
      return apiClient.get<ConflictListResponse>('/api/guidelines/conflicts');
    },
  });

  // 2. Fetch Guidelines to get total rules count
  const { data: guidelinesData } = useQuery<BackendGuideline[]>({
    queryKey: ['guidelines', 'list'],
    queryFn: async () => {
      return apiClient.get<BackendGuideline[]>('/api/guidelines');
    },
  });

  // Calculate total rules evaluated
  const totalRulesCount = useMemo(() => {
    if (!guidelinesData || !Array.isArray(guidelinesData)) return 0;
    return guidelinesData.reduce((acc, g) => acc + (g.rules?.length || 0), 0);
  }, [guidelinesData]);

  // 3. Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ conflicts: GuidelineConflict[]; total: number; message: string }>(
        '/api/guidelines/detect-all-conflicts'
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guidelines', 'conflicts'] });
      showToast(
        `Scan complete! Found ${data.total} guideline conflict${data.total === 1 ? '' : 's'}.`
      );
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to complete conflict scan.');
    },
  });

  // 4. Seed Demo Contradiction Mutation
  const seedDemoMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<{ conflict: GuidelineConflict; message: string }>(
        '/api/guidelines/conflicts/seed-sample'
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guidelines', 'conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['guidelines', 'list'] });
      showToast(data.message || 'Demo contradiction injected & detected successfully!');
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to inject demo contradiction.');
    },
  });

  // 5. Update Status Mutation (Resolve / Reopen)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ conflictId, status }: { conflictId: string; status: 'RESOLVED' | 'OPEN' }) => {
      return apiClient.patch<{ conflict: GuidelineConflict }>(
        `/api/guidelines/conflicts/${conflictId}`,
        { status }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guidelines', 'conflicts'] });
      showToast(
        variables.status === 'RESOLVED'
          ? 'Conflict marked as resolved.'
          : 'Conflict reopened for review.'
      );
    },
    onError: (err: any) => {
      showToast(err?.message || 'Failed to update conflict status.');
    },
  });

  const conflicts = conflictData?.conflicts || [];

  // Filter and search
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      // Tab filter
      if (activeTab === 'OPEN' && c.status !== 'OPEN') return false;
      if (activeTab === 'RESOLVED' && c.status !== 'RESOLVED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const ruleAText = c.ruleA?.statement?.toLowerCase() || '';
        const ruleBText = c.ruleB?.statement?.toLowerCase() || '';
        const expText = c.explanation?.toLowerCase() || '';
        const guideAText = c.ruleA?.guidelineTitle?.toLowerCase() || '';
        const guideBText = c.ruleB?.guidelineTitle?.toLowerCase() || '';

        return (
          ruleAText.includes(query) ||
          ruleBText.includes(query) ||
          expText.includes(query) ||
          guideAText.includes(query) ||
          guideBText.includes(query)
        );
      }

      return true;
    });
  }, [conflicts, activeTab, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = conflicts.length;
    const contradictions = conflicts.filter(
      (c) => c.conflictType === 'CONTRADICTION' && c.status === 'OPEN'
    ).length;
    const ambiguities = conflicts.filter(
      (c) => c.conflictType === 'AMBIGUITY' && c.status === 'OPEN'
    ).length;
    const resolved = conflicts.filter((c) => c.status === 'RESOLVED').length;

    return { total, contradictions, ambiguities, resolved };
  }, [conflicts]);

  return (
    <AppShell activeItem="Conflict Detector">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                Guideline Conflict Detector
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-[#F3F0E6] text-[#68745D] border border-[#E5E1D8] rounded-full">
                Core Innovation
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#73736C] mt-1">
              Autonomous semantic contradiction and ambiguity detection across brand guideline rules.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => seedDemoMutation.mutate()}
              disabled={seedDemoMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B56E63] bg-[#FDF4F2] hover:bg-[#FBEAE7] border border-[#F1D1CB] rounded-lg transition-colors disabled:opacity-50"
              title="Inject a test Tone contradiction to verify detector logic"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {seedDemoMutation.isPending ? 'Injecting...' : 'Inject Demo Contradiction'}
            </button>

            <button
              onClick={() => scanMutation.mutate()}
              disabled={scanMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {scanMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {scanMutation.isPending ? 'Auditing Rules...' : 'Run AI Conflict Scan'}
            </button>

            <button
              onClick={() => refetchConflicts()}
              disabled={isConflictsRefetching}
              className="p-1.5 text-[#73736C] hover:text-[#25251F] hover:bg-[#F3F0E6] rounded-lg transition-colors"
              title="Refresh conflict list"
            >
              <RefreshCw
                className={`w-4 h-4 ${isConflictsRefetching ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Rules Audited</span>
              <BookOpen className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#25251F] font-semibold">
              {totalRulesCount > 0 ? totalRulesCount : 11}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Across active guidelines</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Contradictions</span>
              <AlertTriangle className="w-4 h-4 text-[#B56E63]" />
            </div>
            <div className="text-2xl font-serif text-[#B56E63] font-semibold">
              {stats.contradictions}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Direct logical clashes</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Ambiguities</span>
              <HelpCircle className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-serif text-[#D97706] font-semibold">
              {stats.ambiguities}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Vague or overlapping scope</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="text-2xl font-serif text-[#68745D] font-semibold">
              {stats.resolved}
            </div>
            <p className="text-[11px] text-[#73736C] mt-0.5">Human reviewed & cleared</p>
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
              <span>How the Conflict Detector Works</span>
            </div>
            {showHowItWorks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showHowItWorks && (
            <div className="px-4 pb-3 pt-1 border-t border-[#E5E1D8] space-y-2 leading-relaxed">
              <p>
                Evolyn scans all active brand guideline rules using Gemini AI and vector semantic similarity.
                It identifies pairwise logical clashes:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#73736C]">
                <li>
                  <strong className="text-[#25251F]">Direct Contradiction:</strong> When Rule A commands an action (e.g., &ldquo;Always use casual conversational tone&rdquo;) that Rule B explicitly prohibits (e.g., &ldquo;Maintain strictly formal academic tone&rdquo;).
                </li>
                <li>
                  <strong className="text-[#25251F]">Ambiguity & Scope Overlap:</strong> When two rules dictate competing instructions for the same channel, target audience, or claim type without a precedence rule.
                </li>
              </ul>
              <p className="text-[11px] text-[#73736C]">
                All detected conflicts are stored with strict relational integrity (<code className="bg-[#EBE7DC] px-1 py-0.5 rounded text-[10px]">rule_a_id &lt; rule_b_id</code>) and surface AI-driven suggestions for human sign-off.
              </p>
            </div>
          )}
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-[#F3F0E6] p-1 rounded-lg border border-[#E5E1D8] text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              All ({conflicts.length})
            </button>
            <button
              onClick={() => setActiveTab('OPEN')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'OPEN'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              Open ({conflicts.filter((c) => c.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setActiveTab('RESOLVED')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'RESOLVED'
                  ? 'bg-white text-[#25251F] shadow-xs'
                  : 'text-[#73736C] hover:text-[#25251F]'
              }`}
            >
              Resolved ({stats.resolved})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#73736C]" />
            <input
              type="text"
              placeholder="Filter rules or explanations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg text-[#25251F] placeholder-[#A3A39D] focus:outline-none focus:ring-1 focus:ring-[#68745D]"
            />
          </div>
        </div>

        {/* Conflicts List */}
        {isConflictsLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-6 animate-pulse space-y-4"
              >
                <div className="h-4 bg-[#F3F0E6] rounded w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-24 bg-[#F8F7F2] rounded-lg" />
                  <div className="h-24 bg-[#F8F7F2] rounded-lg" />
                </div>
                <div className="h-12 bg-[#F3F0E6] rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredConflicts.length === 0 ? (
          /* Empty State */
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-10 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EEF2EB] text-[#68745D] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-serif text-lg text-[#25251F]">
                {activeTab === 'RESOLVED'
                  ? 'No Resolved Conflicts Yet'
                  : 'Brand Guidelines Are Logically Coherent'}
              </h3>
              <p className="text-xs text-[#73736C] leading-relaxed">
                {activeTab === 'RESOLVED'
                  ? 'Resolved conflicts will appear here once reviewed and cleared by your team.'
                  : 'No active contradictions or ambiguities detected across your brand guideline rules. The AI validator found zero conflicting mandates.'}
              </p>
            </div>

            {activeTab !== 'RESOLVED' && (
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => seedDemoMutation.mutate()}
                  disabled={seedDemoMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-lg shadow-sm transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Inject Demo Contradiction to Test
                </button>
                <Link
                  href="/guidelines"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#25251F] bg-[#F3F0E6] hover:bg-[#EBE7DC] border border-[#E5E1D8] rounded-lg transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#68745D]" />
                  View All Guidelines
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Conflict Cards */
          <div className="space-y-4">
            {filteredConflicts.map((conflict) => {
              const isResolved = conflict.status === 'RESOLVED';
              const isContradiction = conflict.conflictType === 'CONTRADICTION';

              return (
                <div
                  key={conflict.id}
                  className={`bg-[#FFFEFA] border rounded-xl overflow-hidden transition-all shadow-xs ${
                    isResolved
                      ? 'border-[#E5E1D8] opacity-80'
                      : isContradiction
                      ? 'border-[#F1D1CB] hover:border-[#B56E63]'
                      : 'border-[#F4D99D] hover:border-[#D97706]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-5 py-3.5 bg-[#FAF9F5] border-b border-[#E5E1D8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2">
                      {/* Conflict Type Badge */}
                      <span
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                          isContradiction
                            ? 'bg-[#FDF4F2] text-[#B56E63] border-[#F1D1CB]'
                            : 'bg-[#FFFBEB] text-[#D97706] border-[#F4D99D]'
                        }`}
                      >
                        {conflict.conflictType}
                      </span>

                      {/* Severity Badge */}
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${
                          conflict.severity === 'CRITICAL'
                            ? 'bg-[#FDF4F2] text-[#B56E63] border-[#F1D1CB]'
                            : 'bg-[#F3F0E6] text-[#73736C] border-[#E5E1D8]'
                        }`}
                      >
                        {conflict.severity}
                      </span>

                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          isResolved
                            ? 'bg-[#EEF2EB] text-[#68745D] border border-[#D5DDD0]'
                            : 'bg-[#F8F7F2] text-[#73736C] border border-[#E5E1D8]'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <Check className="w-3 h-3" />
                            Resolved
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-[#B56E63]" />
                            Open Clash
                          </>
                        )}
                      </span>
                    </div>

                    {/* Action button in header */}
                    <div className="flex items-center gap-2">
                      {isResolved ? (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              conflictId: conflict.id,
                              status: 'OPEN',
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#73736C] hover:text-[#25251F] bg-white border border-[#E5E1D8] rounded-md transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reopen
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              conflictId: conflict.id,
                              status: 'RESOLVED',
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-[#68745D] hover:bg-[#58634E] rounded-md shadow-xs transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          Resolve Conflict
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rule A vs Rule B Comparison */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Rule A */}
                      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#68745D] uppercase tracking-wide text-[10px]">
                            Rule A • {conflict.ruleA?.ruleType || 'MANDATE'}
                          </span>
                          <span className="text-[#73736C] text-[11px] truncate max-w-[160px]">
                            {conflict.ruleA?.guidelineTitle || 'Brand Guideline'}
                          </span>
                        </div>
                        <p className="text-xs text-[#25251F] font-medium leading-relaxed bg-white border border-[#E5E1D8] p-2.5 rounded-md">
                          &ldquo;{conflict.ruleA?.statement || 'Rule statement not available'}&rdquo;
                        </p>
                      </div>

                      {/* Rule B */}
                      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#B56E63] uppercase tracking-wide text-[10px]">
                            Rule B • {conflict.ruleB?.ruleType || 'RESTRICTION'}
                          </span>
                          <span className="text-[#73736C] text-[11px] truncate max-w-[160px]">
                            {conflict.ruleB?.guidelineTitle || 'Brand Guideline'}
                          </span>
                        </div>
                        <p className="text-xs text-[#25251F] font-medium leading-relaxed bg-white border border-[#E5E1D8] p-2.5 rounded-md">
                          &ldquo;{conflict.ruleB?.statement || 'Rule statement not available'}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* AI Explanation & Recommendation */}
                    <div className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#25251F]">
                        <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                        <span>Semantic Analysis & Contradiction Cause</span>
                      </div>
                      <p className="text-xs text-[#52524B] leading-relaxed">
                        {conflict.explanation}
                      </p>

                      {conflict.suggestedResolution && (
                        <div className="pt-2 mt-2 border-t border-[#E5E1D8]/60 flex items-start gap-2 text-xs">
                          <ArrowRight className="w-3.5 h-3.5 text-[#68745D] shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-medium text-[#25251F]">
                              Suggested Resolution:
                            </span>{' '}
                            <span className="text-[#52524B]">
                              {conflict.suggestedResolution}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
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
