'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit3, Sparkles, Wand2 } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import {
  ReviewSidebarTools,
  ReviewEditor,
  ReviewAiPanel,
} from '@/features/reviews';

function ReviewWorkspaceContent() {
  const router = useRouter();
  const { showToast, openNewSubmission } = useAppShell();

  const [activeTool, setActiveTool] = useState('improve-writing');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isGuidelineAccepted, setIsGuidelineAccepted] = useState(false);
  const [isEvidenceAdded, setIsEvidenceAdded] = useState(false);
  const [mobileTab, setMobileTab] = useState<'editor' | 'findings' | 'tools'>('editor');

  const handleSaveAndSendToApprovals = () => {
    showToast('Revised version saved. Transferring to Approvals queue...');
    setTimeout(() => {
      router.push('/approvals');
    }, 700);
  };

  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    // On mobile/tablet, smoothly switch to findings tab so user immediately sees the finding card
    setMobileTab('findings');
  };

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* 1. Page Header (Compact & clean) */}
      <PageHeader
        title="Review Workspace"
        description="Review and refine content with AI findings, brand guidelines, and evidence."
        showNotificationBell={true}
        unreadNotificationsCount={1}
        compact={true}
        actions={
          <button
            type="button"
            onClick={openNewSubmission}
            className="bg-[#25251F] hover:bg-[#383832] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Review</span>
          </button>
        }
      />

      {/* 2. Responsive Mobile / Tablet Tab Switcher (Visible only below lg: 1024px) */}
      <div className="lg:hidden flex items-center bg-[#FAF9F5] border border-[#E5E1D8] p-1 rounded-xl shrink-0 gap-1 text-xs select-none">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'editor'
              ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Document</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('findings')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'findings'
              ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B78A4A]" />
          <span>Findings (5)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('tools')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'tools'
              ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-[#68745D]" />
          <span>Tools</span>
        </button>
      </div>

      {/* 3. 3-Column AI Writing & Review Studio */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 overflow-hidden">
        {/* Left Column: AI Review Tools & Brand Governance Tools */}
        <div
          className={`${
            mobileTab === 'tools' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col w-full lg:w-48 xl:w-56 shrink-0 h-full overflow-hidden`}
        >
          <ReviewSidebarTools
            activeTool={activeTool}
            onSelectTool={(toolId) => setActiveTool(toolId)}
            showToast={showToast}
          />
        </div>

        {/* Center Column: Interactive Document Canvas */}
        <div
          className={`${
            mobileTab === 'editor' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col flex-1 min-w-0 h-full overflow-hidden`}
        >
          <ReviewEditor
            initialTitle="Q3 Product Campaign"
            channel="LinkedIn Post"
            isGuidelineAccepted={isGuidelineAccepted}
            isEvidenceAdded={isEvidenceAdded}
            onSelectFinding={handleSelectFinding}
            onSave={handleSaveAndSendToApprovals}
            showToast={showToast}
          />
        </div>

        {/* Right Column: AI Findings & Suggestions with Filter Pills */}
        <div
          className={`${
            mobileTab === 'findings' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col w-full lg:w-72 xl:w-[350px] shrink-0 h-full overflow-hidden`}
        >
          <ReviewAiPanel
            isGuidelineAccepted={isGuidelineAccepted}
            onAcceptGuideline={() => {
              setIsGuidelineAccepted(true);
              showToast('Accepted suggestion: Replaced absolute claim with verified brand compliance');
            }}
            onRejectGuideline={() => {
              setIsGuidelineAccepted(false);
              showToast('Dismissed suggestion');
            }}
            isEvidenceAdded={isEvidenceAdded}
            onAddEvidence={() => {
              setIsEvidenceAdded(true);
              showToast('Evidence attached: Linked SOC 2 benchmark report');
            }}
            onDismissEvidence={() => {
              setIsEvidenceAdded(false);
              showToast('Evidence link cleared');
            }}
            selectedFindingId={selectedFindingId}
            showToast={showToast}
          />
        </div>
      </div>
    </div>
  );
}

export default function ReviewWorkspacePage() {
  return (
    <AppShell activeItem="Review Workspace" noScroll={true}>
      <ReviewWorkspaceContent />
    </AppShell>
  );
}
