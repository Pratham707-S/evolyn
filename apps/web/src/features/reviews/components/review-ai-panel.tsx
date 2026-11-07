'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  AudioLines,
  Sparkles,
  ChevronUp,
  ChevronDown,
  BookOpen,
  FileText,
  Check,
  X,
  Scale,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type { DetectedIssue } from '@evolyn/shared';

export interface ReviewAiPanelProps {
  issues?: DetectedIssue[];
  selectedFindingId?: string | null;
  onSelectFinding?: (findingId: string, excerpt?: string) => void;
  onAcceptFinding?: (issue: DetectedIssue) => void;
  onDismissFinding?: (findingId: string) => void;
  onRunAudit?: () => void;
  isAuditing?: boolean;
  auditError?: string | null;
  hasReviewRun?: boolean;
  complianceScore?: number;
  showToast: (msg: string) => void;
}

type FilterCategory = 'ALL' | 'GRAMMAR' | 'BRAND' | 'EVIDENCE' | 'RECO';

export function ReviewAiPanel({
  issues = [],
  selectedFindingId,
  onSelectFinding,
  onAcceptFinding,
  onDismissFinding,
  onRunAudit,
  isAuditing = false,
  auditError = null,
  hasReviewRun = true,
  complianceScore,
  showToast,
}: ReviewAiPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
  };

  const safeIssues = Array.isArray(issues) ? issues.filter(Boolean) : [];

  const getIssueCategory = (issueType?: string): FilterCategory => {
    const t = (issueType || '').toUpperCase();
    if (t.includes('GRAMMAR') || t.includes('SPELL') || t.includes('TYPO')) return 'GRAMMAR';
    if (t.includes('CLAIM') || t.includes('EVIDENCE') || t.includes('UNSUBSTANTIATED') || t.includes('FACT')) return 'EVIDENCE';
    if (t.includes('RECO') || t.includes('SUGGESTION')) return 'RECO';
    // Brand violations include PROHIBITED_PHRASE, TERMINOLOGY_VIOLATION, TONE_MISMATCH, COMPLIANCE_RISK
    return 'BRAND';
  };

  // Filter issues
  const filteredIssues = safeIssues.filter((issue) => {
    if (activeFilter === 'ALL') return true;
    return getIssueCategory(issue.issueType) === activeFilter;
  });

  const grammarCount = safeIssues.filter((i) => getIssueCategory(i.issueType) === 'GRAMMAR').length;
  const brandCount = safeIssues.filter((i) => getIssueCategory(i.issueType) === 'BRAND').length;
  const evidenceCount = safeIssues.filter((i) => getIssueCategory(i.issueType) === 'EVIDENCE').length;
  const recoCount = safeIssues.filter((i) => getIssueCategory(i.issueType) === 'RECO').length;

  const filterTabs = [
    { id: 'ALL', label: 'All', count: safeIssues.length },
    { id: 'GRAMMAR', label: 'Grammar', count: grammarCount },
    { id: 'BRAND', label: 'Brand', count: brandCount },
    { id: 'EVIDENCE', label: 'Evidence', count: evidenceCount },
    { id: 'RECO', label: 'Reco', count: recoCount },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* 1. Header */}
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-[#25251F] leading-tight flex items-center justify-between">
          <span>AI Findings & Suggestions</span>
          <span className="text-[11px] font-mono text-[#68745D] bg-[#E8EBE1] px-1.5 py-0.5 rounded-full">
            {safeIssues.length} active
          </span>
        </h3>
        <p className="text-[11px] text-[#77766E] mt-0.5">
          Grounded anti-hallucination citations and brand rule checks.
        </p>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2.5 shrink-0 max-w-full">
        {filterTabs.map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterCategory)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
                  : 'bg-[#FFFEFA] border border-[#E5E1D8] text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E1D8] text-[#77766E]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Findings Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isAuditing ? (
          <div className="p-8 border border-dashed border-[#68745D]/40 rounded-xl text-center space-y-3 bg-[#E8EBE1]/30 my-auto animate-pulse">
            <Loader2 className="w-8 h-8 text-[#68745D] animate-spin mx-auto" />
            <h4 className="text-xs font-semibold text-[#25251F]">
              Auditing with Evolyn Governance Engine...
            </h4>
            <p className="text-[11px] text-[#77766E] max-w-xs mx-auto leading-relaxed">
              Scanning document against active brand rules, voice constraints, and approved factual evidence.
            </p>
          </div>
        ) : auditError ? (
          <div className="p-6 border border-dashed border-[#EAC4BE] rounded-xl text-center space-y-3 bg-[#FBEBE8]/40 my-auto">
            <AlertTriangle className="w-8 h-8 text-[#B56E63] mx-auto" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-[#25251F]">
                Governance Audit Incomplete or Timed Out
              </h4>
              <p className="text-[11px] text-[#77766E] leading-relaxed max-w-xs mx-auto">
                {auditError.includes('timeout') || auditError.includes('timed out')
                  ? 'The automated review took longer than expected due to document length. You can retry the audit now.'
                  : auditError}
              </p>
            </div>
            {onRunAudit && (
              <button
                type="button"
                onClick={onRunAudit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25251F] hover:bg-[#383832] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer mt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Governance Audit</span>
              </button>
            )}
          </div>
        ) : filteredIssues.length === 0 ? (
          safeIssues.length === 0 && hasReviewRun ? (
            <div className="p-8 border border-dashed border-[#D4DBC9] rounded-xl text-center space-y-3 bg-[#EEF4EE]/40 my-auto">
              <CheckCircle2 className="w-8 h-8 text-[#4E6B54] mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-[#25251F]">
                  All Core Checks Passed ({complianceScore ?? 100}% Compliant)
                </h4>
                <p className="text-[11px] text-[#77766E] leading-relaxed max-w-xs mx-auto">
                  No brand guideline violations, prohibited buzzwords, or unsubstantiated claims detected. Document is fully verified.
                </p>
              </div>
              {onRunAudit && (
                <button
                  type="button"
                  onClick={onRunAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E1D8] hover:bg-[#FAF9F5] text-[#25251F] rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                  <span>Re-Verify Content</span>
                </button>
              )}
            </div>
          ) : safeIssues.length === 0 && !hasReviewRun ? (
            <div className="p-8 border border-dashed border-[#E5E1D8] rounded-xl text-center space-y-3 bg-[#FAF9F5] my-auto">
              <Sparkles className="w-8 h-8 text-[#B78A4A] mx-auto opacity-80" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-[#25251F]">
                  Ready for Brand Governance Audit
                </h4>
                <p className="text-[11px] text-[#77766E] leading-relaxed max-w-xs mx-auto">
                  Evaluate this content against enterprise brand guidelines, prohibited terminology, and verified evidence facts.
                </p>
              </div>
              {onRunAudit && (
                <button
                  type="button"
                  onClick={onRunAudit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25251F] hover:bg-[#383832] text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B78A4A]" />
                  <span>Run AI Governance Audit</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 border border-dashed border-[#E5E1D8] rounded-xl text-center space-y-3 bg-[#FAF9F5] my-auto">
              <CheckCircle2 className="w-8 h-8 text-[#4E6B54] mx-auto opacity-80" />
              <h4 className="text-xs font-semibold text-[#25251F]">
                No Issues in this Category
              </h4>
              <p className="text-[11px] text-[#77766E] leading-relaxed max-w-xs mx-auto">
                All content conforms to verified guidelines in this review layer. Check other category tabs or "All" for detected findings.
              </p>
            </div>
          )
        ) : (
          filteredIssues.map((issue, idx) => {
            const issueId = issue.id || `issue-${idx}`;
            const isSelected = selectedFindingId === issueId;
            const isExpanded = expandedCards[issueId] !== false;
            const isAccepted = issue.status === 'ACCEPTED';
            const isOverridden = issue.status === 'OVERRIDDEN';

            return (
              <div
                key={issueId}
                onClick={() => onSelectFinding?.(issueId, issue.flaggedExcerpt)}
                className={`bg-[#FFFEFA] dark:bg-[#1E1D19] border rounded-xl p-3.5 shadow-2xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#68745D] ring-2 ring-[#68745D]/20 shadow-xs'
                    : 'border-[#E5E1D8] dark:border-[#2C2B26] hover:border-[#68745D]/40'
                } ${isAccepted ? 'opacity-60 bg-[#EEF4EE]/50 dark:bg-[#1A261C]/50' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        issue.issueType?.includes('GRAMMAR') || issue.issueType?.includes('SPELL')
                          ? 'bg-[#EBF1F7] dark:bg-[#1E293B] text-[#4A6B82] dark:text-[#93C5FD]'
                          : issue.issueType?.includes('PROHIBITED') ||
                            issue.issueType?.includes('VIOLATION') ||
                            issue.issueType?.includes('COMPLIANCE') ||
                            issue.issueType?.includes('GUIDELINE')
                          ? 'bg-[#FBEBE8] dark:bg-[#381E1C] text-[#B56E63] dark:text-[#FCA5A5]'
                          : issue.issueType?.includes('CLAIM') || issue.issueType?.includes('EVIDENCE')
                          ? 'bg-[#FDF9F0] dark:bg-[#332A18] text-[#B78A4A] dark:text-[#FDE047]'
                          : 'bg-[#E8EBE1] dark:bg-[#202E23] text-[#4E6B54] dark:text-[#86EFAC]'
                      }`}
                    >
                      {issue.issueType?.includes('GRAMMAR') || issue.issueType?.includes('SPELL') ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : issue.issueType?.includes('PROHIBITED') ||
                        issue.issueType?.includes('VIOLATION') ||
                        issue.issueType?.includes('COMPLIANCE') ||
                        issue.issueType?.includes('GUIDELINE') ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : issue.issueType?.includes('CLAIM') || issue.issueType?.includes('EVIDENCE') ? (
                        <Scale className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#25251F] dark:text-[#F7F5F0]">
                        {issue.issueType?.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-[10px] text-[#A09D92]">
                        Confidence: {Math.round((issue.confidenceScore || 1) * 100)}%
                        {issue.evidenceStrengthScore !== undefined && issue.evidenceStrengthScore > 0 && (
                          <span> • Evidence: {Math.round(issue.evidenceStrengthScore * 100)}%</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isAccepted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E8EBE1] dark:bg-[#202E23] text-[#4E6B54] dark:text-[#86EFAC] font-medium">
                        Accepted
                      </span>
                    )}
                    {isOverridden && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1EFE8] dark:bg-[#262520] text-[#77766E] dark:text-[#A09D92] font-medium">
                        Dismissed
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(issueId);
                      }}
                      className="p-1 text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] rounded-md transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Body when expanded */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5E1D8]/60 dark:border-[#2C2B26] space-y-2 text-xs">
                    {/* Explanation */}
                    <p className="text-[#25251F] dark:text-[#E4E2DC] text-[11px] leading-relaxed">
                      {issue.explanation}
                    </p>

                    {/* Flagged Excerpt */}
                    {issue.flaggedExcerpt && (
                      <div className="p-2 rounded-lg bg-[#FAF9F5] dark:bg-[#2A2322] border border-[#E5E1D8] dark:border-[#4A2D2B] text-[11px]">
                        <span className="text-[10px] font-semibold text-[#77766E] dark:text-[#A09D92] uppercase tracking-wider block mb-0.5">
                          Flagged Excerpt:
                        </span>
                        <span className="text-[#B56E63] dark:text-[#F87171] font-medium font-mono">
                          "{issue.flaggedExcerpt}"
                        </span>
                      </div>
                    )}

                    {/* Suggested Fix */}
                    {issue.suggestedFix && (
                      <div className="p-2 rounded-lg bg-[#EEF4EE] dark:bg-[#1A261C] border border-[#D4DBC9] dark:border-[#2D4530] text-[11px]">
                        <span className="text-[10px] font-semibold text-[#4E6B54] dark:text-[#86EFAC] uppercase tracking-wider block mb-0.5">
                          Suggested Replacement:
                        </span>
                        <span className="text-[#36533D] dark:text-[#DCFCE7] font-medium font-mono">
                          "{issue.suggestedFix}"
                        </span>
                      </div>
                    )}

                    {/* Grounded Citation Source Quote */}
                    {issue.sourceQuote && (
                      <div className="text-[10px] text-[#77766E] dark:text-[#A09D92] flex items-start gap-1 bg-[#FAF8F5] dark:bg-[#24231F] p-1.5 rounded-md border border-[#E5E1D8]/40 dark:border-[#2C2B26]">
                        <BookOpen className="w-3 h-3 text-[#68745D] dark:text-[#8A987D] shrink-0 mt-0.5" />
                        <span className="italic leading-normal">
                          {issue.issueType?.includes('GRAMMAR') || issue.issueType?.includes('SPELL')
                            ? `Standard: "${issue.sourceQuote}"`
                            : `Rule Source: "${issue.sourceQuote}"`}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isAccepted && !isOverridden && (
                      <div className="flex items-center gap-2 pt-1">
                        {issue.suggestedFix && onAcceptFinding && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAcceptFinding(issue);
                            }}
                            className="flex-1 py-1.5 px-2 bg-[#25251F] hover:bg-[#383832] dark:bg-[#F7F5F0] dark:hover:bg-[#EAE6DF] text-white dark:text-[#18181B] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply Fix</span>
                          </button>
                        )}

                        {onDismissFinding && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissFinding(issueId);
                            }}
                            className="py-1.5 px-2 text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })

        )}
      </div>
    </div>
  );
}
