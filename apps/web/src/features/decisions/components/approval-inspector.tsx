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
  Sparkles,
  BookMarked,
  Clock,
} from 'lucide-react';

export interface DecisionItem {
  id: string;
  title: string;
  snippet: string;
  content: string;
  channel: 'LinkedIn' | 'Website' | 'Email' | 'Blog' | 'Instagram' | string;
  decision: 'Approved' | 'Changes Requested' | 'Rejected';
  reviewer: string;
  reviewerName: string;
  date: string;
  reviewId: string;
  summary: string;
  findingsCount: number;
}

export interface ApprovalInspectorProps {
  item: DecisionItem;
  showToast: (msg: string) => void;
}

export function ApprovalInspector({ item, showToast }: ApprovalInspectorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'guidelines' | 'activity'>('overview');
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

  const renderDecisionBadge = (decision: DecisionItem['decision']) => {
    switch (decision) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            <CheckCircle2 className="w-3 h-3 text-[#4E6B54]" />
            Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA]">
            <AlertTriangle className="w-3 h-3 text-[#B56E63]" />
            Changes Requested
          </span>
        );
      case 'Rejected':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDEAEA] text-[#B56E63] border border-[#F7C6C6]">
            <XCircle className="w-3 h-3 text-[#B56E63]" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-2">
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
                {item.reviewId}
              </span>
            </div>
          </div>
        </div>

        <div>{renderDecisionBadge(item.decision)}</div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-5 border-b border-[#E5E1D8] text-xs font-medium text-[#77766E]">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#25251F] font-semibold border-b-2 border-[#25251F] -mb-[1px]'
              : 'hover:text-[#25251F]'
          }`}
        >
          Overview
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
          <Clock className="w-3 h-3" />
          <span>Activity</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Submitted Content */}
          <div className="space-y-1.5">
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

            <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-4 text-xs sm:text-sm text-[#25251F] leading-relaxed">
              {item.content}
            </div>
          </div>

          {/* Bottom Split: Decision Box & Review Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Left Card: Decision */}
            <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl p-4 space-y-2">
              <span className="text-xs font-medium text-[#77766E] block">
                Decision
              </span>
              <div>{renderDecisionBadge(item.decision)}</div>
              <p className="text-[11px] text-[#77766E] pt-1">
                Decided {item.date} by{' '}
                <strong className="text-[#25251F]">{item.reviewerName}</strong>
              </p>
            </div>

            {/* Right Card: Review Summary */}
            <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#25251F]">
                <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                <span>Review Summary</span>
              </div>
              <p className="text-xs text-[#77766E] leading-relaxed">
                {item.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="space-y-3">
          <p className="text-xs text-[#77766E]">
            Automated findings generated during AI review run:
          </p>
          <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-3 text-xs space-y-1">
            <span className="font-semibold text-[#25251F]">Claim Verification</span>
            <p className="text-[#77766E]">All metrics verified against corporate truth repository.</p>
          </div>
        </div>
      )}

      {activeTab === 'guidelines' && (
        <div className="space-y-3">
          <p className="text-xs text-[#77766E]">
            Active standards matched for {item.channel}:
          </p>
          <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-3 text-xs space-y-1">
            <span className="font-semibold text-[#25251F]">Tone & Terminology Standard</span>
            <p className="text-[#77766E]">Complies with understated enterprise guidelines.</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-[#F7F5F0] rounded-lg flex items-center justify-between">
            <span>Human sign-off completed by {item.reviewerName}</span>
            <span className="text-[#A09D92]">{item.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

