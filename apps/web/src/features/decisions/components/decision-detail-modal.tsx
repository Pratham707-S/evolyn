'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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
  ExternalLink,
} from 'lucide-react';
import gsap from 'gsap';
import { TimelineDecision } from './decision-history-timeline';
import { Button } from '../../../components/ui/button';

export interface DecisionDetailModalProps {
  item: TimelineDecision | null;
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export function DecisionDetailModal({
  item,
  isOpen,
  onClose,
  showToast,
}: DecisionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'decision' | 'findings' | 'guidelines' | 'activity'>('decision');
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // GSAP Entrance Animation from bottom
  useEffect(() => {
    if (!isOpen || !item) return;

    setIsClosing(false);

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    if (backdropRef.current && cardRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo(
        cardRef.current,
        { y: 70, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'power3.out' }
      );
    }
  }, [isOpen, item]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleAnimatedClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAnimatedClose = () => {
    if (isClosing) return;
    setIsClosing(true);

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onClose();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        onClose();
        setIsClosing(false);
      },
    });

    if (cardRef.current) {
      tl.to(
        cardRef.current,
        { y: 50, opacity: 0, scale: 0.96, duration: 0.22, ease: 'power2.in' },
        0
      );
    }

    if (backdropRef.current) {
      tl.to(
        backdropRef.current,
        { opacity: 0, duration: 0.22, ease: 'power2.in' },
        0
      );
    }
  };

  if (!isOpen || !item) return null;

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDF2EC] text-[#B78A4A] border border-[#F2D7CA]">
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
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) {
          handleAnimatedClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-[#25251F]/45 backdrop-blur-md transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Decision Detail Pop-up"
    >
      <div
        ref={cardRef}
        className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E5E1D8] flex items-start justify-between gap-4 shrink-0 bg-[#FFFEFA]">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight truncate">
                  {item.title}
                </h3>
                {renderBadge(item.decision)}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#77766E] mt-1 flex-wrap">
                <span className="flex items-center gap-1 font-medium text-[#25251F]">
                  {getChannelIcon(item.channel)}
                  {item.channel}
                </span>
                <span>•</span>
                <span>{item.submissionId}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#A09D92]" />
                  {item.timeAgo}
                </span>
                <span>•</span>
                <span>Reviewer: {item.reviewerName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAnimatedClose}
            className="w-8 h-8 rounded-lg border border-[#E5E1D8] flex items-center justify-center text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#E5E1D8] px-5 sm:px-6 gap-6 shrink-0 bg-[#FAF9F5]">
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'decision'
                ? 'border-[#25251F] text-[#25251F]'
                : 'border-transparent text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            Decision Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'findings'
                ? 'border-[#25251F] text-[#25251F]'
                : 'border-transparent text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            <span>Findings</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                item.findingsCount > 0
                  ? 'bg-[#B56E63]/15 text-[#B56E63]'
                  : 'bg-[#64816A]/15 text-[#64816A]'
              }`}
            >
              {item.findingsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guidelines')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'guidelines'
                ? 'border-[#25251F] text-[#25251F]'
                : 'border-transparent text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            Guidelines
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-[#25251F] text-[#25251F]'
                : 'border-transparent text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            Audit Trace
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'decision' && (
            <div className="space-y-5">
              {/* Submitted Content Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#25251F] uppercase tracking-wider">
                    Submitted Content
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-[#77766E] hover:text-[#25251F] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-[#64816A]" />
                        <span className="text-[#64816A]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy text</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4 text-xs sm:text-sm text-[#25251F] leading-relaxed font-sans select-text">
                  {item.content}
                </div>
              </div>

              {/* Two Column Section: Decision Summary & Timeline Trace */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Decision Summary Card */}
                <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#25251F]">
                    {item.decision === 'Approved' && (
                      <CheckCircle2 className="w-4 h-4 text-[#64816A]" />
                    )}
                    {item.decision === 'Changes Requested' && (
                      <AlertTriangle className="w-4 h-4 text-[#B78A4A]" />
                    )}
                    {item.decision === 'Rejected' && (
                      <XCircle className="w-4 h-4 text-[#B56E63]" />
                    )}
                    <span>Decision Summary</span>
                  </div>

                  <p className="font-serif text-lg text-[#25251F]">
                    {item.decision}
                  </p>

                  <p className="text-xs text-[#77766E] leading-relaxed">
                    {item.decisionNote}
                  </p>

                  <div className="pt-2 border-t border-[#E5E1D8] text-[11px] text-[#A09D92]">
                    Decided {item.timeAgo} by <strong className="text-[#25251F]">{item.reviewerName}</strong>
                  </div>
                </div>

                {/* Audit Steps Trace Card */}
                <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-medium text-[#25251F] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#68745D]" />
                    <span>Audit Steps Trace</span>
                  </h4>

                  <div className="space-y-3 relative pl-3 border-l-2 border-[#E5E1D8] text-xs">
                    {item.timelineSteps.map((step, idx) => (
                      <div key={idx} className="relative group">
                        <div
                          className={`absolute -left-[19px] top-0.5 w-3 h-3 rounded-full border-2 bg-white ${
                            step.completed
                              ? 'border-[#64816A] bg-[#64816A]'
                              : 'border-[#A09D92] bg-[#FAF9F5]'
                          }`}
                        />
                        <p className="font-medium text-[#25251F]">
                          {step.title}
                        </p>
                        <p className="text-[11px] text-[#77766E] mt-0.5">
                          {step.description}
                        </p>
                        <span className="text-[10px] text-[#A09D92]">
                          {step.timeAgo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-3">
              {item.findingsCount === 0 ? (
                <div className="p-8 text-center bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#64816A] mx-auto" />
                  <p className="font-serif text-lg text-[#25251F]">
                    No Critical Violations Flagged
                  </p>
                  <p className="text-xs text-[#77766E] max-w-md mx-auto">
                    The submitted content adheres completely to brand tone, terminology, and legal guardrails.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-[#FDF2EC] border border-[#F2D7CA] rounded-xl space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#B56E63]" />
                      <span className="text-xs font-semibold text-[#B56E63]">
                        Flagged Guideline Findings ({item.findingsCount})
                      </span>
                    </div>
                    <p className="text-xs text-[#77766E] pt-1">
                      {item.decisionNote}
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#25251F]">
                        Citation Check & Verification
                      </span>
                      <span className="text-[#A09D92]">Automated</span>
                    </div>
                    <p className="text-xs text-[#77766E]">
                      Content was compared against verified brand facts in the Knowledge Library. Re-audit recommended upon copy update.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-3">
              <div className="p-4 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#68745D]" />
                  <span className="text-xs font-medium text-[#25251F]">
                    Associated Governance Rules
                  </span>
                </div>
                <ul className="text-xs text-[#77766E] space-y-2 pl-4 list-disc">
                  <li>Enterprise Brand Identity — Rule 2.1 (Pillars & Positioning)</li>
                  <li>Factual Grounding Guardrails — Rule 4.3 (Verifiable Claims Only)</li>
                  <li>Tone and Voice Matrix — Rule 1.4 (Professional, Confident, Evidence-Backed)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-4">
                <h4 className="text-xs font-medium text-[#25251F] mb-3">
                  Complete Lifecycle Event Log
                </h4>
                <div className="space-y-4 relative pl-4 border-l-2 border-[#E5E1D8] text-xs">
                  {item.timelineSteps.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#68745D]" />
                      <p className="font-medium text-[#25251F]">{step.title}</p>
                      <p className="text-[11px] text-[#77766E] mt-0.5">{step.description}</p>
                      <span className="text-[10px] text-[#A09D92]">{step.timeAgo}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E1D8] bg-[#FAF9F5] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#A09D92]">
            Immutable audit record • Cryptographically signed sign-off
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5 text-[#25251F]" />
              <span>Copy Content</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAnimatedClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

