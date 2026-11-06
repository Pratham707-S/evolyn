'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import type { ContentSubmission, DecisionType } from '@evolyn/shared';
import {
  ApprovalQueue,
  ApprovalDetailView,
  DecisionModal,
  fetchApprovalQueue,
  fetchSubmissionReview,
  type SubmissionReviewDetails,
  type SubmitDecisionResult,
} from '@/features/decisions';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';

function ApprovalsContent() {
  const searchParams = useSearchParams();
  const urlSubmissionId = searchParams.get('submissionId');
  const { showToast: shellShowToast } = useAppShell();

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
  const [reviewDetails, setReviewDetails] = useState<SubmissionReviewDetails | null>(null);
  const [overriddenIssueIds, setOverriddenIssueIds] = useState<string[]>([]);

  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDecisionType, setPendingDecisionType] = useState<DecisionType>('APPROVED');

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    shellShowToast(text);
    setTimeout(() => setToastMessage(null), 4500);
  }, [shellShowToast]);

  // Fetch queue of submissions awaiting approval
  const loadQueue = useCallback(async (selectIdAfterLoad?: string) => {
    setIsQueueLoading(true);
    setQueueError(null);
    try {
      const data = await fetchApprovalQueue('REVIEWED');
      setSubmissions(data.submissions);

      // Auto-select requested ID or first item if none selected
      const targetId = selectIdAfterLoad || urlSubmissionId;
      if (targetId) {
        const found = data.submissions.find((s) => s.id === targetId);
        if (found) {
          setSelectedSubmission(found);
          return;
        }
      }

      if (data.submissions.length > 0) {
        setSelectedSubmission((prev) => {
          if (prev && data.submissions.some((s) => s.id === prev.id)) {
            return prev;
          }
          return data.submissions[0];
        });
      } else {
        setSelectedSubmission(null);
        setReviewDetails(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Evolyn backend.';
      setQueueError(msg);
    } finally {
      setIsQueueLoading(false);
    }
  }, [urlSubmissionId]);

  // Initial load
  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Load details whenever selectedSubmission changes
  useEffect(() => {
    if (!selectedSubmission) {
      setReviewDetails(null);
      setOverriddenIssueIds([]);
      return;
    }

    let isMounted = true;
    setIsDetailsLoading(true);
    setOverriddenIssueIds([]);

    fetchSubmissionReview(selectedSubmission.id)
      .then((details) => {
        if (isMounted) {
          setReviewDetails(details);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast(`Could not load review findings: ${err.message}`, 'error');
          setReviewDetails(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsDetailsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSubmission, showToast]);

  const handleToggleOverride = (issueId: string) => {
    setOverriddenIssueIds((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleOpenDecisionModal = (decision: DecisionType) => {
    setPendingDecisionType(decision);
    setModalOpen(true);
  };

  const handleDecisionSuccess = (result: SubmitDecisionResult) => {
    const actionLabel =
      result.decision.decision === 'APPROVED'
        ? 'approved'
        : result.decision.decision === 'REJECTED'
        ? 'rejected'
        : 'marked for changes';

    showToast(`Decision recorded: Submission "${selectedSubmission?.title}" was ${actionLabel}.`, 'success');

    // Reload queue; if CHANGES_REQUESTED, it remains in REVIEWED so we keep it selected;
    // if APPROVED or REJECTED, it leaves the queue.
    loadQueue();
  };

  const handleExport = () => {
    if (!submissions || submissions.length === 0) {
      showToast('No submissions in approvals queue to export.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Submission ID,Title,Channel,Submitted By,Status,Created At']
        .concat(
          submissions.map(
            (s) =>
              `"${s.id}","${(s.title || '').replace(/"/g, '""')}","${s.channel}","${s.submittedBy}","${s.status}","${s.createdAt}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evolyn-approvals-queue-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Approvals queue exported to CSV successfully');
  };

  return (
    <div className="space-y-6">
      {/* Toast banner */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 border ${
            toastMessage.type === 'success'
              ? 'bg-[#25251F] text-white border-[#3F3E36]'
              : 'bg-[#F7EBEA] text-[#9A4C42] border-[#E8CFCB]'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#64816A] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#9A4C42] flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Page Header matching PR #14 layout and visual hierarchy */}
      <PageHeader
        title="Approvals"
        description="Track, manage, and finalize review decisions for your brand content with evidence-backed AI findings."
        showNotificationBell={true}
        unreadNotificationsCount={submissions.length}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-[#77766E] bg-[#F1EFE8] px-3 py-2 rounded-lg border border-[#E5E1D8]">
              <span className="w-2 h-2 rounded-full bg-[#64816A]" />
              <span>Human-in-the-Loop Gate Active</span>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#25251F]" />
              <span>Export</span>
            </Button>
          </div>
        }
      />

      {/* Queue Error Alert */}
      {queueError && (
        <div className="bg-[#F7EBEA] border border-[#E8CFCB] text-[#9A4C42] text-xs p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{queueError}</span>
          </div>
          <button
            type="button"
            onClick={() => loadQueue()}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Split Approval Workbench: Left Queue & Right Change Audit Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Approval Queue (4 cols on desktop) */}
        <div className="lg:col-span-4 h-full">
          <ApprovalQueue
            submissions={submissions}
            selectedId={selectedSubmission?.id || null}
            onSelect={(sub) => setSelectedSubmission(sub)}
            isLoading={isQueueLoading}
            onRefresh={() => loadQueue(selectedSubmission?.id)}
          />
        </div>

        {/* Column 2: Review Findings & Sign-Off Workbench (8 cols on desktop) */}
        <div className="lg:col-span-8">
          <ApprovalDetailView
            details={reviewDetails}
            isLoading={isDetailsLoading}
            overriddenIssueIds={overriddenIssueIds}
            onToggleOverride={handleToggleOverride}
            onOpenDecisionModal={handleOpenDecisionModal}
          />
        </div>
      </div>

      {/* Decision Sign-Off Modal */}
      {selectedSubmission && (
        <DecisionModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          submissionId={selectedSubmission.id}
          submissionTitle={selectedSubmission.title}
          initialDecision={pendingDecisionType}
          overriddenIssueIds={overriddenIssueIds}
          onDecisionSuccess={handleDecisionSuccess}
        />
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <Suspense
      fallback={
        <AppShell activeItem="Approvals">
          <div className="py-20 text-center text-xs text-[#77766E]">
            Loading Approvals Workbench...
          </div>
        </AppShell>
      }
    >
      <AppShell activeItem="Approvals">
        <ApprovalsContent />
      </AppShell>
    </Suspense>
  );
}
