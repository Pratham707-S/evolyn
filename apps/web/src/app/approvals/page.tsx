'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Check,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import type { ContentSubmission } from '@evolyn/shared';
import {
  ApprovalsMetrics,
  ApprovalsTabs,
  ApprovalsTable,
  ApprovalInspector,
  DecisionItem,
  fetchAllSubmissions,
  submitHumanDecision,
} from '@/features/decisions';

const initialDecisionsData: DecisionItem[] = [
  {
    id: 'dec-1',
    title: 'Q3 Product Campaign',
    snippet: 'Introducing our new AI-powered...',
    content:
      'Introducing our new AI-powered brand governance platform that helps marketing teams stay compliant, consistent, and on-brand across every channel. Built with grounded AI and zero-hallucination guardrails.',
    channel: 'LinkedIn',
    decision: 'Approved',
    reviewer: 'MK',
    reviewerName: 'Mann K.',
    date: '2h ago',
    reviewId: 'Review #RV-1043',
    summary:
      '2 AI suggestions accepted by submitter in Review Workspace. 1 speed assertion pending final sign-off.',
    findingsCount: 3,
    changes: [
      {
        id: 'c1',
        title: 'Softened absolute performance guarantee',
        description:
          'Replaced unqualified absolute promise ("eliminates 100% of risk") with verified enterprise evidence wording.',
        before: 'eliminates 100% of brand compliance risk and guarantees zero defect marketing',
        after: 'helps marketing teams prevent compliance risks with verified audit citations',
        isApproved: true,
        rule: 'Rule 1.4: Grounded Performance',
      },
      {
        id: 'c2',
        title: 'Registered trademark notice added',
        description:
          'Inserted trademark symbol on primary platform product introduction.',
        before: 'Evolyn',
        after: 'Evolyn™ Brand Governance',
        isApproved: true,
        rule: 'Rule 3.2: Nomenclature Standard',
      },
      {
        id: 'c3',
        title: 'Speed assertion without benchmark link',
        description:
          'Phrase "in seconds" lacks empirical platform citation. Reviewer sign-off required to accept or flag.',
        before: 'in seconds',
        after: 'in real time with automated citation checks',
        isApproved: false,
        rule: 'Rule 2.1: Tone & Claims',
      },
    ],
  },
  {
    id: 'dec-2',
    title: 'Website Hero Update',
    snippet: 'Evolyn helps enterprise teams...',
    content:
      'Evolyn helps enterprise teams keep every piece of content aligned with verified brand truth. Built with grounded AI and zero-hallucination guardrails.',
    channel: 'Website',
    decision: 'Changes Requested',
    reviewer: 'AK',
    reviewerName: 'Ayan K.',
    date: '4h ago',
    reviewId: 'Review #RV-1042',
    summary:
      'Flagged missing registered trademark symbol on primary headline before production push.',
    findingsCount: 1,
    changes: [
      {
        id: 'c4',
        title: 'Trademark symbol required on lead H1 headline',
        description:
          'First headline introduction must include the ™ symbol to satisfy trademark legal policy.',
        before: 'Evolyn Enterprise',
        after: 'Evolyn™ Enterprise Brand Suite',
        isApproved: false,
        rule: 'Rule 3.2: Trademark Policy',
      },
    ],
  },
  {
    id: 'dec-3',
    title: 'Product Launch Email',
    snippet: 'Be the first to explore Evolyn...',
    content:
      'Be the first to explore Evolyn — a smarter way to verify claims, enforce tone of voice, and streamline creative approvals in real time.',
    channel: 'Email',
    decision: 'Approved',
    reviewer: 'PK',
    reviewerName: 'Pratham K.',
    date: '6h ago',
    reviewId: 'Review #RV-1041',
    summary:
      'All product claims conform to corporate voice guidelines and approved knowledge proof sources.',
    findingsCount: 0,
    changes: [
      {
        id: 'c5',
        title: 'Tone checked against corporate voice dimensions',
        description: 'Verified authoritative and grounded attributes.',
        before: 'Be the first to explore Evolyn',
        after: 'Be the first to explore Evolyn',
        isApproved: true,
        rule: 'Voice Guideline: Confident Clarity',
      },
    ],
  },
];

