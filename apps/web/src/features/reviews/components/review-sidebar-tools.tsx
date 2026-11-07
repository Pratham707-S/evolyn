'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Minimize2,
  Maximize2,
  Type,
  Mic,
  ChevronRight,
  User,
  FileText,
  Globe,
  ShieldCheck,
  AudioLines,
  AlertTriangle,
  Scale,
  BookOpen,
  Loader2,
} from 'lucide-react';

export interface ReviewSidebarToolsProps {
  activeTool?: string;
  onSelectTool?: (toolId: string) => void;
  onExecuteTool?: (action: string, label: string) => void;
  onRunAudit?: () => void;
  isExecuting?: boolean;
  isAuditing?: boolean;
  executingAction?: string | null;
  showToast: (msg: string) => void;
}

export function ReviewSidebarTools({
  activeTool = 'improve-writing',
  onSelectTool,
  onExecuteTool,
  onRunAudit,
  isExecuting = false,
  isAuditing = false,
  executingAction = null,
  showToast,
}: ReviewSidebarToolsProps) {
  const [selectedTool, setSelectedTool] = useState(activeTool);

  const aiReviewTools = [
    { id: 'improve-writing', action: 'IMPROVE_WRITING', label: 'Improve Writing', icon: Sparkles },
    { id: 'fix-grammar', action: 'GRAMMAR_SPELLING', label: 'Fix Grammar & Spelling', icon: Check },
    { id: 'make-shorter', action: 'MAKE_SHORTER', label: 'Make Shorter', icon: Minimize2 },
    { id: 'make-longer', action: 'MAKE_LONGER', label: 'Make Longer', icon: Maximize2 },
    { id: 'simplify', action: 'SIMPLIFY', label: 'Simplify', icon: Type },
    { id: 'change-tone', action: 'CHANGE_TONE', label: 'Change Tone', icon: Mic, hasChevron: true },
    { id: 'humanize', action: 'HUMANIZE', label: 'Humanize', icon: User },
    { id: 'summarize', action: 'SUMMARIZE', label: 'Summarize', icon: FileText },
    { id: 'translate', action: 'IMPROVE_WRITING', label: 'Translate', icon: Globe },
  ];

  const brandGovernanceTools = [
    { id: 'check-compliance', label: 'Check Brand Compliance', icon: ShieldCheck },
    { id: 'brand-voice', label: 'Brand Voice', icon: AudioLines },
    { id: 'guideline-violations', label: 'Guideline Violations', icon: AlertTriangle },
    { id: 'claim-evidence', label: 'Claim Evidence', icon: Scale },
    { id: 'terminology-check', label: 'Terminology Check', icon: BookOpen },
  ];

  const handleToolClick = (tool: { id: string; action: string; label: string }) => {
    setSelectedTool(tool.id);
    if (onSelectTool) onSelectTool(tool.id);
    if (onExecuteTool) {
      onExecuteTool(tool.action, tool.label);
    } else {
      showToast(`Selected tool: "${tool.label}"`);
    }
  };

  return (
    <div className="flex flex-col gap-5 select-none h-full overflow-y-auto pr-1">
      {/* 1. Evolyn AI Writing Tools */}
      <div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-[#25251F] dark:text-[#F7F5F0] leading-tight flex items-center justify-between">
            <span>Evolyn AI Writing Tools</span>
            {isExecuting && (
              <span className="text-[10px] text-[#68745D] dark:text-[#8A987D] font-normal flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Generating...</span>
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#77766E] dark:text-[#A09D92] mt-0.5">
            Grounded AI rewriting with semantic rule alignment and brand safety.
          </p>
        </div>

        <div className="space-y-1">
          {aiReviewTools.map((tool) => {
            const Icon = tool.icon;
            const isCurrentlyRunning = isExecuting && executingAction === tool.action;

            return (
              <button
                key={tool.id}
                type="button"
                disabled={isExecuting}
                onClick={() => handleToolClick(tool)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors text-left cursor-pointer disabled:opacity-50 ${
                  isCurrentlyRunning
                    ? 'bg-[#E8EBE1] dark:bg-[#202E23] text-[#25251F] dark:text-[#86EFAC] font-semibold border border-[#68745D]/40 dark:border-[#2D4530] shadow-2xs'
                    : 'text-[#25251F] dark:text-[#E4E2DC] hover:bg-[#EFECE5] dark:hover:bg-[#262520] hover:text-[#25251F] dark:hover:text-[#F7F5F0] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCurrentlyRunning ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 text-[#68745D] dark:text-[#86EFAC] animate-spin" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 shrink-0 text-[#77766E] dark:text-[#A09D92]" />
                  )}
                  <span className="truncate">{tool.label}</span>
                </div>
                {tool.hasChevron && !isCurrentlyRunning && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#A09D92] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Brand Governance Tools */}
      <div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-[#25251F] dark:text-[#F7F5F0] leading-tight flex items-center justify-between">
            <span>Brand Governance</span>
            {isAuditing && (
              <span className="text-[10px] text-[#68745D] dark:text-[#8A987D] font-normal flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Auditing...</span>
              </span>
            )}
          </h3>
          <p className="text-[11px] text-[#77766E] dark:text-[#A09D92] mt-0.5">
            Audit against active guidelines & evidence facts.
          </p>
        </div>

        <div className="space-y-1">
          {brandGovernanceTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={isAuditing || isExecuting}
                onClick={() => {
                  if (onRunAudit) {
                    showToast(`Auditing against: ${tool.label}...`);
                    onRunAudit();
                  } else {
                    showToast(`Filter activated: ${tool.label}`);
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors text-left text-[#25251F] dark:text-[#E4E2DC] hover:bg-[#EFECE5] dark:hover:bg-[#262520] hover:text-[#25251F] dark:hover:text-[#F7F5F0] border border-transparent cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-[#77766E] dark:text-[#A09D92] shrink-0" />
                  <span className="truncate">{tool.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
