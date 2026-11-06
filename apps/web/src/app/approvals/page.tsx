'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
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
      'All 2 phrasing changes approved by marketing operations in the Review Workspace.',
    findingsCount: 0,
    changes: [
      {
        id: 'c5',
        title: 'Call-to-action tone optimized',
        description:
          'Replaced aggressive sales phrasing with informative enterprise invitation.',
        before: 'Buy now and eliminate brand review delays',
        after: 'Explore Evolyn and streamline creative approvals',
        isApproved: true,
        rule: 'Rule 1.2: Enterprise Tone',
      },
      {
        id: 'c6',
        title: 'Removed absolute uptime assertion',
        description:
          'Aligned service availability phrasing with approved enterprise SLA documentation.',
        before: 'guarantees 100% zero downtime',
        after: 'built for enterprise resilience and SLA adherence',
        isApproved: true,
        rule: 'Rule 4.1: Service Claims',
      },
    ],
  },
  {
    id: 'dec-4',
    title: 'Customer Case Study',
    snippet: 'How a global brand improved...',
    content:
      'How a global enterprise achieved a 99.4% reduction in brand claim violations and shortened review turnaround from 3 days to under 15 minutes with Evolyn.',
    channel: 'Blog',
    decision: 'Approved',
    reviewer: 'MK',
    reviewerName: 'Mann K.',
    date: 'Yesterday',
    reviewId: 'Review #RV-1040',
    summary:
      'Customer quote substantiated against signed release consent form #CS-889.',
    findingsCount: 0,
    changes: [
      {
        id: 'c7',
        title: 'Attributed benchmark data source',
        description:
          'Added quarterly telemetry citation footnote to 99.4% improvement metric.',
        before: 'improved compliance by over 99%',
        after: 'achieved a 99.4% reduction in brand claim violations (Q3 Telemetry Report)',
        isApproved: true,
        rule: 'Rule 1.4: Grounding',
      },
    ],
  },
  {
    id: 'dec-5',
    title: 'Social Media Teaser',
    snippet: 'A faster, safer way to keep...',
    content:
      'A faster, safer way to keep your brand on track. Stay ahead of compliance risks with automated citation checks and evidence scoring.',
    channel: 'Instagram',
    decision: 'Rejected',
    reviewer: 'AK',
    reviewerName: 'Ayan K.',
    date: 'Yesterday',
    reviewId: 'Review #RV-1039',
    summary:
      'Rejected due to ungrounded speed guarantee without benchmark citations.',
    findingsCount: 2,
    changes: [
      {
        id: 'c8',
        title: 'Prohibited superlative "ultimate platform"',
        description:
          'Violates core enterprise tone guidelines. Superlatives must be rephrased before publication.',
        before: 'The ultimate AI platform to solve all content headaches',
        after: 'An automated brand governance platform for enterprise teams',
        isApproved: false,
        rule: 'Rule 2.3: Anti-Hyperbole',
      },
      {
        id: 'c9',
        title: 'Unverified speed guarantee',
        description:
          'Promise of instant zero-risk operations rejected.',
        before: 'instant zero-risk approval',
        after: 'evidence-backed compliance checks',
        isApproved: false,
        rule: 'Rule 1.4: Grounding',
      },
    ],
  },
];

function ApprovalsContent() {
  const { showToast } = useAppShell();
  const [decisions, setDecisions] = useState<DecisionItem[]>(initialDecisionsData);
  const [selectedId, setSelectedId] = useState<string>('dec-1');
  const [statusTab, setStatusTab] = useState<string>('ALL');

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

      // Merge live items with initial sample items
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

  const handleDecisionSubmit = async (
    itemId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    notes: string
  ) => {
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
        refetchQueue();
        showToast(`Persisted decision: "${decision}" in PostgreSQL.`);
      } catch (err) {
        console.error('Failed to submit decision to server:', err);
        showToast(
          err instanceof Error
            ? err.message
            : 'Server error while persisting decision. Updated locally.'
        );
      }
    } else {
      showToast(`Updated "${selectedItem?.title}" to "${decision}" (local session).`);
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

  const handleSelectDecision = (item: DecisionItem) => {
    setSelectedId(item.id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const el = document.getElementById('approval-inspector-pane');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

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

      {/* 4. Single-Window Studio: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Queue Table (5 columns on lg) */}
        <div className="lg:col-span-5 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 shadow-2xs">
          <ApprovalsTable
            items={decisions}
            selectedId={selectedId}
            onSelect={handleSelectDecision}
            statusTab={statusTab}
          />
        </div>

        {/* Right: Inspector Pane (7 columns on lg) */}
        <div
          id="approval-inspector-pane"
          className="lg:col-span-7 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs"
        >
          {selectedItem ? (
            <ApprovalInspector
              item={selectedItem}
              onDecisionSubmit={handleDecisionSubmit}
              showToast={showToast}
            />
          ) : (
            <div className="py-16 text-center text-xs text-[#77766E]">
              Select a submission from the queue to inspect diffs and record decisions.
            </div>
          )}
        </div>
      </div>
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
