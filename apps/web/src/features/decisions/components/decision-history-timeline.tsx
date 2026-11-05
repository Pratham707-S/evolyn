'use client';

import React from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  User,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Decision } from '@evolyn/shared';
import { DecisionBadge } from './decision-badge';

interface DecisionHistoryTimelineProps {
  decisions: Decision[];
  isLoading: boolean;
  submissionTitle?: string;
}

export function DecisionHistoryTimeline({
  decisions,
  isLoading,
  submissionTitle,
}: DecisionHistoryTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
        <Sparkles className="w-6 h-6 animate-spin text-[#68745D]" />
        <p className="text-xs font-medium text-[#25251F]">Loading Decision History & Audit Trail...</p>
        <p className="text-[11px] text-[#A09D92]">Retrieving immutable decision records from database.</p>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-2">
        <History className="w-8 h-8 text-[#A09D92]" />
        <h3 className="font-serif text-lg text-[#25251F]">No Decisions Recorded</h3>
        <p className="text-xs text-[#77766E] max-w-sm">
          {submissionTitle
            ? `"${submissionTitle}" has no human sign-off records in the audit trail yet.`
            : 'Select a submission to inspect its chronological governance decision history.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-[#68745D]" />
          <div>
            <h2 className="font-serif text-lg text-[#25251F] tracking-tight">
              Immutable Governance Audit Trail
            </h2>
            {submissionTitle && (
              <p className="text-xs text-[#77766E]">
                Submission: <span className="font-medium text-[#25251F]">{submissionTitle}</span>
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-mono bg-[#EBF0F5] text-[#4A6478] px-2.5 py-0.5 rounded-full font-semibold">
          {decisions.length} Entry{decisions.length > 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* Chronological Timeline */}
      <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E1D8]">
        {decisions.map((dec, idx) => {
          const isApproved = dec.decision === 'APPROVED';
          const isRejected = dec.decision === 'REJECTED';
          const isChanges = dec.decision === 'CHANGES_REQUESTED';

          const iconNode = isApproved ? (
            <div className="w-5 h-5 rounded-full bg-[#E8EBE1] border-2 border-[#64816A] text-[#4E6B54] flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          ) : isRejected ? (
            <div className="w-5 h-5 rounded-full bg-[#F7EBEA] border-2 border-[#B56E63] text-[#9A4C42] flex items-center justify-center">
              <XCircle className="w-3 h-3" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#F5EFE6] border-2 border-[#B78A4A] text-[#8A6B3D] flex items-center justify-center">
              <RotateCcw className="w-3 h-3" />
            </div>
          );

          return (
            <div key={dec.id || idx} className="relative space-y-2">
              {/* Timeline marker */}
              <div className="absolute -left-6 top-1 -translate-x-1/2 flex items-center justify-center bg-[#FFFEFA]">
                {iconNode}
              </div>

              {/* Card */}
              <div className="bg-[#F7F5F0]/60 border border-[#E5E1D8] rounded-xl p-4 space-y-2.5 hover:border-[#68745D]/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DecisionBadge decision={dec.decision} />
                    <span className="text-xs font-semibold text-[#25251F] flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#A09D92]" />
                      {dec.reviewerName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#A09D92]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(dec.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Comments / Rationale */}
                <div className="text-xs text-[#25251F] bg-[#FFFEFA] border border-[#E5E1D8]/80 rounded-lg p-3 leading-relaxed">
                  <p className="font-sans whitespace-pre-wrap">{dec.comments}</p>
                </div>

                {/* Overridden Issues badge */}
                {dec.overriddenIssueIds && dec.overriddenIssueIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8A6B3D] bg-[#F5EFE6]/60 px-2.5 py-1 rounded-md border border-[#E8DEC9]">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {dec.overriddenIssueIds.length} Issue Exception(s) Authorized
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
