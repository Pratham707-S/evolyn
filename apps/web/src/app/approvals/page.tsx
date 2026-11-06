'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  ApprovalsMetrics,
  ApprovalsTabs,
  ApprovalsTable,
  ApprovalInspector,
  DecisionItem,
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
      'Customer quote approved and numerical citations validated against SOC 2 audit report.',
    findingsCount: 0,
    changes: [
      {
        id: 'c7',
        title: 'Verified statistical citations',
        description:
          'Cross-checked 99.4% violation reduction metric with Q2 audit proof documentation.',
        before: 'nearly eliminated all mistakes',
        after: 'achieved a 99.4% reduction in brand claim violations',
        isApproved: true,
        rule: 'Rule 4.3: Knowledge Library Facts',
      },
    ],
  },
  {
    id: 'dec-5',
    title: 'Social Media Teaser',
    snippet: 'A faster, safer way to keep your...',
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

  const selectedItem = decisions.find((d) => d.id === selectedId) || decisions[0];

  const handleDecisionSubmit = (
    itemId: string,
    decision: 'Approved' | 'Changes Requested' | 'Rejected',
    notes: string
  ) => {
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
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Approvals"
        description="Track, manage, and finalize review decisions for your brand content."
        showNotificationBell={true}
        unreadNotificationsCount={1}
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={handleExport}
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#25251F]" />
            <span>Export</span>
          </Button>
        }
      />

      {/* 2. Top 4 Metric KPI Cards with Sparklines (Preserved exactly as requested) */}
      <section aria-label="Approvals Summary Metrics">
        <ApprovalsMetrics
          approved={448}
          pending={16}
          changesRequested={28}
          rejected={7}
          activeFilter={statusTab === 'ALL' ? null : statusTab}
          onSelectFilter={(flt) => setStatusTab(flt || 'ALL')}
        />
      </section>

      {/* 3. Quick Filter Tabs */}
      <section aria-label="Decision Filter Tabs">
        <ApprovalsTabs
          activeTab={statusTab}
          onTabChange={(tab) => setStatusTab(tab)}
          counts={{ all: 499, approved: 448, changes: 28, rejected: 7 }}
        />
      </section>

      {/* 4. Split Workstation Layout: Left Queue & Right Change Audit Inspector */}
      <section
        aria-label="Approvals Workstation"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Left Column: Approvals Table / Queue (col-span-6) */}
        <div className="lg:col-span-6">
          <ApprovalsTable
            items={decisions}
            selectedId={selectedItem.id}
            onSelect={handleSelectDecision}
            statusTab={statusTab}
          />
        </div>

        {/* Right Column: Approval Inspector with Audit Changes Breakdown (col-span-6) */}
        <div id="approval-inspector-pane" className="lg:col-span-6 scroll-mt-6">
          <ApprovalInspector
            item={selectedItem}
            onDecisionSubmit={handleDecisionSubmit}
            showToast={showToast}
          />
        </div>
      </section>
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
