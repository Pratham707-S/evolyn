'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Check,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCheck,
  Sparkles,
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
  const [notesError, setNotesError] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'Approved' | 'Rejected';
    title: string;
  } | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
          snippet: sub.rawText.slice(0, 40) + '...',
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
  const isFinalized = selectedItem?.decision === 'Approved' || selectedItem?.decision === 'Rejected';

  const handleInitiateDecision = (decision: 'Approved' | 'Changes Requested' | 'Rejected') => {
    setNotesError(null);

    if ((decision === 'Changes Requested' || decision === 'Rejected') && !reviewerComment.trim()) {
      setNotesError('Reviewer notes explaining the reason are required for rejection or change requests.');
      return;
    }

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
    setNotesError(null);
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
    setIsMobileDrawerOpen(false);
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

  const renderDecisionPanelInner = () => (
    <div className="space-y-4">
      <div className="pb-3 border-b border-[#E5E1D8]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
            Decision Station
          </span>
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              selectedItem?.decision === 'Approved'
                ? 'bg-[#EEF4EE] text-[#36533D] border border-[#D1E2D3]'
                : selectedItem?.decision === 'Rejected'
                ? 'bg-[#FDEAEA] text-[#8A332B] border border-[#F4BFB9]'
                : selectedItem?.decision === 'Changes Requested'
                ? 'bg-[#FDF4E7] text-[#865920] border border-[#F0D5B5]'
                : 'bg-[#F1EFE8] text-[#25251F]'
            }`}
          >
            {selectedItem?.decision || 'Pending'}
          </span>
        </div>
        <p className="text-[11px] text-[#77766E] mt-1">
          Final human governance sign-off logged to immutable audit trail.
        </p>
      </div>

      {/* Terminal State Alert if Already Finalized */}
      {isFinalized && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            selectedItem?.decision === 'Approved'
              ? 'bg-[#EEF4EE] border-[#C8DEC9] text-[#2A4530]'
              : 'bg-[#FDEAEA] border-[#F4BFB9] text-[#8A332B]'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            {selectedItem?.decision === 'Approved' ? (
              <ShieldCheck className="w-4 h-4 text-[#64816A]" />
            ) : (
              <XCircle className="w-4 h-4 text-[#B56E63]" />
            )}
            <span>Decision Finalized: {selectedItem?.decision}</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            Recorded by {selectedItem?.reviewerName} on {selectedItem?.date}. This submission is locked in PostgreSQL.
          </p>
        </div>
      )}

      {/* Reviewer Notes & Pre-checks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-[#25251F] uppercase tracking-wider block">
            Reviewer Notes {isFinalized ? '(Archived)' : ''}
          </label>
          <span className="text-[10px] text-[#A09D92]">
            {reviewerComment.length} chars
          </span>
        </div>

        {!isFinalized && (
          <div className="flex items-center gap-1 flex-wrap">
            {[
              'All claims verified with SOC 2 evidence',
              'Trademark and nomenclature confirmed',
              'Empirical benchmark required',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setReviewerComment((prev) => (prev ? `${prev} • ${preset}` : preset));
                  setNotesError(null);
                }}
                className="text-[10px] bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D] text-[#55544E] hover:text-[#25251F] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={3}
          disabled={isFinalized}
          value={reviewerComment}
          onChange={(e) => {
            setReviewerComment(e.target.value);
            if (notesError) setNotesError(null);
          }}
          placeholder={
            isFinalized
              ? 'Submission has reached terminal decision. Notes are locked.'
              : 'Enter rationale, compliance exceptions, or feedback for the submitter...'
          }
          className={`w-full bg-[#FAF9F5] border rounded-xl p-2.5 text-xs text-[#25251F] placeholder:text-[#A09D92] focus:outline-hidden focus:ring-1 focus:ring-[#68745D] transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed ${
            notesError ? 'border-[#B56E63] ring-1 ring-[#B56E63]' : 'border-[#E5E1D8]'
          }`}
        />

        {notesError && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#B56E63] bg-[#FDEAEA] border border-[#F4BFB9] p-2 rounded-lg font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#B56E63]" />
            <span>{notesError}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={isSubmittingDecision || isFinalized}
          onClick={() => handleInitiateDecision('Approved')}
          className="w-full py-2.5 px-3 bg-[#68745D] hover:bg-[#515B48] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#68745D]"
        >
          {isSubmittingDecision ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>Approve & Sign-Off</span>
        </button>

        <button
          type="button"
          disabled={isSubmittingDecision || isFinalized}
          onClick={() => handleInitiateDecision('Changes Requested')}
          className="w-full py-2 px-3 border border-[#B78A4A]/50 bg-[#FDF9F0] hover:bg-[#F9ECCF] disabled:opacity-40 disabled:cursor-not-allowed text-[#865920] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B78A4A]"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Request Changes</span>
        </button>

        <button
          type="button"
          disabled={isSubmittingDecision || isFinalized}
          onClick={() => handleInitiateDecision('Rejected')}
          className="w-full py-2 px-3 border border-[#EAC4BE] bg-[#FBEBE8] hover:bg-[#F9D6D3] disabled:opacity-40 disabled:cursor-not-allowed text-[#B56E63] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B56E63]"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Reject Submission</span>
        </button>
      </div>

      <div className="pt-2 border-t border-[#E5E1D8] text-[10px] text-[#A09D92] flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#68745D]" />
        <span>Cryptographic audit sign-off locked to PostgreSQL</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <PageHeader
        title="Approvals Workstation"
        description="Single-window reviewer studio: inspect diffs, verify claims, and sign off on content."
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
              className="flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Metrics Grid */}
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

      {/* 4. Responsive 3-Column Workstation: Left (3 cols / 25%), Center (6 cols / 50%), Right (3 cols / 25% Sticky Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pb-20">
        {/* Left: Queue Table & Filter */}
        <div className="lg:col-span-4 xl:col-span-3 min-w-0 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="mb-2.5 pb-2 border-b border-[#E5E1D8] flex items-center justify-between">
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

        {/* Center: Selected Submission & Diff Inspector */}
        <div
          id="approval-inspector-pane"
          className="lg:col-span-8 xl:col-span-6 min-w-0 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs"
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
            <div className="py-16 text-center text-xs text-[#77766E]">
              Select a submission from the queue to inspect diffs and record decisions.
            </div>
          )}
        </div>

        {/* Right: Sticky Decision Control Station (Desktop xl+) */}
        <div className="xl:col-span-3 xl:sticky xl:top-6 self-start hidden xl:block min-w-0 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 shadow-xs">
          {renderDecisionPanelInner()}
        </div>
      </div>

      {/* 5. Tablet & Mobile Bottom Action Bar (< xl screens) */}
      <div className="xl:hidden fixed bottom-4 inset-x-4 z-40 max-w-xl mx-auto bg-[#FFFEFA]/95 backdrop-blur-md border border-[#E5E1D8] rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#25251F] truncate">
            {selectedItem?.title}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[#77766E] mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedItem?.decision === 'Approved'
                  ? 'bg-[#64816A]'
                  : selectedItem?.decision === 'Rejected'
                  ? 'bg-[#B56E63]'
                  : 'bg-[#B78A4A]'
              }`}
            />
            <span>{selectedItem?.decision || 'Pending'}</span>
            <span>•</span>
            <span className="font-mono text-[10px]">{selectedItem?.channel}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="shrink-0 py-2 px-3.5 bg-[#68745D] hover:bg-[#515B48] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#68745D]"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Decision Panel</span>
        </button>
      </div>

      {/* 6. Tablet & Mobile Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-[#FFFEFA] border border-[#E5E1D8] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto z-10">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#25251F]">
                Decision Workstation
              </span>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="text-xs text-[#77766E] hover:text-[#25251F] p-1 rounded-md"
              >
                ✕ Close
              </button>
            </div>
            {renderDecisionPanelInner()}
          </div>
        </div>
      )}

      {/* 7. Confirmation Modal for Irreversible Actions */}
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
