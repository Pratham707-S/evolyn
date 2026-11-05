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
} from 'lucide-react';

export interface ReviewSidebarToolsProps {
  activeTool?: string;
  onSelectTool?: (toolId: string) => void;
  showToast: (msg: string) => void;
}

export function ReviewSidebarTools({
  activeTool = 'improve-writing',
  onSelectTool,
  showToast,
}: ReviewSidebarToolsProps) {
  const [selectedTool, setSelectedTool] = useState(activeTool);

  const handleToolClick = (toolId: string, label: string) => {
    setSelectedTool(toolId);
    if (onSelectTool) onSelectTool(toolId);
    showToast(`Tool active: "${label}"`);
  };

  const aiReviewTools = [
    { id: 'improve-writing', label: 'Improve Writing', icon: Sparkles },
    { id: 'fix-grammar', label: 'Fix Grammar & Spelling', icon: Check },
    { id: 'make-shorter', label: 'Make Shorter', icon: Minimize2 },
    { id: 'make-longer', label: 'Make Longer', icon: Maximize2 },
    { id: 'simplify', label: 'Simplify', icon: Type },
    { id: 'change-tone', label: 'Change Tone', icon: Mic, hasChevron: true },
    { id: 'humanize', label: 'Humanize', icon: User },
    { id: 'summarize', label: 'Summarize', icon: FileText },
    { id: 'translate', label: 'Translate', icon: Globe },
  ];

  const brandGovernanceTools = [
    { id: 'check-compliance', label: 'Check Brand Compliance', icon: ShieldCheck },
    { id: 'brand-voice', label: 'Brand Voice', icon: AudioLines },
    { id: 'guideline-violations', label: 'Guideline Violations', icon: AlertTriangle },
    { id: 'claim-evidence', label: 'Claim Evidence', icon: Scale },
    { id: 'terminology-check', label: 'Terminology Check', icon: BookOpen },
  ];

  return (
    <div className="flex flex-col gap-5 select-none h-full overflow-y-auto pr-1">
      {/* 1. AI Review Tools */}
      <div>
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-[#25251F] leading-tight">
            AI Review Tools
          </h3>
          <p className="text-[11px] text-[#77766E] mt-0.5">
            Improve, refine, and ensure brand compliance.
          </p>
        </div>

        <div className="space-y-1">
          {aiReviewTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleToolClick(tool.id, tool.label)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#E8EBE1] text-[#25251F] font-semibold border border-[#68745D]/25 shadow-2xs'
                    : 'text-[#25251F] hover:bg-[#EFECE5] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#68745D]' : 'text-[#77766E]'
                    }`}
                  />
                  <span className="truncate">{tool.label}</span>
                </div>
                {tool.hasChevron && (
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
          <h4 className="text-xs font-semibold text-[#25251F] uppercase tracking-wider">
            Brand Governance Tools
          </h4>
        </div>

        <div className="space-y-1">
          {brandGovernanceTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = selectedTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleToolClick(tool.id, tool.label)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#E8EBE1] text-[#25251F] font-semibold border border-[#68745D]/25 shadow-2xs'
                    : 'text-[#25251F] hover:bg-[#EFECE5] border border-transparent'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#68745D]' : 'text-[#77766E]'
                  }`}
                />
                <span className="truncate">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
