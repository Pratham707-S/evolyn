'use client';

import React from 'react';
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ExternalLink,
  User,
  Calendar,
  Lock,
} from 'lucide-react';
import type { ContentSubmission, DecisionType, DetectedIssue } from '@evolyn/shared';
import type { SubmissionReviewDetails } from '../api/decisions-api';
import { DecisionBadge } from './decision-badge';

interface ApprovalDetailViewProps {
  details: SubmissionReviewDetails | null;
  isLoading: boolean;
  overriddenIssueIds: string[];
  onToggleOverride: (issueId: string) => void;
  onOpenDecisionModal: (decision: DecisionType) => void;
}

export function ApprovalDetailView({
  details,
  isLoading,
  overriddenIssueIds,
  onToggleOverride,
  onOpenDecisionModal,
}: ApprovalDetailViewProps) {
  if (isLoading) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[480px] text-center space-y-3">
        <Sparkles className="w-6 h-6 animate-spin text-[#68745D]" />
        <p className="text-xs font-medium text-[#25251F]">Loading Review Findings & Evidence...</p>
        <p className="text-[11px] text-[#A09D92]">Retrieving automated Gemini review run and guideline citations.</p>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[480px] text-center space-y-2">
        <FileText className="w-8 h-8 text-[#A09D92]" />
        <h3 className="font-serif text-lg text-[#25251F]">Select a Submission</h3>
        <p className="text-xs text-[#77766E] max-w-sm">
          Choose a submission from the approval queue on the left to inspect its content copy, compliance findings, and record a governance sign-off.
        </p>
      </div>
    );
  }

  const { submission, reviewRun, issues, decision: existingDecision } = details;
  const isTerminal =
    submission.status === 'APPROVED' ||
    submission.status === 'REJECTED' ||
    (existingDecision && (existingDecision.decision === 'APPROVED' || existingDecision.decision === 'REJECTED'));

  const issueTypeStyles: Record<string, string> = {
    TERMINOLOGY_VIOLATION: 'bg-[#F7EBEA] text-[#9A4C42] border-[#E8CFCB]',
    UNSUBSTANTIATED_CLAIM: 'bg-[#F5EFE6] text-[#8A6B3D] border-[#E8DEC9]',
    TONE_MISMATCH: 'bg-[#EBF0F5] text-[#4A6478] border-[#D1DCE6]',
    PROHIBITED_PHRASE: 'bg-[#F7EBEA] text-[#9A4C42] border-[#E8CFCB]',
    COMPLIANCE_RISK: 'bg-[#FDF6E2] text-[#8C6D1F] border-[#EEDC9A]',
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl overflow-hidden flex flex-col space-y-6">
      {/* Detail Header */}
      <div className="p-6 pb-4 border-b border-[#E5E1D8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-[#F1EFE8] text-[#77766E] px-2 py-0.5 rounded font-semibold">
                {submission.channel}
              </span>
              <DecisionBadge decision={submission.status} />
            </div>
            <h1 className="font-serif text-2xl text-[#25251F] tracking-tight">
              {submission.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#77766E]">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#A09D92]" />
              <span>{submission.submittedBy}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#A09D92]" />
              <span>{new Date(submission.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Existing Decision Alert if already decided */}
        {existingDecision && (
          <div
            className={`rounded-xl p-4 border text-xs flex items-start gap-3 ${
              existingDecision.decision === 'APPROVED'
                ? 'bg-[#E8EBE1]/50 border-[#D4DBC9] text-[#4E6B54]'
                : existingDecision.decision === 'REJECTED'
                ? 'bg-[#F7EBEA]/50 border-[#E8CFCB] text-[#9A4C42]'
                : 'bg-[#F5EFE6]/50 border-[#E8DEC9] text-[#8A6B3D]'
            }`}
          >
            {existingDecision.decision === 'APPROVED' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : existingDecision.decision === 'REJECTED' ? (
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <RotateCcw className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  {existingDecision.decision === 'APPROVED'
                    ? 'Submission Approved'
                    : existingDecision.decision === 'REJECTED'
                    ? 'Submission Rejected'
                    : 'Changes Requested'}
                </span>
                <span className="text-[11px] opacity-80">
                  {new Date(existingDecision.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#25251F] leading-relaxed">
                <span className="font-medium text-[#77766E]">Reviewer ({existingDecision.reviewerName}): </span>
                {existingDecision.comments}
              </p>
              {existingDecision.overriddenIssueIds && existingDecision.overriddenIssueIds.length > 0 && (
                <p className="text-[11px] opacity-80 pt-0.5">
                  Authorized {existingDecision.overriddenIssueIds.length} guideline exception(s).
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 space-y-6">
        {/* Submission Raw Content */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-[#77766E] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Submitted Copy Content
          </h3>
          <div className="bg-[#F7F5F0]/70 border border-[#E5E1D8] rounded-xl p-4 text-xs sm:text-sm text-[#25251F] font-sans leading-relaxed whitespace-pre-wrap select-text">
            {submission.rawText}
          </div>
        </div>

        {/* Automated Review Score Card */}
        {reviewRun && (
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#68745D]" />
                <h3 className="text-xs font-semibold text-[#25251F] uppercase tracking-wider">
                  Automated Compliance Analysis
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#A09D92]">
                Model: {reviewRun.modelUsed}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-[#F7F5F0] rounded-lg p-2.5 text-center">
                <span className="text-lg font-serif font-bold text-[#25251F]">
                  {reviewRun.overallComplianceScore}%
                </span>
                <p className="text-[10px] text-[#77766E] uppercase tracking-tight mt-0.5">
                  Compliance Score
                </p>
              </div>

              <div className="bg-[#F7F5F0] rounded-lg p-2.5 text-center">
                <span className="text-lg font-serif font-bold text-[#25251F]">
                  {reviewRun.totalIssuesCount}
                </span>
                <p className="text-[10px] text-[#77766E] uppercase tracking-tight mt-0.5">
                  Detected Issues
                </p>
              </div>

              <div className="bg-[#E8EBE1]/50 rounded-lg p-2.5 text-center">
                <span className="text-lg font-serif font-bold text-[#4E6B54]">
                  {reviewRun.summary?.passedChecksCount ?? 0}
                </span>
                <p className="text-[10px] text-[#4E6B54] uppercase tracking-tight mt-0.5">
                  Passed Checks
                </p>
              </div>

              <div className="bg-[#F7EBEA]/50 rounded-lg p-2.5 text-center">
                <span className="text-lg font-serif font-bold text-[#9A4C42]">
                  {reviewRun.summary?.failedChecksCount ?? 0}
                </span>
                <p className="text-[10px] text-[#9A4C42] uppercase tracking-tight mt-0.5">
                  Failed Checks
                </p>
              </div>
            </div>

            {reviewRun.summary?.notes && (
              <p className="text-xs text-[#77766E] pt-1 leading-relaxed">
                <span className="font-medium text-[#25251F]">AI Summary: </span>
                {reviewRun.summary.notes}
              </p>
            )}
          </div>
        )}

        {/* Detected Issues & Override Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B56E63]" />
              <h3 className="text-xs font-semibold text-[#25251F] uppercase tracking-wider">
                Detected Issues & Override Checklist ({issues.length})
              </h3>
            </div>
            {issues.length > 0 && !isTerminal && (
              <span className="text-xs text-[#77766E]">
                {overriddenIssueIds.length} marked for exception
              </span>
            )}
          </div>

          {issues.length === 0 ? (
            <div className="bg-[#E8EBE1]/40 border border-[#D4DBC9] rounded-xl p-4 text-center text-xs text-[#4E6B54] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero compliance issues detected. Clean submission ready for human approval.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue, idx) => {
                const issueId = issue.id || `issue-${idx}`;
                const isOverridden = overriddenIssueIds.includes(issueId);
                const isAlreadyOverridden = issue.status === 'OVERRIDDEN';

                return (
                  <div
                    key={issueId}
                    className={`rounded-xl border p-4 transition-all space-y-3 ${
                      isOverridden || isAlreadyOverridden
                        ? 'border-[#B78A4A] bg-[#F5EFE6]/30'
                        : 'border-[#E5E1D8] bg-[#FFFEFA]'
                    }`}
                  >
                    {/* Issue Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                            issueTypeStyles[issue.issueType] || 'bg-[#F1EFE8] text-[#77766E] border-[#E5E1D8]'
                          }`}
                        >
                          {issue.issueType.replace(/_/g, ' ')}
                        </span>
                        {typeof issue.confidenceScore === 'number' && (
                          <span className="text-[10px] font-mono text-[#77766E] bg-[#F1EFE8] px-1.5 py-0.5 rounded">
                            {Math.round(issue.confidenceScore * 100)}% Confidence
                          </span>
                        )}
                        {(isOverridden || isAlreadyOverridden) && (
                          <span className="text-[10px] font-mono uppercase bg-[#F5EFE6] text-[#8A6B3D] border border-[#E8DEC9] px-2 py-0.5 rounded font-bold">
                            Override Exception
                          </span>
                        )}
                      </div>

                      {/* Override Toggle Checkbox (Disabled if terminal) */}
                      {!isTerminal && (
                        <label className="flex items-center gap-2 text-xs text-[#77766E] hover:text-[#25251F] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isOverridden}
                            onChange={() => onToggleOverride(issueId)}
                            className="rounded border-[#E5E1D8] text-[#68745D] focus:ring-[#68745D]"
                          />
                          <span className="text-[11px] font-medium">Override</span>
                        </label>
                      )}
                    </div>

                    {/* Flagged Excerpt */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#A09D92] uppercase tracking-wider font-mono">
                        Flagged Content Excerpt:
                      </span>
                      <blockquote className="text-xs text-[#9A4C42] bg-[#F7EBEA]/40 border-l-2 border-[#9A4C42] pl-2.5 py-1 font-mono italic">
                        &quot;{issue.flaggedExcerpt}&quot;
                      </blockquote>
                    </div>

                    {/* Evidence & Canonical Rule Source */}
                    <div className="space-y-1">
                      <span className="text-[11px] text-[#A09D92] uppercase tracking-wider font-mono">
                        Grounding Evidence & Policy Citation:
                      </span>
                      <blockquote className="text-xs text-[#4E6B54] bg-[#E8EBE1]/40 border-l-2 border-[#64816A] pl-2.5 py-1 leading-relaxed">
                        &quot;{issue.sourceQuote}&quot;
                      </blockquote>
                    </div>

                    {/* Explanation & Recommendation */}
                    <div className="text-xs space-y-1 text-[#25251F] pt-1">
                      <p>
                        <span className="font-medium text-[#77766E]">Explanation: </span>
                        {issue.explanation}
                      </p>
                      {issue.suggestedFix && (
                        <p>
                          <span className="font-medium text-[#77766E]">Suggested Correction: </span>
                          {issue.suggestedFix}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Decision Action Bar */}
      <div className="p-6 pt-4 border-t border-[#E5E1D8] bg-[#F7F5F0]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        {isTerminal ? (
          <div className="flex items-center gap-2 text-xs text-[#77766E] w-full justify-between">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#A09D92]" />
              <span className="font-medium text-[#25251F]">Terminal Governance State:</span>
              <span>This submission has already reached final sign-off ({submission.status}).</span>
            </div>
            <DecisionBadge decision={submission.status} />
          </div>
        ) : (
          <>
            <div className="text-xs text-[#77766E]">
              {overriddenIssueIds.length > 0 ? (
                <span className="text-[#8A6B3D] font-medium">
                  {overriddenIssueIds.length} issue(s) will be overridden on sign-off.
                </span>
              ) : (
                <span>Select a governance action to record an authentic human decision.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => onOpenDecisionModal('CHANGES_REQUESTED')}
                className="px-3.5 py-2 text-xs font-medium text-[#8A6B3D] bg-[#FFFEFA] border border-[#E8DEC9] hover:bg-[#F5EFE6] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Changes</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDecisionModal('REJECTED')}
                className="px-3.5 py-2 text-xs font-medium text-[#9A4C42] bg-[#FFFEFA] border border-[#E8CFCB] hover:bg-[#F7EBEA] rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDecisionModal('APPROVED')}
                className="px-4 py-2 text-xs font-medium text-white bg-[#515B48] hover:bg-[#434B3C] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Submission</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
