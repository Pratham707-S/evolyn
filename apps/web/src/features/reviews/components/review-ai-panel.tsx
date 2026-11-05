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
  Ban,
  X,
} from 'lucide-react';

export interface ReviewAiPanelProps {
  isGuidelineAccepted: boolean;
  onAcceptGuideline: () => void;
  onRejectGuideline: () => void;
  isEvidenceAdded: boolean;
  onAddEvidence: () => void;
  onDismissEvidence: () => void;
  selectedFindingId?: string | null;
  showToast: (msg: string) => void;
}

type FilterCategory = 'ALL' | 'GRAMMAR' | 'BRAND' | 'EVIDENCE' | 'RECO';

export function ReviewAiPanel({
  isGuidelineAccepted,
  onAcceptGuideline,
  onRejectGuideline,
  isEvidenceAdded,
  onAddEvidence,
  onDismissEvidence,
  selectedFindingId,
  showToast,
}: ReviewAiPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'guideline-violation': true,
    'unsupported-claim': true,
    'grammar-spelling': true,
    'brand-tone': true,
    'ai-reco': true,
  });

  const toggleExpand = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const filterTabs = [
    { id: 'ALL', label: 'All', count: 5 },
    { id: 'GRAMMAR', label: 'Grammar', count: 1 },
    { id: 'BRAND', label: 'Brand', count: 2 },
    { id: 'EVIDENCE', label: 'Evidence', count: 1 },
    { id: 'RECO', label: 'Reco', count: 1 },
  ];

  const showGuideline = activeFilter === 'ALL' || activeFilter === 'BRAND';
  const showEvidence = activeFilter === 'ALL' || activeFilter === 'EVIDENCE';
  const showGrammar = activeFilter === 'ALL' || activeFilter === 'GRAMMAR';
  const showTone = activeFilter === 'ALL' || activeFilter === 'BRAND';
  const showReco = activeFilter === 'ALL' || activeFilter === 'RECO';

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* 1. Header */}
      <div className="mb-2 shrink-0">
        <h3 className="text-sm font-semibold text-[#25251F] leading-tight">
          AI Findings & Suggestions
        </h3>
        <p className="text-[11px] text-[#77766E] mt-0.5">
          Issues, recommendations, and brand checks for this content.
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
                className={`text-[10px] font-mono px-1 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E1D8] text-[#25251F]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Findings Cards List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {/* Card 1: Guideline Violation (High) */}
        {showGuideline && (
          <div
            className={`bg-[#FFFEFA] border rounded-xl p-3.5 shadow-2xs transition-all space-y-2.5 ${
              isGuidelineAccepted
                ? 'border-[#C8DEC9] bg-[#F7FAF7]'
                : selectedFindingId === 'finding-guideline'
                ? 'border-[#E07A70] ring-1 ring-[#E07A70]/50'
                : 'border-[#F4BFB9]'
            }`}
          >
            {/* Card Header */}
            <div
              onClick={() => toggleExpand('guideline-violation')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C0392B] shrink-0" />
                <span className="text-xs font-semibold text-[#25251F]">
                  Guideline Violation
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FDEAEA] text-[#9E342B]">
                  High
                </span>
                {expandedCards['guideline-violation'] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77766E]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
                )}
              </div>
            </div>

            {/* Card Body */}
            {expandedCards['guideline-violation'] && (
              <div className="space-y-2.5 pt-1 text-xs">
                <p className="text-[#25251F] leading-relaxed">
                  "100% brand compliance" is an absolute claim and isn't allowed per your brand guidelines.
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-[#77766E]">
                  <BookOpen className="w-3.5 h-3.5 text-[#68745D] shrink-0" />
                  <span>Guideline: Claims & Promise (G-04)</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#E5E1D8]/60">
                  {isGuidelineAccepted ? (
                    <div className="w-full bg-[#EEF4EE] border border-[#D1E2D3] text-[#36533D] text-[11px] font-medium py-1 px-2.5 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#64816A]" /> Accepted: Wording updated in editor
                      </span>
                      <button
                        type="button"
                        onClick={onRejectGuideline}
                        className="text-[10px] text-[#77766E] hover:underline cursor-pointer"
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onAcceptGuideline}
                        className="bg-[#68745D] hover:bg-[#58644E] text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Suggestion</span>
                      </button>

                      <button
                        type="button"
                        onClick={onRejectGuideline}
                        className="border border-[#E5E1D8] hover:bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F] text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Ban className="w-3 h-3 text-[#A09D92]" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card 2: Unsupported Claim (Medium) */}
        {showEvidence && (
          <div
            className={`bg-[#FFFEFA] border rounded-xl p-3.5 shadow-2xs transition-all space-y-2.5 ${
              isEvidenceAdded
                ? 'border-[#C8DEC9] bg-[#F7FAF7]'
                : selectedFindingId === 'finding-evidence'
                ? 'border-[#E0A868] ring-1 ring-[#E0A868]/50'
                : 'border-[#F0D5B5]'
            }`}
          >
            {/* Card Header */}
            <div
              onClick={() => toggleExpand('unsupported-claim')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="text-xs font-semibold text-[#25251F]">
                  Unsupported Claim
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FDF4E7] text-[#92540D]">
                  Medium
                </span>
                {expandedCards['unsupported-claim'] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77766E]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
                )}
              </div>
            </div>

            {/* Card Body */}
            {expandedCards['unsupported-claim'] && (
              <div className="space-y-2.5 pt-1 text-xs">
                <p className="text-[#25251F] leading-relaxed">
                  "Increase campaign performance by up to 3x" needs supporting evidence.
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-[#77766E]">
                  <FileText className="w-3.5 h-3.5 text-[#68745D] shrink-0" />
                  <span>Evidence: No linked source</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#E5E1D8]/60">
                  {isEvidenceAdded ? (
                    <div className="w-full bg-[#EEF4EE] border border-[#D1E2D3] text-[#36533D] text-[11px] font-medium py-1 px-2.5 rounded-lg flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#64816A]" /> Evidence linked: SOC2 Benchmark Report
                      </span>
                      <button
                        type="button"
                        onClick={onDismissEvidence}
                        className="text-[10px] text-[#77766E] hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onAddEvidence}
                        className="bg-[#68745D] hover:bg-[#58644E] text-white text-xs font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Add Evidence</span>
                      </button>

                      <button
                        type="button"
                        onClick={onDismissEvidence}
                        className="border border-[#E5E1D8] hover:bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F] text-xs font-medium py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card 3: Grammar & Spelling (Low) */}
        {showGrammar && (
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 shadow-2xs transition-all space-y-1.5">
            <div
              onClick={() => toggleExpand('grammar-spelling')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#4E7D55] shrink-0" />
                <span className="text-xs font-semibold text-[#25251F]">
                  Grammar & Spelling
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EEF4EE] text-[#36533D]">
                  Low
                </span>
                {expandedCards['grammar-spelling'] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77766E]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
                )}
              </div>
            </div>

            {expandedCards['grammar-spelling'] && (
              <p className="text-[11px] text-[#77766E] pt-1">
                No critical grammar or spelling issues found.
              </p>
            )}
          </div>
        )}

        {/* Card 4: Brand Tone (Medium) */}
        {showTone && (
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 shadow-2xs transition-all space-y-1.5">
            <div
              onClick={() => toggleExpand('brand-tone')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AudioLines className="w-4 h-4 text-[#68745D] shrink-0" />
                <span className="text-xs font-semibold text-[#25251F]">
                  Brand Tone
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#FDF4E7] text-[#92540D]">
                  Medium
                </span>
                {expandedCards['brand-tone'] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77766E]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
                )}
              </div>
            </div>

            {expandedCards['brand-tone'] && (
              <p className="text-[11px] text-[#77766E] pt-1">
                Consider a more balanced and less promotional tone.
              </p>
            )}
          </div>
        )}

        {/* Card 5: AI Recommendation (Low) */}
        {showReco && (
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 shadow-2xs transition-all space-y-1.5">
            <div
              onClick={() => toggleExpand('ai-reco')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#68745D] shrink-0" />
                <span className="text-xs font-semibold text-[#25251F]">
                  AI Recommendation
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EEF4EE] text-[#36533D]">
                  Low
                </span>
                {expandedCards['ai-reco'] ? (
                  <ChevronUp className="w-3.5 h-3.5 text-[#77766E]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
                )}
              </div>
            </div>

            {expandedCards['ai-reco'] && (
              <p className="text-[11px] text-[#77766E] pt-1">
                Refine the closing line to be more specific and action-oriented.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
