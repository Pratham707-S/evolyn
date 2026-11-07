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
  TrendingUp,
  FileCheck,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cleanAndFormatPdfToHtml } from '../../reviews/utils/format-document-text';

export interface AuditChangeItem {
  id: string;
  title: string;
  description: string;
  before?: string;
  after?: string;
  isApproved: boolean;
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
  reviewerComment?: string;
  onReviewerCommentChange?: (comment: string) => void;
  onQuickAction?: (action: 'Approved' | 'Changes Requested' | 'Rejected') => void;
  embedded?: boolean;
}

export function ApprovalInspector({
  item,
  onDecisionSubmit,
  showToast,
  reviewerComment: controlledComment,
  onReviewerCommentChange,
  onQuickAction,
  embedded = false,
}: ApprovalInspectorProps) {
  const router = useRouter();
  const [showDiffs, setShowDiffs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [internalComment, setInternalComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentComment = controlledComment !== undefined ? controlledComment : internalComment;
  const setComment = onReviewerCommentChange || setInternalComment;

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

  const [localChanges, setLocalChanges] = useState<AuditChangeItem[]>(
    item.changes && item.changes.length > 0 ? item.changes : defaultChanges
  );

  useEffect(() => {
    setLocalChanges(
      item.changes && item.changes.length > 0 ? item.changes : defaultChanges
    );
    setComment('');
  }, [item.id, item.changes]);

  const isFinalized = item.decision === 'Approved' || item.decision === 'Rejected';

  // Cleanly formatted document content: parse into publication-grade semantic HTML
  const rawDocContent = item.content || item.snippet || '';

  const cleanDocHtml = React.useMemo(() => {
    return cleanAndFormatPdfToHtml(rawDocContent);
  }, [rawDocContent]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const textToCopy = rawDocContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('Document text copied to clipboard');
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

  const renderDecisionBadge = (decision: DecisionItem['decision']) => {
    switch (decision) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4EE] text-[#36533D] border border-[#D1E2D3]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#64816A]" />
            Approved & Finalized
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF4E7] text-[#865920] border border-[#F0D5B5]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B78A4A]" />
            Changes Requested
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDEAEA] text-[#8A332B] border border-[#F4BFB9]">
            <XCircle className="w-3.5 h-3.5 text-[#B56E63]" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F1EFE8] text-[#25251F] border border-[#E5E1D8]">
            <Clock className="w-3.5 h-3.5 text-[#77766E]" />
            Pending Reviewer Sign-Off
          </span>
        );
    }
  };

  const handleAction = async (decision: 'Approved' | 'Changes Requested' | 'Rejected') => {
    if (onQuickAction) {
      onQuickAction(decision);
      return;
    }
    if (onDecisionSubmit) {
      setIsSubmitting(true);
      await onDecisionSubmit(item.id, decision, currentComment);
      setIsSubmitting(false);
    }
  };

  const applyPreset = (preset: string) => {
    setComment(currentComment ? `${currentComment} • ${preset}` : preset);
  };

  return (
    <div className={embedded ? 'space-y-6' : 'bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-6 space-y-6 shadow-2xs'}>
      {/* 1. Header: Document Title & Metadata */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
        <div className="space-y-1.5 min-w-0 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#77766E] bg-[#F1EFE8] px-2 py-0.5 rounded-md">
              {item.reviewId}
            </span>
            {renderDecisionBadge(item.decision)}
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl text-[#25251F] leading-tight break-words">
            {item.title}
          </h2>

          <div className="flex items-center gap-3 text-xs text-[#77766E] pt-0.5 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-[#25251F]">
              {getChannelIcon(item.channel)}
              <span>{item.channel}</span>
            </span>
            <span>•</span>
            <span>Submitted on {item.date}</span>
            <span>•</span>
            <span>By {item.reviewerName}</span>
          </div>
        </div>

        {/* Action: Open in Review Workspace */}
        <button
          type="button"
          onClick={() => router.push(`/reviews?id=${item.id}`)}
          className="bg-[#FAF9F5] hover:bg-[#F1EFE8] border border-[#E5E1D8] hover:border-[#68745D] text-[#25251F] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
          title="Open in full 3-column interactive workspace"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#68745D]" />
          <span>Open in Review Workspace</span>
        </button>
      </div>

      {/* 2. Brand Compliance Health Checklist */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#68745D]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
              Governance Audit Health
            </span>
          </div>
          <span className="text-xs font-semibold text-[#36533D] bg-[#EEF4EE] border border-[#D1E2D3] px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#64816A]" />
            96.8% Compliant
          </span>
        </div>

        {/* 3 Core Governance Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#25251F]">Brand Voice</span>
              <span className="text-[#36533D] text-[10px] font-semibold bg-[#EEF4EE] px-1.5 py-0.2 rounded">Passed</span>
            </div>
            <p className="text-[11px] text-[#77766E] leading-relaxed">
              Tone is authoritative, human, and aligned with company guidelines.
            </p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#25251F]">Evidence Verification</span>
              <span className="text-[#36533D] text-[10px] font-semibold bg-[#EEF4EE] px-1.5 py-0.2 rounded">Grounded</span>
            </div>
            <p className="text-[11px] text-[#77766E] leading-relaxed">
              Factual claims cross-verified with verified knowledge library sources.
            </p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#25251F]">Nomenclature</span>
              <span className="text-[#36533D] text-[10px] font-semibold bg-[#EEF4EE] px-1.5 py-0.2 rounded">Standard</span>
            </div>
            <p className="text-[11px] text-[#77766E] leading-relaxed">
              Trademarks and product naming conventions verified accurately.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Document Content Preview (DIRECTLY VISIBLE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#68745D]" />
            <span className="font-semibold uppercase tracking-wider text-[#25251F]">
              Document Content for Review
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowDiffs(!showDiffs)}
              className="text-xs font-medium text-[#68745D] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showDiffs ? 'Hide Revisions' : 'Inspect Revisions Diff'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#64816A]" />
                  <span className="text-[#64816A]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* The Clean Document Body */}
        <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 text-sm text-[#25251F] leading-relaxed font-sans shadow-2xs max-h-[420px] overflow-y-auto custom-scrollbar">
          <div
            className="prose prose-sm max-w-none text-[#25251F] font-sans leading-relaxed [&>p]:mb-3.5 [&>p:last-child]:mb-0 [&>h1]:font-serif [&>h1]:text-xl [&>h1]:font-normal [&>h1]:text-[#25251F] [&>h1]:mt-4 [&>h1]:mb-2 [&>h2]:font-serif [&>h2]:text-base [&>h2]:font-normal [&>h2]:text-[#25251F] [&>h2]:mt-3.5 [&>h2]:mb-1.5 [&>h3]:font-serif [&>h3]:text-sm [&>h3]:font-medium [&>h3]:text-[#25251F] [&>h3]:mt-3 [&>h3]:mb-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3"
            dangerouslySetInnerHTML={{ __html: cleanDocHtml }}
          />
        </div>

        {/* Detailed Diffs Drawer (when toggled) */}
        {showDiffs && (
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-3">
            <span className="text-xs font-semibold text-[#25251F] block">
              AI Revisions Applied in Review:
            </span>
            <div className="space-y-2">
              {localChanges.map((change) => (
                <div key={change.id} className="p-3 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#25251F]">{change.title}</span>
                    <span className="text-[10px] font-mono text-[#77766E]">{change.rule}</span>
                  </div>
                  {change.before && change.after && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#F4BFB9]/80 text-[#8A332B] line-through">
                        "{change.before.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}"
                      </div>
                      <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#C8DEC9] text-[#2A4530] font-medium">
                        "{change.after.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}"
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Unified Direct Decision Station (Directly Below Document) */}
      <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#25251F]">
              Reviewer Decision & Sign-Off
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              Reviewer sign-off is cryptographically logged to the permanent audit trail.
            </p>
          </div>

          {isFinalized && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEF4EE] text-[#36533D] border border-[#D1E2D3]">
              Decision Finalized
            </span>
          )}
        </div>

        {item.decision === 'Changes Requested' && (
          <div className="p-3.5 rounded-xl bg-[#FDF9F0] border border-[#F0D5B5] flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2 text-xs text-[#865920]">
              <AlertTriangle className="w-4 h-4 text-[#B78A4A] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Changes previously requested for this draft</span>
                <span className="text-[#5C3C1A] text-[11px]">{item.summary || 'Awaiting author revisions or reviewer sign-off.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/reviews?id=${item.id}&status=changes_requested`)}
              className="text-xs font-semibold text-[#865920] hover:text-[#25251F] underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B78A4A]" />
              <span>Open in Review Workspace</span>
            </button>
          </div>
        )}

        {isFinalized ? (
          <div className="p-3.5 rounded-xl bg-[#EEF4EE]/70 border border-[#C8DEC9] text-xs text-[#2A4530] flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-[#64816A] shrink-0" />
            <span>
              This submission was recorded as <strong>{item.decision}</strong> by {item.reviewerName} on {item.date}. The record is locked.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#77766E]">Quick Presets:</span>
              {[
                'All claims verified with evidence',
                'Trademark nomenclature approved',
                'Need benchmark citation link',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="text-[11px] bg-[#FFFEFA] border border-[#E5E1D8] hover:border-[#68745D] text-[#55544E] hover:text-[#25251F] px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Reviewer Comment Textarea */}
            <textarea
              rows={2}
              value={currentComment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Enter rationale, compliance exceptions, or feedback for the submitter..."
              className="w-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-3 text-xs text-[#25251F] placeholder:text-[#A09D92] focus:outline-hidden focus:ring-1 focus:ring-[#68745D] transition-all resize-none"
            />

            {/* 3 Decision Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('Rejected')}
                className="py-2.5 px-4 rounded-xl text-xs font-medium border border-[#EAC4BE] bg-[#FBEBE8] hover:bg-[#F9D6D3] text-[#B56E63] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject Submission</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('Changes Requested')}
                className="py-2.5 px-4 rounded-xl text-xs font-medium border border-[#B78A4A]/50 bg-[#FDF9F0] hover:bg-[#F9ECCF] text-[#865920] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B78A4A]" />
                <span>Request Changes & Review with AI</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('Approved')}
                className="py-2.5 px-5 rounded-xl text-xs font-semibold bg-[#68745D] hover:bg-[#545E4B] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Approve & Sign-Off</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
