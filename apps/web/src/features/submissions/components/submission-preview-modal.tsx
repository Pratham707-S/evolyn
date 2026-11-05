'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  User,
  Layers,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';

export interface SubmissionData {
  id: string;
  title: string;
  excerpt: string;
  fullText?: string;
  channel: 'LinkedIn' | 'Website' | 'Email' | 'Blog' | 'Instagram' | string;
  status: 'Needs Changes' | 'Approved' | 'Pending Review' | string;
  submittedAt: string;
  latestReview: string;
  author?: string;
  version?: string;
}

interface SubmissionPreviewModalProps {
  submission: SubmissionData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmissionPreviewModal({
  submission,
  isOpen,
  onClose,
}: SubmissionPreviewModalProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !submission) return null;

  const content =
    submission.fullText ||
    `${submission.excerpt}\n\nOur team has spent months researching and establishing these verified guidelines so every piece of communication reflects the core values and grounded claims of our enterprise. This copy is currently undergoing automated AI and human brand governance verification.`;

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 180);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            Approved
          </span>
        );
      case 'Needs Changes':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA]">
            Needs Changes
          </span>
        );
      case 'Pending Review':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F1EA] text-[#77766E] border border-[#E5E1D8]">
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E1D8] flex items-start justify-between bg-[#FDFCF7]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl text-[#25251F]">
                  {submission.title}
                </h3>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-xs text-[#77766E] mt-0.5">
                Channel: <span className="font-medium text-[#25251F]">{submission.channel}</span> · Version: {submission.version || 'v1.0'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="px-5 py-2.5 bg-[#F7F5F0] border-b border-[#E5E1D8] flex flex-wrap items-center gap-4 text-xs text-[#77766E]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#A09D92]" />
            <span>Submitted: <strong className="text-[#25251F]">{submission.submittedAt}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#A09D92]" />
            <span>Author: <strong className="text-[#25251F]">{submission.author || 'Campaign Team'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#A09D92]" />
            <span>{wordCount} words (~{readTime} min read)</span>
          </div>
        </div>

        {/* Modal Body / Copy */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#77766E]">
              Submitted Copy Content
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-7 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#64816A]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </Button>
          </div>

          <div className="bg-[#F7F5F0] border border-[#E5E1D8] rounded-xl p-4 text-sm text-[#25251F] leading-relaxed whitespace-pre-line font-sans select-text">
            {content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E5E1D8] bg-[#FDFCF7] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              router.push(`/reviews?id=${submission.id}`);
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Review Workspace</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

