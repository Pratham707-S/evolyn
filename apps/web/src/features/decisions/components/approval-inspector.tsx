'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Linkedin,
  Globe,
  Mail,
  BookOpen,
  Instagram,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Ban,
  TrendingUp,
  FileCheck,
  Eye,
  Sliders,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export interface AuditChangeItem {
  id: string;
  title: string;
  description: string;
  before?: string;
  after?: string;
  isApproved: boolean; // true = approved/accepted in review; false = not approved / pending reviewer decision
  rule: string;
}

export interface DecisionItem {
  id: string;
  title: string;
  snippet: string;
  content: string;
  channel: 'LinkedIn' | 'Website' | 'Email' | 'Blog' | 'Instagram' | string;
  decision: 'Approved' | 'Changes Requested' | 'Rejected' | 'Pending';
  reviewer: string;
  reviewerName: string;
  date: string;
  reviewId: string;
  summary: string;
  findingsCount: number;
  changes?: AuditChangeItem[];
}

export interface ApprovalInspectorProps {
  item: DecisionItem;
  onDecisionSubmit?: (
    itemId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    notes: string
  ) => void;
  showToast: (msg: string) => void;
}

export function ApprovalInspector({
  item,
  onDecisionSubmit,
  showToast,
}: ApprovalInspectorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'changes' | 'preview' | 'policy'>('changes');
  const [copied, setCopied] = useState(false);
  const [reviewerComment, setReviewerComment] = useState('');
  const [changesFilter, setChangesFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  const defaultChanges: AuditChangeItem[] = [
    {
      id: 'ch-1',
      title: 'Softened absolute performance guarantee',
      description:
        'Replaced unqualified promise ("eliminates 100% of risk") with verified enterprise evidence citation.',
      before: 'eliminates 100% of brand compliance risk and guarantees zero defect marketing',
      after: 'helps marketing teams prevent compliance risks with verified audit citations',
      isApproved: true,
      rule: 'Rule 1.4: Grounded Performance',
    },
    {
      id: 'ch-2',
      title: 'Registered trademark notice added',
      description:
        'Inserted mandatory trademark indicator on primary platform product introduction.',
      before: 'Evolyn',
      after: 'Evolyn™ Brand Governance',
      isApproved: true,
      rule: 'Rule 3.2: Nomenclature Standard',
    },
    {
      id: 'ch-3',
      title: 'Speed assertion without benchmark link',
      description:
        'Phrase "in seconds" lacks empirical platform citation. Reviewer sign-off required to accept or flag.',
      before: 'in seconds',
      after: 'in real time with automated citation checks',
      isApproved: false,
      rule: 'Rule 2.1: Tone & Claims',
    },
  ];

  // Local state for changes so reviewer can toggle/sign-off on individual items
  const [localChanges, setLocalChanges] = useState<AuditChangeItem[]>(
    item.changes && item.changes.length > 0 ? item.changes : defaultChanges
  );

  // Sync when item changes
  useEffect(() => {
    setLocalChanges(
      item.changes && item.changes.length > 0 ? item.changes : defaultChanges
    );
    setReviewerComment('');
  }, [item.id, item.changes]);

  const approvedChanges = localChanges.filter((c) => c.isApproved);
  const pendingChanges = localChanges.filter((c) => !c.isApproved);

  const filteredChanges = localChanges.filter((c) => {
    if (changesFilter === 'APPROVED') return c.isApproved;
    if (changesFilter === 'PENDING') return !c.isApproved;
    return true;
  });

  const handleToggleChangeApproval = (changeId: string) => {
    setLocalChanges((prev) =>
      prev.map((c) => {
        if (c.id === changeId) {
          const next = !c.isApproved;
          showToast(
            next
              ? `Signed off on change: "${c.title}"`
              : `Flagged change as pending: "${c.title}"`
          );
          return { ...c, isApproved: next };
        }
        return c;
      })
    );
  };

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(item.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('Compiled document text copied to clipboard');
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      showToast('Could not access clipboard');
    }
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

  const renderDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            <CheckCircle2 className="w-3 h-3 text-[#64816A]" />
            Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF4E7] text-[#865920] border border-[#F0D5B5]">
            <AlertTriangle className="w-3 h-3 text-[#B78A4A]" />
            Changes Requested
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDEAEA] text-[#8A332B] border border-[#F4BFB9]">
            <XCircle className="w-3 h-3 text-[#B56E63]" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1EFE8] text-[#25251F] border border-[#E5E1D8]">
            <Clock className="w-3 h-3 text-[#77766E]" />
            Ready for Sign-off
          </span>
        );
    }
  };

  const handleDecision = (type: 'Approved' | 'Changes Requested' | 'Rejected') => {
    if (onDecisionSubmit) {
      onDecisionSubmit(item.id, type, reviewerComment);
    }
    showToast(`Decision recorded: ${type} for "${item.title}"`);
    setReviewerComment('');
  };

  const applyPresetComment = (preset: string) => {
    setReviewerComment((prev) => (prev ? `${prev} • ${preset}` : preset));
    showToast(`Added sign-off note: "${preset}"`);
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* 1. Item Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E5E1D8]/80">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5 shadow-2xs">
            <FileText className="w-5 h-5 text-[#25251F]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight truncate">
                {item.title}
              </h3>
              {renderDecisionBadge(item.decision)}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#77766E] mt-1 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-[#25251F]">
                {getChannelIcon(item.channel)}
                <span>{item.channel}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">{item.reviewId}</span>
              <span>•</span>
              <span>Submitted {item.date}</span>
            </div>
          </div>
        </div>

        {/* Action to Jump to Review Workspace */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={() => router.push(`/reviews?id=${item.id}`)}
            className="bg-[#FAF9F5] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Inspect in interactive 3-column review workspace"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#68745D]" />
            <span>Open in Review Workspace</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Post-Review Summary Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FAF9F5] to-[#F3F0E8] border border-[#E5E1D8] space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-xs sm:text-sm text-[#25251F] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#68745D]" />
            Post-Review Governance Summary
          </span>
          <span className="text-[11px] font-mono text-[#4E6B54] font-medium bg-[#EEF4EE] border border-[#D1E2D3] px-2.5 py-0.5 rounded-full">
            Review Phase Completed
          </span>
        </div>

        <p className="text-xs text-[#55544E] leading-relaxed">
          {item.summary ||
            'Content has completed automated AI guideline checks. Reviewer accepted verified phrasing in the workspace. Review the changes below to execute final sign-off.'}
        </p>

        {/* 3 Metric Progress Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Compliance Score */}
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#77766E]">
              <span>Compliance Score</span>
              <span className="text-[#64816A] font-semibold flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +8.6%
              </span>
            </div>
            <p className="font-serif text-lg font-normal text-[#25251F] mt-0.5">
              96.8%
            </p>
          </div>

          {/* Approved in Review */}
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#77766E]">
              <span>Approved in Review</span>
              <span className="text-[#4E6B54] font-semibold">✓ Ready</span>
            </div>
            <p className="font-serif text-lg font-normal text-[#25251F] mt-0.5">
              {approvedChanges.length} <span className="text-xs text-[#77766E] font-sans">of {localChanges.length} changes</span>
            </p>
          </div>

          {/* Pending Sign-Off */}
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#77766E]">
              <span>Pending Sign-Off</span>
              <span className="text-[#865920] font-semibold">⏳ Needs Action</span>
            </div>
            <p className="font-serif text-lg font-normal text-[#25251F] mt-0.5">
              {pendingChanges.length} <span className="text-xs text-[#77766E] font-sans">assertion{pendingChanges.length === 1 ? '' : 's'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center border-b border-[#E5E1D8] gap-6 text-xs font-medium text-[#77766E] pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('changes')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'changes'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent hover:text-[#25251F]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
          <span>Audit of Changes ({localChanges.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'preview'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent hover:text-[#25251F]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Compiled Content Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
            activeTab === 'policy'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent hover:text-[#25251F]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#64816A]" />
          <span>Policy Checklist</span>
        </button>
      </div>

      {/* 4. Tab 1: Detailed Audit of Changes */}
      {activeTab === 'changes' && (
        <div className="space-y-3.5">
          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Changes', count: localChanges.length },
                { id: 'APPROVED', label: 'Approved in Review', count: approvedChanges.length },
                { id: 'PENDING', label: 'Pending Sign-Off', count: pendingChanges.length },
              ].map((pill) => {
                const isSelected = changesFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setChangesFilter(pill.id as any)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
                        : 'bg-[#FAF9F5] border border-[#E5E1D8] text-[#77766E] hover:text-[#25251F]'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] font-mono px-1 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#E5E1D8] text-[#25251F]'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-[#A09D92]">
              Click change cards to toggle sign-off
            </span>
          </div>

          {/* List of Changes */}
          <div className="space-y-3">
            {filteredChanges.map((change) => {
              return (
                <div
                  key={change.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 shadow-2xs ${
                    change.isApproved
                      ? 'bg-[#EEF4EE]/50 border-[#C8DEC9]'
                      : 'bg-[#FDF4E7]/60 border-[#F2D8B9]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {change.isApproved ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#64816A] shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#B78A4A] shrink-0" />
                        )}
                        <span className="text-xs sm:text-[13px] font-semibold text-[#25251F]">
                          {change.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#77766E] font-mono block pl-5">
                        {change.rule}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {change.isApproved ? (
                      <span className="text-[10px] font-semibold text-[#36533D] bg-[#EEF4EE] px-2.5 py-0.5 rounded-full border border-[#D1E2D3] shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#64816A]" />
                        Approved in Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#865920] bg-[#FDF4E7] px-2.5 py-0.5 rounded-full border border-[#F0D5B5] shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#B78A4A]" />
                        Pending Sign-Off
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#55544E] leading-relaxed pl-5">
                    {change.description}
                  </p>

                  {/* Diff Comparison */}
                  {change.before && change.after && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 pl-5">
                      <div className="p-2.5 rounded-lg bg-[#FFFEFA] border border-[#F4BFB9]/80 space-y-0.5">
                        <span className="text-[9px] uppercase font-mono text-[#8A332B] font-semibold block">
                          Original Text
                        </span>
                        <p className="text-[#8A332B] line-through leading-relaxed">
                          "{change.before}"
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#FFFEFA] border border-[#C8DEC9] space-y-0.5">
                        <span className="text-[9px] uppercase font-mono text-[#36533D] font-semibold block">
                          AI Revised Version
                        </span>
                        <p className="text-[#2A4530] font-medium leading-relaxed">
                          "{change.after}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quick Toggle Action on this Change */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E5E1D8]/60">
                    <button
                      type="button"
                      onClick={() => handleToggleChangeApproval(change.id)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                        change.isApproved
                          ? 'border border-[#E5E1D8] text-[#77766E] hover:text-[#25251F] hover:bg-[#FAF9F5]'
                          : 'bg-[#68745D] hover:bg-[#58644E] text-white shadow-2xs'
                      }`}
                    >
                      {change.isApproved ? (
                        <>
                          <Ban className="w-3 h-3 text-[#A09D92]" />
                          <span>Flag as Pending</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Sign-Off on Change</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Compiled Content Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-[#25251F]">
              Compiled Content After Workspace Edits
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#64816A]" />
                  <span className="text-[#64816A]">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-[#25251F] leading-relaxed font-sans space-y-3">
            <p>
              Introducing our new AI-powered brand governance platform.{' '}
              <span className="bg-[#EEF4EE] text-[#2A4530] px-1 py-0.5 rounded border-b-2 border-[#64816A] font-medium">
                Evolyn™ Brand Governance helps marketing teams prevent compliance risks with verified audit citations
              </span>{' '}
              operations across every enterprise channel. With automated citation checks and evidence scoring, teams review content{' '}
              <span className="bg-[#FDF4E7] text-[#865920] px-1 py-0.5 rounded border-b-2 border-[#E0A868] font-medium">
                in real time with automated citation checks.
              </span>
            </p>
            <p className="text-[#77766E]">
              Grounding every claim against verified brand facts in the Knowledge Library ensures global marketing teams accelerate creative velocity without human compliance friction.
            </p>
          </div>

          {/* Highlight Legend */}
          <div className="flex items-center gap-4 text-[11px] text-[#77766E] pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#EEF4EE] border border-[#64816A]" />
              <span>Approved in Review Workspace</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#FDF4E7] border border-[#B78A4A]" />
              <span>Pending Human Sign-off</span>
            </span>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Policy Checklist */}
      {activeTab === 'policy' && (
        <div className="space-y-3">
          <p className="text-xs text-[#77766E]">
            Brand voice and compliance guidelines matched for channel: <strong className="text-[#25251F]">{item.channel}</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#25251F]">Rule 1.4: Grounded Performance</span>
                <span className="text-[#4E6B54] text-[10px] font-semibold bg-[#EEF4EE] px-2 py-0.5 rounded">Satisfied</span>
              </div>
              <p className="text-[#77766E] text-[11px]">
                Requires replacement of absolute superlative promises with verified audit citations.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#25251F]">Rule 3.2: Nomenclature Standard</span>
                <span className="text-[#4E6B54] text-[10px] font-semibold bg-[#EEF4EE] px-2 py-0.5 rounded">Satisfied</span>
              </div>
              <p className="text-[#77766E] text-[11px]">
                Registered trademark descriptor inserted on primary platform naming.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#25251F]">Rule 2.1: Tone & Claims</span>
                <span className="text-[#865920] text-[10px] font-semibold bg-[#FDF4E7] px-2 py-0.5 rounded">Needs Sign-off</span>
              </div>
              <p className="text-[#77766E] text-[11px]">
                Speed assertions must be validated against production benchmark reports.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Human Sign-Off Decision & Audit Notes */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
            Human Sign-Off & Reviewer Notes
          </label>
          <span className="text-[11px] text-[#A09D92]">
            Notes permanently saved to Decision History
          </span>
        </div>

        {/* Preset Quick Notes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#A09D92] font-medium mr-0.5">Quick Presets:</span>
          {[
            'All claims verified against SOC 2 audit report',
            'Approved with trademark revisions',
            'Pending empirical analytics benchmark',
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPresetComment(preset)}
              className="text-[10px] bg-[#FFFEFA] border border-[#E5E1D8] hover:border-[#68745D] text-[#55544E] hover:text-[#25251F] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              + {preset}
            </button>
          ))}
        </div>

        <textarea
          rows={2}
          value={reviewerComment}
          onChange={(e) => setReviewerComment(e.target.value)}
          placeholder="Add optional notes for the submitter and audit log before finalizing decision..."
          className="w-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 text-xs text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:ring-1 focus:ring-[#68745D] transition-all resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-[#A09D92]">
            {approvedChanges.length} of {localChanges.length} changes approved.
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDecision('Rejected')}
              className="text-xs cursor-pointer"
            >
              Reject
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecision('Changes Requested')}
              className="text-xs border-[#B78A4A]/50 text-[#865920] hover:bg-[#FDF4E7] cursor-pointer"
            >
              Request Changes
            </Button>

            <Button
              variant="olive"
              size="sm"
              onClick={() => handleDecision('Approved')}
              className="text-xs gap-1 shadow-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Sign-Off</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
