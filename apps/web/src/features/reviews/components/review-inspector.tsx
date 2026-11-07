'use client';

import React, { useState } from 'react';
import {
  FileText,
  Linkedin,
  Globe,
  Mail,
  BookOpen,
  Instagram,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  History,
  CheckCircle2,
  Edit3,
  Layers,
  Info,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { QueueItem } from './review-queue';
import { DecisionModal } from './decision-modal';

export interface ReviewInspectorProps {
  item: QueueItem;
  onDecisionSubmitted?: (type: string, note: string) => void;
  showToast: (msg: string) => void;
}

export function ReviewInspector({
  item,
  onDecisionSubmitted,
  showToast,
}: ReviewInspectorProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'findings' | 'guidelines' | 'history'>('review');
  const [copied, setCopied] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'CHANGES_REQUESTED'>('APPROVED');

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Submitted copy copied to clipboard');
  };

  const handleRunAiAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      showToast('AI multi-layer semantic audit re-verified with Evolyn Governance Engine');
    }, 1200);
  };

  const handleConfirmDecision = (comments: string, reviewer: string) => {
    if (onDecisionSubmitted) {
      onDecisionSubmitted(decisionType, comments);
    }
    showToast(
      decisionType === 'APPROVED'
        ? `Successfully approved "${item.title}" by ${reviewer}`
        : `Changes requested on "${item.title}"`
    );
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-[#25251F]" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-[#77766E]" />;
      case 'blog':
        return <BookOpen className="w-3.5 h-3.5 text-[#68745D]" />;
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#77766E]" />;
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-6 shadow-2xs min-h-[580px]">
      {/* 1. Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h1 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight leading-tight">
                {item.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#77766E] mt-1">
                <span className="flex items-center gap-1 font-medium text-[#25251F]">
                  {getChannelIcon(item.channel)}
                  {item.channel}
                </span>
                <span>•</span>
                <span>Submitted {item.timeAgo}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-[#A09D92]">
                  {item.reviewId}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span className="self-start sm:self-center inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            {item.status}
          </span>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-[#E5E1D8] text-xs font-medium text-[#77766E]">
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'review'
                ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
                : 'hover:text-[#25251F]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Review</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'findings'
                ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
                : 'hover:text-[#25251F]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#B78A4A]" />
            <span>Findings ({item?.findings?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'guidelines'
                ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
                : 'hover:text-[#25251F]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guidelines</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 flex items-center gap-1.5 transition-colors relative ${
              activeTab === 'history'
                ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
                : 'hover:text-[#25251F]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Body Container */}
      <div className="flex-1">
        {/* TAB 1: REVIEW (Primary Side-by-Side Workstation View) */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Submitted Content Box */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
                  Submitted Content
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
                  title="Copy content"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#64816A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-4 text-xs sm:text-sm text-[#25251F] leading-relaxed whitespace-pre-line min-h-[220px]">
                {item.content}
              </div>
            </div>

            {/* Right: Review Summary & Findings Overview */}
            <div className="space-y-4">
              {/* Review Summary */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#25251F]">
                  <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                  <span>Review Summary</span>
                </div>
                <p className="text-xs text-[#77766E] leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Findings Overview */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#25251F]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#64816A]" />
                  <span>Findings Overview</span>
                </div>

                <div className="space-y-1.5">
                  {item.findings.map((f) => {
                    const badgeStyles =
                      f.severity === 'High'
                        ? 'bg-[#FDF2EC] text-[#B56E63] border-[#F2D7CA]'
                        : 'bg-[#FEF7EC] text-[#B78A4A] border-[#F4E3C7]';

                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedFindingId(f.id);
                          setActiveTab('findings');
                        }}
                        className="w-full text-left p-2.5 rounded-lg border border-[#E5E1D8] hover:border-[#68745D]/40 bg-[#FFFEFA] hover:bg-[#FAF8F5] transition-all flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${badgeStyles}`}
                          >
                            {f.severity}
                          </span>
                          <span className="text-xs text-[#25251F] truncate font-normal group-hover:text-[#68745D] transition-colors">
                            {f.title}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#A09D92] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FINDINGS DETAILS (Deep Citations & Verbatim Quotes) */}
        {activeTab === 'findings' && (
          <div className="space-y-3">
            <p className="text-xs text-[#77766E]">
              Grounded AI findings cross-referenced with verbatim guideline policies and verified factual sources.
            </p>

            <div className="space-y-3">
              {item.findings.map((f) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedFindingId === f.id
                      ? 'bg-[#F9F7F2] border-[#68745D] ring-1 ring-[#68745D]/20'
                      : 'bg-[#FFFEFA] border-[#E5E1D8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase ${
                          f.severity === 'High'
                            ? 'bg-[#FDF2EC] text-[#B56E63] border-[#F2D7CA]'
                            : 'bg-[#FEF7EC] text-[#B78A4A] border-[#F4E3C7]'
                        }`}
                      >
                        {f.severity} Severity
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-[#25251F]">
                        {f.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-[#68745D] font-medium">
                      {(f.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-[#77766E] mt-2">
                    {f.explanation}
                  </p>

                  {/* Verbatim Source Quote (Zero Hallucination) */}
                  <div className="mt-3 p-3 bg-[#F7F5F0] rounded-lg border-l-2 border-[#68745D] text-xs">
                    <span className="font-semibold text-[11px] text-[#25251F] uppercase tracking-wider block mb-1">
                      Verbatim Guideline Mandate
                    </span>
                    <blockquote className="italic text-[#25251F]">
                      &quot;{f.verbatimQuote}&quot;
                    </blockquote>
                  </div>

                  {/* Suggested Fix */}
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-[#77766E]">
                      Suggested Fix: <strong className="text-[#25251F]">{f.suggestedFix}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => showToast(`Accepted suggested change for: ${f.title}`)}
                      className="h-7 text-xs"
                    >
                      Apply Fix
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GUIDELINES EVALUATED */}
        {activeTab === 'guidelines' && (
          <div className="space-y-3">
            <p className="text-xs text-[#77766E]">
              Evaluated policies for channel: <strong className="text-[#25251F]">{item.channel}</strong>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl text-xs space-y-1">
                <span className="font-semibold text-[#25251F]">Tone & Voice Policy</span>
                <p className="text-[#77766E]">
                  Tone must remain authoritative, precise, and understated. Avoid excessive superlatives or hype keywords.
                </p>
              </div>
              <div className="p-3.5 bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl text-xs space-y-1">
                <span className="font-semibold text-[#25251F]">Regulatory Claims Standard</span>
                <p className="text-[#77766E]">
                  Every performance statistic must reference an approved SOC2 or benchmark proof source.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <p className="text-xs text-[#77766E]">
              Full cryptographic audit trail of review events.
            </p>
            <div className="border border-[#E5E1D8] rounded-xl divide-y divide-[#E5E1D8] text-xs">
              <div className="p-3 flex items-center justify-between bg-[#FFFEFA]">
                <div>
                  <p className="font-medium text-[#25251F]">Submitted for Review</p>
                  <p className="text-[11px] text-[#77766E]">Actor: Campaign Team · Automated ingest</p>
                </div>
                <span className="text-[#A09D92]">2h ago</span>
              </div>
              <div className="p-3 flex items-center justify-between bg-[#FFFEFA]">
                <div>
                  <p className="font-medium text-[#25251F]">Evolyn Semantic Governance Run</p>
                  <p className="text-[11px] text-[#77766E]">Generated 3 potential findings with verbatim quotes</p>
                </div>
                <span className="text-[#A09D92]">2h ago</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Action Bar matching reference */}
      <div className="pt-4 border-t border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Actions: AI Analysis & Suggest Changes */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
            <span>{analyzing ? 'Analyzing...' : 'AI Analysis'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => showToast('Opened inline suggestion editor')}
            className="gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#77766E]" />
            <span>Suggest Changes</span>
          </Button>
        </div>

        {/* Right Actions: Request Changes & Approve */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDecisionType('CHANGES_REQUESTED');
              setDecisionModalOpen(true);
            }}
          >
            Request Changes
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDecisionType('APPROVED');
              setDecisionModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Approve</span>
          </Button>
        </div>
      </div>

      {/* Decision Confirmation Modal */}
      <DecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        submissionTitle={item.title}
        decisionType={decisionType}
        onConfirm={handleConfirmDecision}
      />
    </div>
  );
}
