'use client';

import React from 'react';
import { X, Sparkles, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export interface RewriteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionLabel?: string;
  originalContent?: string;
  rewrittenContent?: string;
  rulesApplied?: string[];
  onAccept: (rewrittenText: string) => void;
}

export function RewriteComparisonModal({
  isOpen,
  onClose,
  actionLabel = 'Improve Writing',
  originalContent = '',
  rewrittenContent = '',
  rulesApplied = [],
  onAccept,
}: RewriteComparisonModalProps) {
  if (!isOpen) return null;

  const safeOriginal = originalContent || '';
  const safeRewritten = rewrittenContent || '';
  const safeRules = rulesApplied || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E1D8] flex items-center justify-between flex-shrink-0 bg-[#FFFEFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8EBE1] text-[#4E6B54] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#25251F]">
                Evolyn AI Rewrite: {actionLabel}
              </h2>
              <p className="text-xs text-[#77766E] mt-0.5">
                Review grounded revisions before applying to your document.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#77766E] hover:text-[#25251F] rounded-lg hover:bg-[#F1EFE8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FAF9F5]">
          {/* Rules Applied Badges */}
          {safeRules.length > 0 && (
            <div className="p-3 bg-[#EEF4EE] border border-[#D4DBC9] rounded-xl flex items-start gap-2 text-xs text-[#36533D]">
              <Sparkles className="w-4 h-4 shrink-0 text-[#4E6B54] mt-0.5" />
              <div>
                <span className="font-semibold">Semantic Brand Rules Applied:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-[#4E6B54]">
                  {safeRules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Before & After Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Draft */}
            <div className="flex flex-col rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] overflow-hidden shadow-2xs">
              <div className="p-3 border-b border-[#E5E1D8] bg-[#F7F5F0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#77766E] uppercase tracking-wider">
                  Original Content
                </span>
                <span className="text-[11px] text-[#A09D92]">
                  {safeOriginal.length} chars
                </span>
              </div>
              <div className="p-4 text-xs text-[#25251F] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-sans select-text">
                {safeOriginal || '(Empty draft)'}
              </div>
            </div>

            {/* AI Rewritten Proposal */}
            <div className="flex flex-col rounded-xl border border-[#68745D]/40 bg-[#FFFEFA] overflow-hidden shadow-2xs">
              <div className="p-3 border-b border-[#68745D]/20 bg-[#E8EBE1]/60 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#4E6B54] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evolyn AI Proposal</span>
                </span>
                <span className="text-[11px] text-[#4E6B54] font-medium">
                  {safeRewritten.length} chars
                </span>
              </div>
              <div className="p-4 text-xs text-[#25251F] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap font-sans select-text bg-[#FAF8F5]/30">
                {safeRewritten || '(No content generated)'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-[#E5E1D8] bg-[#FFFEFA] flex items-center justify-between flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Discard & Keep Original
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onAccept(safeRewritten);
              onClose();
            }}
            className="flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Check className="w-4 h-4" />
            <span>Accept & Update Editor</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

