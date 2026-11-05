'use client';

import React, { useState } from 'react';
import { Download, Calendar, ChevronDown } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  DecisionHistoryMetrics,
  DecisionHistoryTimeline,
  DecisionHistoryDetail,
  TimelineDecision,
} from '@/features/decisions';

const initialTimelineData: TimelineDecision[] = [
  {
    id: 'hist-1',
    title: 'Q3 Product Campaign',
    channel: 'LinkedIn',
    decision: 'Approved',
    reviewerName: 'Mann K.',
    timeAgo: '2h ago',
    submissionId: 'Submission #SUB-1043',
    content:
      'Introducing our new AI-powered brand governance platform that helps marketing teams stay compliant, consistent, and on-brand across every channel.',
    decisionNote: 'Content is strictly aligned with approved Q3 messaging pillars.',
    findingsCount: 3,
    timelineSteps: [
      {
        title: 'Approved by Mann K.',
        description: 'The content is aligned with brand guidelines.',
        timeAgo: '2h ago',
        completed: true,
      },
      {
        title: 'In Review',
        description: 'AI findings analyzed and reviewed by the team.',
        timeAgo: '3h ago',
        completed: false,
      },
      {
        title: 'Submitted',
        description: 'Content submitted for review.',
        timeAgo: '6h ago',
        completed: false,
      },
    ],
  },
  {
    id: 'hist-2',
    title: 'Website Hero Update',
    channel: 'Website',
    decision: 'Changes Requested',
    reviewerName: 'Ayan K.',
    timeAgo: '4h ago',
    submissionId: 'Submission #SUB-1042',
    content:
      'Evolyn helps enterprise teams keep every piece of content aligned with verified brand truth. Built with grounded AI and zero-hallucination guardrails.',
    decisionNote: 'Trademark symbol missing on lead title.',
    findingsCount: 1,
    timelineSteps: [
      {
        title: 'Changes requested by Ayan K.',
        description: 'Ensure Evolyn™ trademark notice is included.',
        timeAgo: '4h ago',
        completed: true,
      },
      {
        title: 'Automated Audit Completed',
        description: 'Flagged 1 trademark compliance violation.',
        timeAgo: '5h ago',
        completed: false,
      },
      {
        title: 'Submitted by Web Team',
        description: 'Content uploaded via API.',
        timeAgo: '6h ago',
        completed: false,
      },
    ],
  },
  {
    id: 'hist-3',
    title: 'Product Launch Email',
    channel: 'Email',
    decision: 'Approved',
    reviewerName: 'Pratham K.',
    timeAgo: '6h ago',
    submissionId: 'Submission #SUB-1041',
    content:
      'Be the first to explore Evolyn — a smarter way to verify claims, enforce tone of voice, and streamline creative approvals in real time.',
    decisionNote: 'Conforms to email marketing guidelines.',
    findingsCount: 0,
    timelineSteps: [
      {
        title: 'Approved by Pratham K.',
        description: 'No brand voice or factual violations found.',
        timeAgo: '6h ago',
        completed: true,
      },
      {
        title: 'Submitted for Review',
        description: 'Marketing launch email copy ingested.',
        timeAgo: '7h ago',
        completed: false,
      },
    ],
  },
  {
    id: 'hist-4',
    title: 'Customer Case Study',
    channel: 'Blog',
    decision: 'Approved',
    reviewerName: 'Mann K.',
    timeAgo: 'Yesterday',
    submissionId: 'Submission #SUB-1040',
    content:
      'How a global enterprise achieved a 99.4% reduction in brand claim violations and shortened review turnaround from 3 days to under 15 minutes with Evolyn.',
    decisionNote: 'Metrics verified with SOC 2 audit report citations.',
    findingsCount: 0,
    timelineSteps: [
      {
        title: 'Approved by Mann K.',
        description: 'Customer consent and proof sources verified.',
        timeAgo: 'Yesterday',
        completed: true,
      },
      {
        title: 'Submitted',
        description: 'Draft case study submitted for sign-off.',
        timeAgo: 'Yesterday',
        completed: false,
      },
    ],
  },
  {
    id: 'hist-5',
    title: 'Social Media Teaser',
    channel: 'Instagram',
    decision: 'Rejected',
    reviewerName: 'Ayan K.',
    timeAgo: 'Yesterday',
    submissionId: 'Submission #SUB-1039',
    content:
      'A faster, safer way to keep your brand on track. Stay ahead of compliance risks with automated citation checks and evidence scoring.',
    decisionNote: 'Violated regulatory claims policy regarding risk-free assertions.',
    findingsCount: 2,
    timelineSteps: [
      {
        title: 'Rejected by Ayan K.',
        description: 'Prohibited superlatives detected.',
        timeAgo: 'Yesterday',
        completed: true,
      },
      {
        title: 'Submitted',
        description: 'Social post copy submitted for review.',
        timeAgo: 'Yesterday',
        completed: false,
      },
    ],
  },
];

function DecisionHistoryContent() {
  const { showToast } = useAppShell();
  const [items] = useState<TimelineDecision[]>(initialTimelineData);
  const [selectedId, setSelectedId] = useState<string>('hist-1');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  const selectedItem = items.find((it) => it.id === selectedId) || items[0];

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Submission ID,Title,Channel,Decision,Reviewer,Timestamp']
        .concat(
          items.map(
            (it) =>
              `"${it.submissionId}","${it.title}","${it.channel}","${it.decision}","${it.reviewerName}","${it.timeAgo}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `decision-history-audit-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported complete decision audit history');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching reference */}
      <PageHeader
        title="Decision History"
        description="A complete record of review decisions, changes, and approvals for audit and compliance."
        showNotificationBell={true}
        unreadNotificationsCount={1}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#25251F]" />
              <span>Export</span>
            </Button>

            {/* Date Range Selector */}
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => {
                  const nextRange =
                    dateRange === 'Last 30 Days'
                      ? 'Last 90 Days'
                      : dateRange === 'Last 90 Days'
                      ? 'Last 7 Days'
                      : 'Last 30 Days';
                  setDateRange(nextRange);
                  showToast(`Time window set to ${nextRange}`);
                }}
                className="bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-[#F1EFE8] transition-colors shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#77766E]" />
                <span>{dateRange}</span>
                <ChevronDown className="w-3 h-3 text-[#77766E]" />
              </button>
            </div>
          </>
        }
      />

      {/* 2. Top 4 Metric KPI Cards with Mini Bar Charts */}
      <section aria-label="Decision History Metrics">
        <DecisionHistoryMetrics
          total={499}
          approved={448}
          changesRequested={28}
          rejected={7}
          activeFilter={statusFilter}
          onSelectFilter={(flt) => setStatusFilter(flt)}
        />
      </section>

      {/* 3. Split-Screen Workstation Layout */}
      <section
        aria-label="Decision History Workstation"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Left Column: Decision Timeline (col-span-5) */}
        <div className="lg:col-span-5">
          <DecisionHistoryTimeline
            items={items}
            selectedId={selectedItem.id}
            onSelect={(item) => setSelectedId(item.id)}
            statusFilter={statusFilter}
            onFilterChange={(flt) => setStatusFilter(flt)}
          />
        </div>

        {/* Right Column: Detailed Decision Inspector & Event Trace (col-span-7) */}
        <div className="lg:col-span-7">
          <DecisionHistoryDetail
            item={selectedItem}
            showToast={showToast}
          />
        </div>
      </section>
    </div>
  );
}

export default function DecisionHistoryPage() {
  return (
    <AppShell activeItem="Decision History">
      <DecisionHistoryContent />
    </AppShell>
  );
}
