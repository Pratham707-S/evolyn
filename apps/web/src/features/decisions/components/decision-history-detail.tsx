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
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  BookMarked,
  Activity,
  Circle,
} from 'lucide-react';
import { TimelineDecision } from './decision-history-timeline';

export interface DecisionHistoryDetailProps {
  item: TimelineDecision;
  showToast: (msg: string) => void;
}

export function DecisionHistoryDetail({
  item,
  showToast,
}: DecisionHistoryDetailProps) {
  const [activeTab, setActiveTab] = useState<'decision' | 'findings' | 'guidelines' | 'activity'>('decision');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied content to clipboard');
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

  const renderBadge = (decision: TimelineDecision['decision']) => {
    switch (decision) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA]">
            Changes Requested
          </span>
        );
      case 'Rejected':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDEAEA] text-[#B56E63] border border-[#F7C6C6]">
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-1">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
            <FileText className="w-4 h-4" />
          </div>

          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight">
              {item.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#77766E] mt-0.5">
              <span className="flex items-center gap-1 font-medium text-[#25251F]">
                {getChannelIcon(item.channel)}
                {item.channel}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-[#A09D92]">
                {item.submissionId}
              </span>
            </div>
          </div>
        </div>

        <div>{renderBadge(item.decision)}</div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-5 border-b border-[#E5E1D8] text-xs font-medium text-[#77766E]">
        <button
          type="button"
          onClick={() => setActiveTab('decision')}
          className={`pb-2.5 transition-colors relative ${
            activeTab === 'decision'
              ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
              : 'hover:text-[#25251F]'
          }`}
        >
          Decision
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`pb-2.5 flex items-center gap-1 transition-colors relative ${
            activeTab === 'findings'
              ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
              : 'hover:text-[#25251F]'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-[#B78A4A]" />
          <span>Findings ({item.findingsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guidelines')}
          className={`pb-2.5 flex items-center gap-1 transition-colors relative ${
            activeTab === 'guidelines'
              ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
              : 'hover:text-[#25251F]'
          }`}
        >
          <BookMarked className="w-3 h-3" />
          <span>Guidelines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`pb-2.5 flex items-center gap-1 transition-colors relative ${
            activeTab === 'activity'
              ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
              : 'hover:text-[#25251F]'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>Activity</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'decision' && (
        <div className="space-y-6">
          {/* Top Row: Submitted Content (Left) & Decision Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Submitted Content Box (7 cols) */}
            <div className="lg:col-span-7 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
                  Submitted Content
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
                  title="Copy text"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#64816A]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-4 text-xs sm:text-sm text-[#25251F] leading-relaxed min-h-[110px]">
                {item.content}
              </div>
            </div>

            {/* Decision Summary Card (5 cols) matching reference */}
            <div className="lg:col-span-5">
              <div
                className={`border rounded-xl p-4 h-full flex flex-col justify-between space-y-2 ${
                  item.decision === 'Approved'
                    ? 'bg-[#EEF4EE]/40 border-[#D4DBC9]'
                    : item.decision === 'Changes Requested'
                    ? 'bg-[#FEF7EC]/50 border-[#F4E3C7]'
                    : 'bg-[#FDEAEA]/40 border-[#F7C6C6]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#25251F]">
                    {item.decision === 'Approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#4E6B54]" />
                    ) : item.decision === 'Changes Requested' ? (
                      <AlertTriangle className="w-4 h-4 text-[#B78A4A]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#B56E63]" />
                    )}
                    <span>Decision Summary</span>
                  </div>

                  <p className="font-serif text-2xl font-normal text-[#25251F]">
                    {item.decision}
                  </p>
                </div>

                <p className="text-xs text-[#77766E]">
                  Decided by <strong className="text-[#25251F]">{item.reviewerName}</strong> • {item.timeAgo}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Decision Timeline Steps (Audit Trace) */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F] block">
              Decision Timeline
            </span>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#E5E1D8]">
              {item.timelineSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step Node Dot */}
                  <div className="absolute -left-[20px] top-1">
                    {step.completed ? (
                      <div className="w-4 h-4 rounded-full bg-[#64816A] text-white flex items-center justify-center ring-4 ring-[#FFFEFA]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-[#A09D92] bg-[#FFFEFA] ring-4 ring-[#FFFEFA]" />
                    )}
                  </div>

                  {/* Step Details */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-[#25251F]">
                        {step.title}
                      </p>
                      <p className="text-xs text-[#77766E] mt-0.5">
                        {step.description}
                      </p>
                    </div>

                    <span className="text-xs text-[#A09D92] font-normal whitespace-nowrap shrink-0">
                      {step.timeAgo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="space-y-3 text-xs">
          <p className="text-[#77766E]">
            Verified AI findings associated with review run:
          </p>
          <div className="p-3.5 bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl space-y-1">
            <p className="font-semibold text-[#25251F]">{item.decisionNote}</p>
            <p className="text-[#77766E]">Grounded check completed with zero unresolved critical flags.</p>
          </div>
        </div>
      )}

      {activeTab === 'guidelines' && (
        <div className="space-y-3 text-xs">
          <p className="text-[#77766E]">
            Guidelines enforced during this decision:
          </p>
          <div className="p-3.5 bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl space-y-1">
            <p className="font-semibold text-[#25251F]">Brand Tone & Factual Precision Guide v2.4</p>
            <p className="text-[#77766E]">Approved by Brand Guardians Committee.</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-[#F7F5F0] rounded-lg flex items-center justify-between">
            <span>Decision signed off by {item.reviewerName}</span>
            <span className="text-[#A09D92]">{item.timeAgo}</span>
          </div>
        </div>
      )}
    </div>
  );
}

