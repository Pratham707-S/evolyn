'use client';

import React, { useState } from 'react';
import {
  FileText,
  Layers,
  FlaskConical,
  ShieldCheck,
  Check,
  MoreHorizontal,
  Box,
  Calendar,
  User,
  Tag,
  Sparkles,
  ExternalLink,
  Copy,
  Clock,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import {
  KnowledgeItem,
  KnowledgeTypeLabel,
} from '../data/knowledge-data';
import { cn } from '@/lib/utils/cn';

interface KnowledgeInspectorProps {
  item: KnowledgeItem | null;
  onBackToList?: () => void;
  showToast: (msg: string) => void;
}

type InspectorTab = 'overview' | 'content' | 'usage' | 'history';

export function KnowledgeInspector({
  item,
  onBackToList,
  showToast,
}: KnowledgeInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('overview');
  const [copiedProof, setCopiedProof] = useState(false);

  if (!item) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-12 h-12 rounded-xl bg-[#F4F1EA] text-[#77766E] flex items-center justify-center mb-3">
          <FileText className="w-6 h-6 stroke-[1.5]" />
        </div>
        <p className="font-serif text-lg text-[#25251F]">Select a knowledge resource</p>
        <p className="text-xs text-[#77766E] max-w-xs mt-1">
          Click any resource from the table to inspect approved evidence, key AI review facts, and version history.
        </p>
      </div>
    );
  }

  const getItemIcon = (type: KnowledgeTypeLabel) => {
    switch (type) {
      case 'Product Facts':
        return <Layers className="w-5 h-5 text-[#1D4ED8]" />;
      case 'Evidence & Studies':
        return <FlaskConical className="w-5 h-5 text-[#4338CA]" />;
      case 'Approved Claims':
        return <ShieldCheck className="w-5 h-5 text-[#065F46]" />;
      case 'Terminology':
        return <span className="font-serif font-bold text-base text-[#B45309]">Aa</span>;
      case 'Reference Docs':
      default:
        return <FileText className="w-5 h-5 text-[#BE123C]" />;
    }
  };

  const getTypeBadge = (type: KnowledgeTypeLabel) => {
    switch (type) {
      case 'Product Facts':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            Product Facts
          </span>
        );
      case 'Evidence & Studies':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
            Evidence & Studies
          </span>
        );
      case 'Approved Claims':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            Approved Claims
          </span>
        );
      case 'Terminology':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            Terminology
          </span>
        );
      case 'Reference Docs':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
            Reference Docs
          </span>
        );
    }
  };

  const handleCopyProof = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(item.proofSource);
      setCopiedProof(true);
      showToast('Copied proof source citation to clipboard');
      setTimeout(() => setCopiedProof(false), 2000);
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl flex flex-col h-full min-h-0 shadow-2xs overflow-hidden">
      {/* Mobile back button header if triggered from row selection on small screens */}
      {onBackToList && (
        <div className="lg:hidden p-3 border-b border-[#E5E1D8] bg-[#FDFBF7] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25251F] hover:text-black py-1 px-2 rounded-lg hover:bg-[#EFECE6] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Resources
          </button>
          <span className="text-xs text-[#77766E] font-medium">{item.id}</span>
        </div>
      )}

      {/* Main Inspector Top Card */}
      <div className="p-3.5 sm:p-4 border-b border-[#E5E1D8] bg-white shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Left Type Icon Box */}
            <div className="w-10 h-10 rounded-xl bg-[#F8F6F0] border border-[#E5E1D8] flex items-center justify-center flex-shrink-0 mt-0.5">
              {getItemIcon(item.type)}
            </div>

            <div>
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#25251F] leading-snug tracking-tight">
                {item.title}
              </h2>

              {/* Badges line: Type badge + Status badge */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getTypeBadge(item.type)}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  {item.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Menu */}
          <button
            type="button"
            onClick={() => showToast(`Options for ${item.title}`)}
            className="p-1.5 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 border-b border-[#E5E1D8] mt-4 pt-1 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'pb-2 transition-all relative whitespace-nowrap',
              activeTab === 'overview'
                ? 'text-[#25251F] font-bold border-b-2 border-[#25251F]'
                : 'text-[#77766E] hover:text-[#25251F]'
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={cn(
              'pb-2 transition-all relative whitespace-nowrap',
              activeTab === 'content'
                ? 'text-[#25251F] font-bold border-b-2 border-[#25251F]'
                : 'text-[#77766E] hover:text-[#25251F]'
            )}
          >
            Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={cn(
              'pb-2 transition-all relative whitespace-nowrap',
              activeTab === 'usage'
                ? 'text-[#25251F] font-bold border-b-2 border-[#25251F]'
                : 'text-[#77766E] hover:text-[#25251F]'
            )}
          >
            Usage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'pb-2 transition-all relative whitespace-nowrap',
              activeTab === 'history'
                ? 'text-[#25251F] font-bold border-b-2 border-[#25251F]'
                : 'text-[#77766E] hover:text-[#25251F]'
            )}
          >
            Version History
          </button>
        </div>
      </div>

      {/* Tab Body with Scroll Container */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Summary Section */}
            <div>
              <h3 className="font-serif font-bold text-sm text-[#25251F] mb-1">
                Summary
              </h3>
              <p className="text-xs sm:text-sm text-[#52524E] leading-relaxed">
                {item.summary}
              </p>
            </div>

            {/* Metadata 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#EFECE6]">
              {/* Product */}
              <div className="flex items-start gap-2">
                <Box className="w-4 h-4 text-[#77766E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[#77766E] leading-tight">Product</p>
                  <p className="text-xs font-semibold text-[#25251F] mt-0.5">{item.product}</p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-[#77766E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[#77766E] leading-tight">Last Updated</p>
                  <p className="text-xs font-semibold text-[#25251F] mt-0.5">{item.lastUpdated}</p>
                </div>
              </div>

              {/* Owned By */}
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-[#77766E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[#77766E] leading-tight">Owned By</p>
                  <p className="text-xs font-semibold text-[#25251F] mt-0.5">{item.ownedBy}</p>
                </div>
              </div>

              {/* Version */}
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-[#77766E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-[#77766E] leading-tight">Version</p>
                  <p className="text-xs font-semibold text-[#25251F] mt-0.5">{item.version}</p>
                </div>
              </div>
            </div>

            {/* Key Facts (for AI Review) */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-[#68745D]" />
                <h3 className="font-serif font-bold text-sm text-[#25251F]">
                  Key Facts (for AI Review)
                </h3>
              </div>
              <ul className="space-y-1.5 text-xs text-[#52524E]">
                {item.keyFacts.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25251F] mt-1.5 flex-shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source Proof Citation Box */}
            <div className="p-3 bg-[#FAF8F3] border border-[#E8E4DA] rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-[#77766E] tracking-wider">
                  Verified Proof Source
                </p>
                <p className="font-medium text-[#25251F] truncate mt-0.5">
                  {item.proofSource}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyProof}
                className="p-1.5 rounded-md hover:bg-[#EFECE6] text-[#52524E] hover:text-[#25251F] transition-colors flex-shrink-0"
                title="Copy Citation"
              >
                {copiedProof ? (
                  <Check className="w-4 h-4 text-[#065F46]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#E5E1D8] text-xs leading-relaxed text-[#25251F] whitespace-pre-line font-mono">
              {item.content}
            </div>

            {item.proofSourceUrl && (
              <a
                href={item.proofSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#1D4ED8] hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View original verification source documentation
              </a>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl">
                <p className="text-[11px] text-[#77766E] font-medium">Linked Submissions</p>
                <p className="text-xl font-serif font-bold text-[#25251F] mt-1">
                  {item.usageStats.linkedSubmissions}
                </p>
              </div>
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl">
                <p className="text-[11px] text-[#77766E] font-medium">Active Rules Supported</p>
                <p className="text-xl font-serif font-bold text-[#25251F] mt-1">
                  {item.usageStats.activeRulesCount}
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E5E1D8] rounded-xl space-y-1">
              <p className="text-xs font-semibold text-[#25251F]">Latest Review Pass</p>
              <p className="text-xs text-[#52524E]">{item.usageStats.lastUsedReview}</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {item.versionHistory.map((history, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#25251F]">{history.version}</span>
                  <span className="text-[11px] text-[#77766E]">{history.date}</span>
                </div>
                <p className="text-[#52524E] leading-relaxed">{history.notes}</p>
                <p className="text-[11px] text-[#77766E] font-medium">By {history.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

