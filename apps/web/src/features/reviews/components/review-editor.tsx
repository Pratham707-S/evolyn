'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  MoreVertical,
  Edit3,
  FileText,
  History,
  Sparkles,
  RotateCcw,
  Check,
  Undo2,
  Redo2,
  Bold,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ChevronDown,
  Copy,
  ExternalLink,
  Save,
  Linkedin,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export interface ReviewEditorProps {
  initialTitle?: string;
  channel?: string;
  isGuidelineAccepted?: boolean;
  isEvidenceAdded?: boolean;
  onSelectFinding?: (findingId: string) => void;
  onSave?: () => void;
  showToast: (msg: string) => void;
}

export function ReviewEditor({
  initialTitle = 'Q3 Product Campaign',
  channel = 'LinkedIn Post',
  isGuidelineAccepted = false,
  isEvidenceAdded = false,
  onSelectFinding,
  onSave,
  showToast,
}: ReviewEditorProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'pdf' | 'history'>('editor');
  const [copied, setCopied] = useState(false);
  const [fontFormat, setFontFormat] = useState('Normal text');
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);

  const documentText = `Introducing Evolyn: AI-Powered Brand Governance for Modern Marketing Teams

Evolyn is a comprehensive brand governance platform that helps marketing teams create compliant, consistent, and on-brand content across every channel.

With Evolyn, you can increase campaign performance by up to 3x while ensuring ${
    isGuidelineAccepted ? 'verified brand compliance' : '100% brand compliance'
  }. Our AI analyzes your content against brand guidelines, verifies claims with approved evidence, and provides actionable suggestions in seconds.

From social media and ad copy to long-form content and product messaging, Evolyn keeps your brand voice consistent, your claims credible, and your ${
    isEvidenceAdded ? 'marketing enterprise-ready.' : 'marketing risk-free.'
  }`;

  const handleCopy = () => {
    navigator.clipboard.writeText(documentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Document text copied to clipboard');
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      showToast('Revised version saved successfully');
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl shadow-2xs flex flex-col h-full overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-[#E5E1D8] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 bg-[#FFFEFA]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => showToast('Navigating back to Submissions...')}
            className="p-1 -ml-1 text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] rounded-md transition-colors"
            title="Back to submissions"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-[#25251F] truncate leading-tight">
              {initialTitle}
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-[#77766E] mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 font-medium text-[#0A66C2]">
                <Linkedin className="w-3 h-3 fill-[#0A66C2] text-transparent" />
                <span>{channel}</span>
              </span>
              <span>•</span>
              <span>Submitted 2 hours ago</span>
              <span>•</span>
              <span className="font-mono">Review #RV-1043</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          {/* Status pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FDF4E7] text-[#B78A4A] border border-[#F0D5B5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B78A4A]" />
            <span>In Review</span>
          </span>

          <button
            type="button"
            onClick={() => showToast('Review document actions menu')}
            className="p-1.5 text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] rounded-lg transition-colors cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs */}
      <div className="px-4 sm:px-5 pt-2 border-b border-[#E5E1D8] flex items-center gap-4 sm:gap-6 shrink-0 bg-[#FFFEFA] overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-1.5 pb-2 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'editor'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-1.5 pb-2 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'pdf'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Original (PDF)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-1.5 pb-2 text-xs font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === 'history'
              ? 'border-[#25251F] text-[#25251F] font-semibold'
              : 'border-transparent text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Version History</span>
        </button>
      </div>

      {/* 3. Document Content Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6 space-y-5 font-sans">
        {activeTab === 'editor' && (
          <>
            {/* Lead Heading */}
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#25251F] tracking-tight leading-snug">
              Introducing Evolyn: AI-Powered Brand Governance for Modern Marketing Teams
            </h1>

            {/* Paragraph 1 */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#25251F]">
              Evolyn is a comprehensive brand governance platform that helps marketing teams create compliant, consistent, and on-brand content across every channel.
            </p>

            {/* Paragraph 2 with Interactive Highlights */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#25251F]">
              With Evolyn, you can{' '}
              <span
                onClick={() => onSelectFinding?.('finding-evidence')}
                className="bg-[#FDF4E7] text-[#865920] px-1 py-0.5 rounded border-b-2 border-[#E0A868] cursor-pointer hover:bg-[#F9ECCF] transition-colors"
                title="Unsupported Claim: Click to view details"
              >
                increase campaign performance by up to 3x
              </span>{' '}
              while ensuring{' '}
              <span
                onClick={() => onSelectFinding?.('finding-guideline')}
                className={`px-1 py-0.5 rounded border-b-2 cursor-pointer transition-colors ${
                  isGuidelineAccepted
                    ? 'bg-[#EEF4EE] text-[#36533D] border-[#64816A] font-medium'
                    : 'bg-[#FDEAEA] text-[#9E342B] border-[#E07A70] font-medium hover:bg-[#F9D6D3]'
                }`}
                title="Guideline Violation: Click to inspect"
              >
                {isGuidelineAccepted ? 'verified brand compliance.' : '100% brand compliance.'}
              </span>{' '}
              Our AI analyzes your content against brand guidelines, verifies claims with approved evidence, and provides actionable suggestions in seconds.
            </p>

            {/* Paragraph 3 with Interactive Highlight */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#25251F]">
              From social media and ad copy to long-form content and product messaging, Evolyn keeps your brand voice consistent, your claims credible, and your{' '}
              <span
                onClick={() => onSelectFinding?.('finding-evidence')}
                className="bg-[#FDF4E7] text-[#865920] px-1 py-0.5 rounded border-b-2 border-[#E0A868] cursor-pointer hover:bg-[#F9ECCF] transition-colors"
                title="Tone & Risk: Click to inspect"
              >
                marketing risk-free.
              </span>
            </p>

            {/* Floating Inline AI Toolbar (Matching reference) */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 bg-[#FFFEFA] border border-[#E5E1D8] shadow-sm rounded-lg px-3 py-1.5 text-xs text-[#25251F]">
                <button
                  type="button"
                  onClick={() => showToast('AI Improvement applied')}
                  className="flex items-center gap-1 font-medium hover:text-[#68745D] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#68745D]" />
                  <span>Improve</span>
                </button>
                <span className="text-[#E5E1D8]">•</span>
                <button
                  type="button"
                  onClick={() => showToast('Rephrasing active segment...')}
                  className="flex items-center gap-1 text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rephrase</span>
                </button>
                <span className="text-[#E5E1D8]">•</span>
                <button
                  type="button"
                  onClick={() => showToast('Shortened sentence by 20%')}
                  className="flex items-center gap-1 text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Shorten</span>
                </button>
                <span className="text-[#E5E1D8]">•</span>
                <button
                  type="button"
                  onClick={() => showToast('Opening additional AI transformation options...')}
                  className="text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
                >
                  + More
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'pdf' && (
          <div className="p-8 border border-dashed border-[#E5E1D8] rounded-xl text-center space-y-3 bg-[#FAF9F5]">
            <FileText className="w-10 h-10 text-[#68745D] mx-auto opacity-70" />
            <h3 className="font-serif text-base text-[#25251F]">
              Original Submitted Asset (PDF Preview)
            </h3>
            <p className="text-xs text-[#77766E] max-w-md mx-auto">
              Campaign brief submitted as "Q3_Product_Launch_Copy.pdf" (1.4 MB). All AI extraction and semantic guidelines verified.
            </p>
            <button
              type="button"
              onClick={() => showToast('Downloading original submission document...')}
              className="text-xs text-[#68745D] hover:underline font-medium inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Download Original PDF File</span>
            </button>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#25251F] uppercase tracking-wider">
              Revision Log (v1.2)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#25251F]">Version 1.2 (Current Draft)</span>
                  <p className="text-[#77766E] text-[11px]">Applied guideline rule G-04 claim replacement.</p>
                </div>
                <span className="text-[#A09D92] text-[11px]">Just now</span>
              </div>
              <div className="p-3 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#25251F]">Version 1.0 (Initial Submission)</span>
                  <p className="text-[#77766E] text-[11px]">Submitted by Marketing Team via Submissions portal.</p>
                </div>
                <span className="text-[#A09D92] text-[11px]">2h ago</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Formatting Toolbar */}
      <div className="px-3 sm:px-4 py-2 border-t border-[#E5E1D8] bg-[#FAF9F5] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left Side: Rich-text icons */}
        <div className="flex items-center gap-1 text-[#77766E] overflow-x-auto no-scrollbar max-w-full pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => showToast('Undo')}
            className="p-1.5 hover:text-[#25251F] hover:bg-[#E5E1D8] rounded transition-colors"
            title="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => showToast('Redo')}
            className="p-1.5 hover:text-[#25251F] hover:bg-[#E5E1D8] rounded transition-colors"
            title="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#E5E1D8] mx-1" />

          {/* Normal text dropdown */}
          <button
            type="button"
            onClick={() => showToast('Font format: Normal text')}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#25251F] hover:bg-[#E5E1D8] rounded transition-colors"
          >
            <span>{fontFormat}</span>
            <ChevronDown className="w-3 h-3 text-[#77766E]" />
          </button>

          <div className="h-4 w-[1px] bg-[#E5E1D8] mx-1" />

          <button
            type="button"
            onClick={() => setIsBold(!isBold)}
            className={`p-1.5 rounded transition-colors ${
              isBold ? 'bg-[#E5E1D8] text-[#25251F]' : 'hover:text-[#25251F] hover:bg-[#E5E1D8]'
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsUnderline(!isUnderline)}
            className={`p-1.5 rounded transition-colors ${
              isUnderline ? 'bg-[#E5E1D8] text-[#25251F]' : 'hover:text-[#25251F] hover:bg-[#E5E1D8]'
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsStrike(!isStrike)}
            className={`p-1.5 rounded transition-colors ${
              isStrike ? 'bg-[#E5E1D8] text-[#25251F]' : 'hover:text-[#25251F] hover:bg-[#E5E1D8]'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-[#E5E1D8] mx-1" />

          <button
            type="button"
            onClick={() => showToast('Bulleted list toggled')}
            className="p-1.5 hover:text-[#25251F] hover:bg-[#E5E1D8] rounded transition-colors"
            title="Bulleted List"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => showToast('Numbered list toggled')}
            className="p-1.5 hover:text-[#25251F] hover:bg-[#E5E1D8] rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#68745D] hover:bg-[#58644E] text-white px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-white" />
            <span>Save Revised Version</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="bg-[#FFFEFA] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#64816A]" />
                <span className="text-[#64816A]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#77766E]" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
