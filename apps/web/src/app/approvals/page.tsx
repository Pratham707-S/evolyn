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
import {
  ApprovalsMetrics,
  ApprovalsTabs,
  ApprovalsTable,
  ApprovalInspector,
  type DecisionItem,
  fetchApprovalQueue,
  fetchSubmissionReview,
  submitHumanDecision,
} from '@/features/decisions';
import {
  applyDecisionToItems,
  configuredReviewerName,
  decisionPayload,
  filterApprovalQueue,
  mapIssuesToChanges,
  mapQueueSubmission,
} from '@/features/decisions/lib/queue-mapping';

function ApprovalsContent() {
  const { showToast } = useAppShell();
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [reviewerComment, setReviewerComment] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    type: 'Approved' | 'Rejected';
    title: string;
  } | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // TanStack Query: fetch the live approval queue (submissions awaiting a
  // human decision, i.e. status=REVIEWED). No demo data is ever merged in.
  const {
    data: queueData,
    isLoading: isQueueLoading,
    error: queueError,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ['approvals', 'queue', 'REVIEWED'],
    queryFn: () => fetchApprovalQueue('REVIEWED'),
  });

  // Sync live backend submissions into decision workstation items. The queue
  // is the only source of rows; with an empty database this stays empty.
  useEffect(() => {
    if (!queueData) return;
    const liveItems: DecisionItem[] = filterApprovalQueue(queueData.submissions).map((sub) =>
      mapQueueSubmission(sub)
    );
    setDecisions(liveItems);
    setSelectedId((prev) =>
      prev && liveItems.some((it) => it.id === prev) ? prev : liveItems[0]?.id ?? null
    );
  }, [queueData]);

  const selectedItem = decisions.find((d) => d.id === selectedId) || decisions[0];

  // Load the real review run and detected issues for the selected submission.
  // Findings and diffs always come from the server, never from rawText.
  const { data: reviewDetails } = useQuery({
    queryKey: ['approvals', 'review', selectedItem?.id],
    enabled: Boolean(selectedItem?.id),
    queryFn: () => fetchSubmissionReview(selectedItem!.id),
  });

  useEffect(() => {
    if (!reviewDetails || !selectedItem) return;
    const changes = mapIssuesToChanges(reviewDetails.issues ?? []);
    setDecisions((prev) =>
      prev.map((d) =>
        d.id === selectedItem.id
          ? {
              ...d,
              findingsCount: reviewDetails.reviewRun?.totalIssuesCount ?? d.findingsCount,
              changes: changes.length > 0 ? changes : d.changes,
              summary: reviewDetails.reviewRun?.summary?.notes || d.summary,
            }
          : d
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewDetails]);

  const isFinalized = selectedItem?.decision === 'Approved' || selectedItem?.decision === 'Rejected';

  const handleInitiateDecision = (decision: 'Approved' | 'Changes Requested' | 'Rejected') => {
    setNotesError(null);

    if (!selectedItem) return;

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
    if (!itemId) return;
    setIsSubmittingDecision(true);
    setNotesError(null);
    setConfirmationModal(null);

    try {
      // Every queue row is a server record, so the decision always goes to the
      // API. Local state changes ONLY after the server confirms it — a failed
      // POST leaves the row's decision, reviewer and date untouched, and the
      // reviewer notes are kept so the decision can be retried.
      await submitHumanDecision(itemId, decisionPayload(decision, notes, configuredReviewerName()));
      setDecisions((prev) =>
        applyDecisionToItems(prev, itemId, decision, configuredReviewerName(), 'Just now', notes)
      );
      await refetchQueue();
      showToast(`Decision recorded: "${decision}".`);
      setReviewerComment('');
      setIsMobileDrawerOpen(false);
    } catch (err) {
      console.error('Failed to submit decision to server:', err);
      showToast(
        err instanceof Error
          ? err.message
          : 'Could not record the decision. Please try again.'
      );
    } finally {
      setIsSubmittingDecision(false);
    }
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
            selectedId={selectedId ?? ''}
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
          {isQueueLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[#77766E]">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading the approval queue from the server...</span>
            </div>
          ) : queueError ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-xs text-[#8A332B] text-center">
              <AlertTriangle className="w-5 h-5" />
              <p>
                Could not load the approval queue:{' '}
                {queueError instanceof Error ? queueError.message : 'unknown error'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchQueue()}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
            </div>
          ) : !selectedItem ? (
            <div className="py-16 text-center text-xs text-[#77766E]">
              The approval queue is empty. Submissions appear here once they complete AI review.
            </div>
          ) : (
            <ApprovalInspector
              item={selectedItem}
              onDecisionSubmit={handleDecisionSubmit}
              showToast={showToast}
              reviewerComment={reviewerComment}
              onReviewerCommentChange={setReviewerComment}
              onQuickAction={handleInitiateDecision}
              embedded={true}
            />
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
