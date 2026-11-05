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
      'Introducing our new AI-powered brand governance platform that helps marketing teams stay compliant, consistent, and on-brand across every channel.',
    channel: 'LinkedIn',
    decision: 'Approved',
    reviewer: 'MK',
    reviewerName: 'Mann K.',
    date: '2h ago',
    reviewId: 'Review #RV-1043',
    summary: 'The content is aligned with brand guidelines with no critical issues.',
    findingsCount: 3,
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
    summary: 'Flagged missing registered trademark symbol on first mention of Evolyn.',
    findingsCount: 1,
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
    summary: 'All performance assertions verified against SOC 2 documentation.',
    findingsCount: 0,
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
    summary: 'Customer quote approved by corporate communications team.',
    findingsCount: 0,
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
    summary: 'Rejected due to ungrounded speed guarantee without benchmark citations.',
    findingsCount: 2,
  },
];

function ApprovalsContent() {
  const { showToast } = useAppShell();
  const [decisions, setDecisions] = useState<DecisionItem[]>(initialDecisionsData);
  const [selectedId, setSelectedId] = useState<string>('dec-1');
  const [statusTab, setStatusTab] = useState<string>('ALL');

  const selectedItem = decisions.find((d) => d.id === selectedId) || decisions[0];

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
    <div className="space-y-6">
      {/* 1. Page Header matching reference */}
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

      {/* 2. Top 4 Metric KPI Cards with Sparklines */}
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

      {/* 4. Split Workstation Layout */}
      <section
        aria-label="Approvals Workstation"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Left Column: Approvals Table (col-span-7) */}
        <div className="lg:col-span-7">
          <ApprovalsTable
            items={decisions}
            selectedId={selectedItem.id}
            onSelect={(item) => setSelectedId(item.id)}
            statusTab={statusTab}
          />
        </div>

        {/* Right Column: Approval Inspector Panel (col-span-5) */}
        <div className="lg:col-span-5">
          <ApprovalInspector
            item={selectedItem}
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