function ApprovalsContent() {
  const { showToast } = useAppShell();
  const [decisions, setDecisions] = useState<DecisionItem[]>(initialDecisionsData);
  const [selectedId, setSelectedId] = useState<string>('dec-1');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [reviewerComment, setReviewerComment] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'Approved' | 'Rejected';
    title: string;
  } | null>(null);

  // TanStack Query: Fetch live submissions
  const {
    data: queueData,
    isLoading: isQueueLoading,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['approvals', 'submissions'],
    queryFn: () => fetchAllSubmissions(),
  });

  // Sync live backend submissions into decision workstation items
  useEffect(() => {
    if (queueData?.submissions && queueData.submissions.length > 0) {
      const liveItems: DecisionItem[] = queueData.submissions.map((sub: ContentSubmission) => {
        const isApproved = sub.status === 'APPROVED';
        const isRejected = sub.status === 'REJECTED';
        const isChanges = sub.status === 'REVIEWED';

        const decisionText: 'Approved' | 'Changes Requested' | 'Rejected' | 'Pending' =
          isApproved
            ? 'Approved'
            : isRejected
            ? 'Rejected'
            : isChanges
            ? 'Changes Requested'
            : 'Pending';

        return {
          id: sub.id,
          title: sub.title,
          snippet: sub.rawText.slice(0, 60) + '...',
          content: sub.rawText,
          channel: sub.channel || 'Website',
          decision: decisionText as DecisionItem['decision'],
          reviewer: sub.submittedBy ? sub.submittedBy.slice(0, 2).toUpperCase() : 'OP',
          reviewerName: sub.submittedBy || 'Reviewer Team',
          date: new Date(sub.createdAt).toLocaleDateString(),
          reviewId: `Sub #${sub.id.slice(0, 8)}`,
          summary: `Status: ${sub.status}. Submitted by ${sub.submittedBy || 'marketing team'}.`,
          findingsCount: sub.status === 'REVIEWED' ? 2 : 0,
          changes: [
            {
              id: `chg-${sub.id}-1`,
              title: 'Brand Tone and Claim Verification',
              description: 'Grounding review conducted against active brand guidelines and verified facts.',
              before: sub.rawText.slice(0, 80),
              after: sub.rawText.slice(0, 80) + ' [Audited for Brand Compliance]',
              isApproved: isApproved,
              rule: 'Rule 1.1: Grounded Integrity',
            },
          ],
        };
      });

      const liveIds = new Set(liveItems.map((it) => it.id));
      const remainingInitial = initialDecisionsData.filter((init) => !liveIds.has(init.id));
      const merged = [...liveItems, ...remainingInitial];

      setDecisions(merged);
      if (liveItems.length > 0 && selectedId === 'dec-1') {
        setSelectedId(liveItems[0].id);
      }
    }
  }, [queueData]);

  const selectedItem = decisions.find((d) => d.id === selectedId) || decisions[0];

  const handleInitiateDecision = (decision: 'Approved' | 'Changes Requested' | 'Rejected') => {
    if (decision === 'Approved' || decision === 'Rejected') {
      setConfirmationModal({
        type: decision,
        title: selectedItem?.title || 'this submission',
      });
      return;
    }

    handleDecisionSubmit(selectedItem.id, decision, reviewerComment);
  };

  const handleDecisionSubmit = async (
    itemId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    notes: string
  ) => {
    setIsSubmittingDecision(true);
    setConfirmationModal(null);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);

    if (isUuid) {
      const decisionType =
        decision === 'Approved'
          ? 'APPROVED'
          : decision === 'Rejected'
          ? 'REJECTED'
          : 'CHANGES_REQUESTED';

      try {
        await submitHumanDecision(itemId, {
          decision: decisionType,
          reviewerName: 'Chief Brand Guardian',
          comments: notes || `Reviewed and recorded as ${decision}`,
        });
        await refetchQueue();
        showToast(`Persisted decision: "${decision}" in PostgreSQL.`);
      } catch (err) {
        console.error('Failed to submit decision to server:', err);
        showToast(
          err instanceof Error
            ? err.message
            : 'Server error while persisting decision. Updated locally.'
        );
      } finally {
        setIsSubmittingDecision(false);
      }
    } else {
      showToast(`Updated "${selectedItem?.title}" to "${decision}" (local session).`);
      setIsSubmittingDecision(false);
    }

    setDecisions((prev) =>
      prev.map((d) =>
        d.id === itemId
          ? {
              ...d,
              decision,
              summary: notes || d.summary,
              reviewerName: 'You (Reviewer)',
              date: 'Just now',
            }
          : d
      )
    );
    setReviewerComment('');
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Title,Channel,Decision,Reviewer,Date']
        .concat(
          decisions.map(
            (d) =>
              `"${d.title}","${d.channel}","${d.decision}","${d.reviewerName}","${d.date}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evolyn-approvals-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Decision audit log exported to CSV');
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Approvals Workstation"
        description="Single-window reviewer studio: inspect brand compliance, verify claims, and sign off on content."
        showNotificationBell={true}
        unreadNotificationsCount={3}
        compact={true}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetchQueue();
                showToast('Refreshed approval queue from backend.');
              }}
              title="Refresh queue"
              className="p-1.5 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isQueueLoading ? 'animate-spin' : ''}`} />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Metrics Strip (Compact & Clickable) */}
      <ApprovalsMetrics
        pending={decisions.filter((d) => d.decision === 'Pending' || d.decision === 'Changes Requested').length}
        approved={decisions.filter((d) => d.decision === 'Approved').length}
        changesRequested={decisions.filter((d) => d.decision === 'Changes Requested').length}
        rejected={decisions.filter((d) => d.decision === 'Rejected').length}
        activeFilter={statusTab}
        onSelectFilter={(flt) => setStatusTab(flt || 'ALL')}
      />

      {/* 3. Filter Tabs */}
      <ApprovalsTabs
        activeTab={statusTab}
        onTabChange={setStatusTab}
        counts={{
          all: decisions.length,
          approved: decisions.filter((d) => d.decision === 'Approved').length,
          changes: decisions.filter((d) => d.decision === 'Changes Requested').length,
          rejected: decisions.filter((d) => d.decision === 'Rejected').length,
        }}
      />

      {/* 4. Modern 2-Column Reviewer Studio: Left (Queue 5 cols / 40%), Right (Document & Sign-Off 7 cols / 60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pb-20">
        {/* Left Column: Intake Queue with Full-Width Cards */}
        <div className="lg:col-span-5 min-w-0 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="mb-3 pb-2.5 border-b border-[#E5E1D8] flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#25251F] uppercase tracking-wider block">
                Intake Queue
              </span>
              <span className="text-[11px] text-[#77766E]">
                {decisions.length} submissions in review
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F1EFE8] text-[#25251F]">
              Live DB
            </span>
          </div>

          <ApprovalsTable
            items={decisions}
            selectedId={selectedId}
            onSelect={(item) => setSelectedId(item.id)}
            statusTab={statusTab}
            compact={true}
          />
        </div>

        {/* Right Column: Comprehensive Document Review & Decision Studio */}
        <div
          id="approval-inspector-pane"
          className="lg:col-span-7 min-w-0 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs"
        >
          {selectedItem ? (
            <ApprovalInspector
              item={selectedItem}
              onDecisionSubmit={handleDecisionSubmit}
              showToast={showToast}
              reviewerComment={reviewerComment}
              onReviewerCommentChange={setReviewerComment}
              onQuickAction={handleInitiateDecision}
              embedded={true}
            />
          ) : (
            <div className="py-20 text-center text-xs text-[#77766E]">
              Select a submission from the queue to inspect brand compliance and record sign-off.
            </div>
          )}
        </div>
      </div>

      {/* 5. Confirmation Modal for Irreversible Actions */}
      {confirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setConfirmationModal(null)}
          />
          <div className="relative w-full max-w-md bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-6 shadow-2xl space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmationModal.type === 'Approved'
                    ? 'bg-[#EEF4EE] border border-[#D1E2D3] text-[#4E6B54]'
                    : 'bg-[#FDEAEA] border border-[#F4BFB9] text-[#8A332B]'
                }`}
              >
                {confirmationModal.type === 'Approved' ? (
                  <CheckCheck className="w-5 h-5 text-[#64816A]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#B56E63]" />
                )}
              </div>

              <div>
                <h3 className="font-semibold text-sm text-[#25251F]">
                  Confirm {confirmationModal.type === 'Approved' ? 'Sign-Off & Approval' : 'Submission Rejection'}
                </h3>
                <p className="text-xs text-[#77766E] mt-1 leading-relaxed">
                  Are you sure you want to mark{' '}
                  <strong className="text-[#25251F]">"{confirmationModal.title}"</strong> as{' '}
                  <span className="font-semibold uppercase tracking-wider">
                    {confirmationModal.type}
                  </span>
                  ? This will seal the audit log and commit the decision to PostgreSQL.
                </p>
              </div>
            </div>

            {reviewerComment.trim() && (
              <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] text-xs space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#77766E] block font-semibold">
                  Included Reviewer Notes:
                </span>
                <p className="text-[#25251F] italic leading-relaxed">
                  "{reviewerComment.trim()}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E1D8]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmationModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>

              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={() =>
                  handleDecisionSubmit(
                    selectedItem.id,
                    confirmationModal.type,
                    reviewerComment
                  )
                }
                className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  confirmationModal.type === 'Approved'
                    ? 'bg-[#68745D] hover:bg-[#515B48] text-white'
                    : 'bg-[#B56E63] hover:bg-[#9B554B] text-white'
                }`}
              >
                {isSubmittingDecision ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>
                  Confirm {confirmationModal.type === 'Approved' ? 'Approval' : 'Rejection'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <AppShell activeItem="Approvals">
      <ApprovalsContent />
    </AppShell>
  );
}
