'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  X,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { DecisionType } from '@evolyn/shared';
import { submitHumanDecision, type SubmitDecisionResult } from '../api/decisions-api';
import { ApiClientError } from '../../../lib/api/client';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  submissionTitle: string;
  initialDecision?: DecisionType;
  overriddenIssueIds: string[];
  onDecisionSuccess: (result: SubmitDecisionResult) => void;
}

export function DecisionModal({
  isOpen,
  onClose,
  submissionId,
  submissionTitle,
  initialDecision = 'APPROVED',
  overriddenIssueIds,
  onDecisionSuccess,
}: DecisionModalProps) {
  const [decision, setDecision] = useState<DecisionType>(initialDecision);
  const [reviewerName, setReviewerName] = useState('Brand Lead');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    const trimmedReviewer = reviewerName.trim();
    if (!trimmedReviewer) {
      setValidationError('Reviewer name is required for authentic governance sign-off.');
      return;
    }

    const trimmedComments = comments.trim();
    if (!trimmedComments) {
      setValidationError('Please provide a decision rationale or feedback comment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitHumanDecision(submissionId, {
        decision,
        reviewerName: trimmedReviewer,
        comments: trimmedComments,
        overriddenIssueIds,
      });

      onDecisionSuccess(result);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        const serverError =
          (err.data as { error?: string })?.error ||
          err.message ||
          'Failed to record decision.';
        setApiError(serverError);
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected network or server error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const decisionOptions: {
    type: DecisionType;
    label: string;
    description: string;
    icon: React.ElementType;
    activeBorder: string;
    activeBg: string;
    iconColor: string;
  }[] = [
    {
      type: 'APPROVED',
      label: 'Approve Submission',
      description: 'Content conforms to brand guidelines or approved exceptions.',
      icon: CheckCircle2,
      activeBorder: 'border-[#64816A] ring-1 ring-[#64816A]',
      activeBg: 'bg-[#E8EBE1]/40',
      iconColor: 'text-[#4E6B54]',
    },
    {
      type: 'CHANGES_REQUESTED',
      label: 'Request Changes',
      description: 'Author must revise content to resolve guideline violations.',
      icon: RotateCcw,
      activeBorder: 'border-[#B78A4A] ring-1 ring-[#B78A4A]',
      activeBg: 'bg-[#F5EFE6]/50',
      iconColor: 'text-[#8A6B3D]',
    },
    {
      type: 'REJECTED',
      label: 'Reject Submission',
      description: 'Content fundamentally breaches brand policy and cannot be used.',
      icon: XCircle,
      activeBorder: 'border-[#B56E63] ring-1 ring-[#B56E63]',
      activeBg: 'bg-[#F7EBEA]/50',
      iconColor: 'text-[#9A4C42]',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
    >
      <div className="w-full max-w-xl bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8EBE1] flex items-center justify-center text-[#4E6B54]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="decision-modal-title"
                className="font-serif text-xl text-[#25251F] leading-tight"
              >
                Human Governance Sign-Off
              </h2>
              <p className="text-xs text-[#77766E] truncate max-w-md">
                Submission: <span className="font-medium text-[#25251F]">{submissionTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Decision Type Radio Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider">
              Decision Action <span className="text-[#B56E63]">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {decisionOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = decision === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setDecision(opt.type)}
                    disabled={isSubmitting}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? `${opt.activeBorder} ${opt.activeBg}`
                        : 'border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${opt.iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#25251F]">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-mono uppercase text-[#68745D] font-bold">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#77766E] mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overridden Issues Notice if applicable */}
          {overriddenIssueIds.length > 0 && (
            <div className="bg-[#F5EFE6]/60 border border-[#E8DEC9] rounded-xl p-3 flex items-start gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#8A6B3D] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#8A6B3D]">
                  {overriddenIssueIds.length} Issue Override{overriddenIssueIds.length > 1 ? 's' : ''} Included:
                </span>
                <p className="text-[11px] text-[#77766E] mt-0.5 leading-relaxed">
                  The selected issues will be marked as <code className="text-[#8A6B3D]">OVERRIDDEN</code> exemptions in the permanent audit trail.
                </p>
              </div>
            </div>
          )}

          {/* Reviewer Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="reviewer-name-input"
              className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider"
            >
              Reviewer Name / Identity <span className="text-[#B56E63]">*</span>
            </label>
            <input
              id="reviewer-name-input"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Sarah Jenkins (Brand Lead)"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:ring-1 focus:ring-[#68745D] focus:border-[#68745D] transition-colors"
              required
            />
          </div>

          {/* Comments / Rationale */}
          <div className="space-y-1.5">
            <label
              htmlFor="decision-comments-input"
              className="block text-xs font-semibold text-[#25251F] uppercase tracking-wider"
            >
              Sign-Off Rationale / Notes <span className="text-[#B56E63]">*</span>
            </label>
            <textarea
              id="decision-comments-input"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              placeholder={
                decision === 'APPROVED'
                  ? 'Explain why this content is approved (e.g., tone aligns with brand voice, proof source confirmed)...'
                  : decision === 'CHANGES_REQUESTED'
                  ? 'Detail the required changes the author must address before resubmitting...'
                  : 'Document the compliance policy violation justifying rejection...'
              }
              className="w-full text-xs p-3 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:ring-1 focus:ring-[#68745D] focus:border-[#68745D] transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          {/* Validation or API Error Alerts */}
          {validationError && (
            <div className="bg-[#F7EBEA] border border-[#E8CFCB] text-[#9A4C42] text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {apiError && (
            <div className="bg-[#F7EBEA] border border-[#E8CFCB] text-[#9A4C42] text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5E1D8] flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reviewerName.trim() || !comments.trim()}
              className={`px-4 py-2 text-xs font-medium text-white rounded-lg transition-all flex items-center gap-2 ${
                decision === 'APPROVED'
                  ? 'bg-[#515B48] hover:bg-[#434B3C]'
                  : decision === 'CHANGES_REQUESTED'
                  ? 'bg-[#8A6B3D] hover:bg-[#745932]'
                  : 'bg-[#9A4C42] hover:bg-[#833F36]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Decision...</span>
                </>
              ) : (
                <span>Confirm {decision === 'APPROVED' ? 'Approval' : decision === 'CHANGES_REQUESTED' ? 'Request Changes' : 'Rejection'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
