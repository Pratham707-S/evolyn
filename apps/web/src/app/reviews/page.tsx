'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Edit3, Sparkles, Wand2, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { apiClient } from '@/lib/api/client';
import type { DetectedIssue, ContentSubmission, ReviewRun } from '@evolyn/shared';
import {
  ReviewSidebarTools,
  ReviewEditor,
  ReviewAiPanel,
  RewriteComparisonModal,
  ReviewWorkspaceSkeleton,
} from '@/features/reviews';

interface ReviewDetailsResponse {
  submission: ContentSubmission;
  reviewRun: ReviewRun | null;
  issues: DetectedIssue[];
  decision: any;
}

function ReviewWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast, openNewSubmission } = useAppShell();

  const urlSubmissionId = searchParams.get('id');

  const [activeTool, setActiveTool] = useState('improve-writing');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'editor' | 'findings' | 'tools'>('editor');

  // Rewrite Modal State
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
  const [rewriteModalData, setRewriteModalData] = useState<{
    actionLabel: string;
    original: string;
    rewritten: string;
    rulesApplied: string[];
  }>({
    actionLabel: '',
    original: '',
    rewritten: '',
    rulesApplied: [],
  });

  // Current document content managed by editor
  const [currentContent, setCurrentContent] = useState('');

  // 1. Fetch live review or fall back to latest submission
  const {
    data: reviewData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review', urlSubmissionId],
    queryFn: async (): Promise<ReviewDetailsResponse | null> => {
      let targetId = urlSubmissionId;

      if (!targetId) {
        // Fetch all submissions to grab the latest one
        const subListRes = await apiClient<{ submissions: ContentSubmission[] }>('/api/submissions');
        if (subListRes.submissions && subListRes.submissions.length > 0) {
          targetId = subListRes.submissions[0].id;
        } else {
          return null;
        }
      }

      // Fetch review details for targetId
      try {
        return await apiClient<ReviewDetailsResponse>(`/api/submissions/${targetId}/review`);
      } catch {
        // If no review run exists yet (e.g. freshly created submission), fetch the submission
        const subRes = await apiClient<{ submission: ContentSubmission }>(`/api/submissions/${targetId}`);
        return {
          submission: subRes.submission,
          reviewRun: null,
          issues: [],
          decision: null,
        };
      }
    },
  });

  useEffect(() => {
    if (reviewData?.submission?.rawText && !currentContent) {
      setCurrentContent(reviewData.submission.rawText);
    }
  }, [reviewData, currentContent]);

  // 2. Gemini Rewrite Mutation
  const rewriteMutation = useMutation({
    mutationFn: async ({ action, label }: { action: string; label: string }) => {
      const subId = reviewData?.submission?.id;
      if (!subId) throw new Error('No active submission to rewrite.');

      const textToRewrite = currentContent || reviewData.submission.rawText;
      return apiClient.post<{
        originalText?: string;
        rewrittenText?: string;
        rewrittenContent?: string;
        action: string;
        rationale?: string;
        semanticRulesApplied?: string[];
      }>(
        `/api/submissions/${subId}/rewrite`,
        {
          action,
          content: textToRewrite,
          instruction: `${label} conforming strictly to enterprise brand guidelines`,
        },
        { timeoutMs: 60000 }
      );
    },
    onSuccess: (res, vars) => {
      const rewritten = res.rewrittenText || res.rewrittenContent || '';
      setRewriteModalData({
        actionLabel: vars.label,
        original: currentContent || reviewData?.submission?.rawText || '',
        rewritten,
        rulesApplied: res.semanticRulesApplied || [
          'Brand voice grounded verification',
          'Eliminated hyperbolic claims',
        ],
      });
      setIsRewriteModalOpen(true);
    },
    onError: (err: any) => {
      showToast(`Rewrite failed: ${err.message || 'Evolyn AI service error'}`);
    },
  });

  // 3. Save Revision Mutation (Persists directly to database without triggering slow AI analysis)
  const saveMutation = useMutation({
    mutationFn: async (updatedText: string) => {
      const subId = reviewData?.submission?.id;
      if (!subId) throw new Error('No active submission to save.');

      return apiClient.put<{ submission: ContentSubmission }>(`/api/submissions/${subId}`, {
        rawText: updatedText,
        status: 'REVIEWED',
      });
    },
    onSuccess: () => {
      showToast('Revision saved to database and transferred to Approvals queue.');
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => {
      showToast(`Save failed: ${err.message || 'Server error'}`);
    },
  });

  // 3b. Trigger Fresh AI Governance Audit
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const subId = reviewData?.submission?.id;
      if (!subId) throw new Error('No active submission to analyze.');

      const text = currentContent || reviewData.submission.rawText;
      return apiClient.post<{
        reviewRunId: string;
        overallComplianceScore: number;
        totalIssuesCount: number;
        issues: DetectedIssue[];
      }>(
        `/api/submissions/${subId}/analyze`,
        {
          content: text,
        },
        { timeoutMs: 60000 }
      );
    },
    onSuccess: (data) => {
      showToast(`AI Governance audit completed: ${data.issues?.length || 0} issues detected.`);
      refetch();
    },
    onError: (err: any) => {
      showToast(`Audit failed: ${err.message || 'Server error'}`);
    },
  });

  const auditedSubmissionsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    const submission = reviewData?.submission;
    const subId = submission?.id;
    const hasReviewRun = Boolean(reviewData?.reviewRun);

    // Only automatically trigger the very first audit for genuinely un-audited (PENDING) submissions
    // that have no existing reviewRun record and are not currently being analyzed.
    // Existing reviews, page refreshes, and finalized submissions are never auto-re-audited.
    if (
      subId &&
      submission.status === 'PENDING' &&
      !hasReviewRun &&
      !auditedSubmissionsRef.current.has(subId) &&
      !isLoading &&
      !analyzeMutation.isPending
    ) {
      auditedSubmissionsRef.current.add(subId);
      analyzeMutation.mutate();
    }
  }, [
    reviewData?.submission?.id,
    reviewData?.submission?.status,
    reviewData?.reviewRun,
    isLoading,
    analyzeMutation.isPending,
  ]);

  // 4. Update Finding Status Mutation (Accept / Dismiss)
  const patchFindingMutation = useMutation({
    mutationFn: async ({
      findingId,
      status,
    }: {
      findingId: string;
      status: 'ACCEPTED' | 'OVERRIDDEN';
    }) => {
      const runId = reviewData?.reviewRun?.id;
      if (!runId) return;

      return apiClient.patch(`/api/review-runs/${runId}/findings/${findingId}`, {
        status,
      });
    },
    onSuccess: () => {
      refetch();
    },
  });


  const handleExecuteTool = (action: string, label: string) => {
    rewriteMutation.mutate({ action, label });
  };

  const handleApplyRewrite = (newText: string) => {
    setCurrentContent(newText);
    showToast('Applied Evolyn AI rewrite to interactive editor.');
  };

  const handleAcceptFinding = (issue: DetectedIssue) => {
    if (issue.flaggedExcerpt && issue.suggestedFix) {
      setCurrentContent((prev) => prev.replace(issue.flaggedExcerpt, issue.suggestedFix));
      showToast(`Applied fix for: "${issue.flaggedExcerpt}"`);
    }
    if (issue.id) {
      patchFindingMutation.mutate({ findingId: issue.id, status: 'ACCEPTED' });
    }
  };


  const handleDismissFinding = (findingId: string) => {
    patchFindingMutation.mutate({ findingId, status: 'OVERRIDDEN' });
    showToast('Finding dismissed.');
  };

  const handleSelectFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    setMobileTab('findings');
  };

  if (isLoading) {
    return <ReviewWorkspaceSkeleton />;
  }

  const submission = reviewData?.submission;
  const issues = Array.isArray(reviewData?.issues) ? reviewData.issues : [];

  if (isError || !submission) {
    return (
      <div className="h-full flex items-center justify-center p-8 select-none">
        <div className="max-w-md w-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-6 text-center space-y-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-[#FDF4E7] border border-[#F0D5B5] text-[#B78A4A] mx-auto flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#25251F]">Submission Not Found</h3>
            <p className="text-xs text-[#77766E] leading-relaxed">
              {urlSubmissionId
                ? `Could not load review records for submission "${urlSubmissionId}".`
                : 'No submissions are currently awaiting review.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3.5 py-1.5 bg-[#25251F] hover:bg-[#383832] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              Retry Sync
            </button>
            <button
              type="button"
              onClick={openNewSubmission}
              className="px-3.5 py-1.5 bg-[#68745D] hover:bg-[#57624d] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs"
            >
              New Submission
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      {/* 1. Page Header */}
      <PageHeader
        title="Review Workspace"
        description="Review and refine content with grounded Evolyn brand intelligence, compliance auditing, and evidence."
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

      {/* 2. Responsive Mobile / Tablet Tab Switcher */}
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
          <span>Findings ({issues.length})</span>
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
        {/* Left Column: Gemini AI Tools */}
        <div
          className={`${
            mobileTab === 'tools' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col w-full lg:w-48 xl:w-56 shrink-0 h-full overflow-hidden`}
        >
          <ReviewSidebarTools
            activeTool={activeTool}
            onSelectTool={(toolId) => setActiveTool(toolId)}
            onExecuteTool={handleExecuteTool}
            onRunAudit={() => analyzeMutation.mutate()}
            isExecuting={rewriteMutation.isPending}
            isAuditing={analyzeMutation.isPending}
            executingAction={rewriteMutation.variables?.action || null}
            showToast={showToast}
          />
        </div>

        {/* Center Column: TipTap Interactive Document Canvas */}
        <div
          className={`${
            mobileTab === 'editor' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col flex-1 min-w-0 h-full overflow-hidden`}
        >
          <ReviewEditor
            initialTitle={submission?.title || 'Brand Content Draft'}
            channel={submission?.channel || 'Website'}
            initialContent={currentContent || submission?.rawText || ''}
            submissionId={submission?.id}
            fileUrl={submission?.fileUrl}
            onSelectFinding={handleSelectFinding}
            onContentChange={(text) => setCurrentContent(text)}
            onSave={(text) => {
              setCurrentContent(text);
              saveMutation.mutate(text);
            }}
            showToast={showToast}
            isSaving={saveMutation.isPending}
          />
        </div>

        {/* Right Column: AI Findings & Citations Panel */}
        <div
          className={`${
            mobileTab === 'findings' ? 'flex flex-col' : 'hidden'
          } lg:flex lg:flex-col w-full lg:w-72 xl:w-[350px] shrink-0 h-full overflow-hidden`}
        >
          <ReviewAiPanel
            issues={issues}
            selectedFindingId={selectedFindingId}
            onSelectFinding={handleSelectFinding}
            onAcceptFinding={handleAcceptFinding}
            onDismissFinding={handleDismissFinding}
            onRunAudit={() => analyzeMutation.mutate()}
            isAuditing={analyzeMutation.isPending}
            auditError={analyzeMutation.error?.message || null}
            hasReviewRun={Boolean(reviewData?.reviewRun)}
            complianceScore={reviewData?.reviewRun?.overallComplianceScore}
            showToast={showToast}
          />
        </div>
      </div>

      {/* 4. Gemini Before / After Rewrite Comparison Modal */}
      <RewriteComparisonModal
        isOpen={isRewriteModalOpen}
        onClose={() => setIsRewriteModalOpen(false)}
        actionLabel={rewriteModalData.actionLabel}
        originalContent={rewriteModalData.original}
        rewrittenContent={rewriteModalData.rewritten}
        rulesApplied={rewriteModalData.rulesApplied}
        onAccept={handleApplyRewrite}
      />
    </div>
  );
}

export default function ReviewWorkspacePage() {
  return (
    <AppShell activeItem="Review Workspace" noScroll={true}>
      <Suspense fallback={<ReviewWorkspaceSkeleton />}>
        <ReviewWorkspaceInner />
      </Suspense>
    </AppShell>
  );
}
