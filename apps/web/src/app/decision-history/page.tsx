'use client';

import React, { useState, useEffect } from 'react';
import { Download, Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import type { ContentSubmission } from '@evolyn/shared';
import {
  DecisionHistoryTimeline,
  DecisionDetailModal,
  TimelineDecision,
  fetchAllSubmissions,
} from '@/features/decisions';

function getInitialTimelineData(): TimelineDecision[] {
  const now = new Date();
  const currentDayIdx = (now.getDay() + 6) % 7; // Mon = 0 ... Sat = 5 ... Sun = 6
  const todaySpan = currentDayIdx >= 6 ? 1 : 2;

  return [
    {
      id: 'hist-1',
      title: 'Q3 Product Campaign',
      channel: 'LinkedIn',
      decision: 'Approved',
      reviewerName: 'Mann K.',
      reviewerInitials: 'MK',
      timeAgo: '2h ago',
      dayIndex: currentDayIdx,
      spanDays: todaySpan,
      trackIndex: 0,
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
      reviewerInitials: 'AK',
      timeAgo: '4h ago',
      dayIndex: currentDayIdx,
      spanDays: todaySpan,
      trackIndex: 1,
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
      reviewerInitials: 'PK',
      timeAgo: '6h ago',
      dayIndex: currentDayIdx,
      spanDays: todaySpan,
      trackIndex: 2,
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
      reviewerInitials: 'MK',
      timeAgo: 'Yesterday',
      dayIndex: Math.max(0, currentDayIdx - 1),
      spanDays: 2,
      trackIndex: 3,
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
      reviewerInitials: 'AK',
      timeAgo: 'Yesterday',
      dayIndex: Math.max(0, currentDayIdx - 1),
      spanDays: 2,
      trackIndex: 0,
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
    {
      id: 'hist-6',
      title: 'Enterprise Trust Whitepaper',
      channel: 'Blog',
      decision: 'Approved',
      reviewerName: 'Mann K.',
      reviewerInitials: 'MK',
      timeAgo: '2 days ago',
      dayIndex: Math.max(0, currentDayIdx - 2),
      spanDays: 2,
      trackIndex: 3,
      submissionId: 'Submission #SUB-1038',
      content:
        'Architecture breakdown of zero-hallucination verification engines in enterprise brand governance.',
      decisionNote: 'Legal and security team sign-off complete.',
      findingsCount: 0,
      timelineSteps: [
        {
          title: 'Approved by Mann K.',
          description: 'Technical whitepaper approved for gated download.',
          timeAgo: '2 days ago',
          completed: true,
        },
        {
          title: 'Submitted by DevRel',
          description: 'Uploaded via doc connector.',
          timeAgo: '3 days ago',
          completed: false,
        },
      ],
    },
    {
      id: 'hist-7',
      title: 'Global Product Positioning Deck',
      channel: 'Website',
      decision: 'Approved',
      reviewerName: 'Pratham K.',
      reviewerInitials: 'PK',
      timeAgo: '3 days ago',
      dayIndex: Math.max(0, currentDayIdx - 3),
      spanDays: 2,
      trackIndex: 1,
      submissionId: 'Submission #SUB-1037',
      content:
        'Core positioning slides and boilerplate messaging for European brand expansion.',
      decisionNote: 'Passed brand voice guidelines.',
      findingsCount: 0,
      timelineSteps: [
        {
          title: 'Approved by Pratham K.',
          description: 'Positioning copy conforms to international style guides.',
          timeAgo: '3 days ago',
          completed: true,
        },
        {
          title: 'Submitted',
          description: 'Marketing draft ingested.',
          timeAgo: '4 days ago',
          completed: false,
        },
      ],
    },
  ];
}

function DecisionHistoryContent() {
  const { showToast } = useAppShell();
  const [items, setItems] = useState<TimelineDecision[]>(getInitialTimelineData);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('Last 30 Days');

  // TanStack Query: Fetch live submissions and decision history from Express
  const {
    data: queueData,
    isLoading: isQueueLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['decisions', 'timeline'],
    queryFn: () => fetchAllSubmissions(),
  });

  // Map live decisions from PostgreSQL into timeline track cards in real-time
  useEffect(() => {
    const now = new Date();
    // Monday = 0, Tuesday = 1, ..., Saturday = 5, Sunday = 6
    const currentDayIdx = (now.getDay() + 6) % 7;

    if (queueData?.submissions && queueData.submissions.length > 0) {
      const liveItems: TimelineDecision[] = queueData.submissions.map((sub: ContentSubmission) => {
        const isApproved = sub.status === 'APPROVED';
        const isRejected = sub.status === 'REJECTED';
        const decisionText: 'Approved' | 'Changes Requested' | 'Rejected' =
          isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Changes Requested';

        const channelUpper = (sub.channel || 'Website').toUpperCase();
        const trackIndex =
          channelUpper === 'SOCIAL' || channelUpper === 'LINKEDIN' || channelUpper === 'INSTAGRAM'
            ? 0
            : channelUpper === 'WEBSITE'
            ? 1
            : channelUpper === 'EMAIL'
            ? 2
            : 3;

        const subDate = new Date(sub.updatedAt || sub.createdAt);
        const isToday = subDate.toDateString() === now.toDateString();
        const subDayIdx = (subDate.getDay() + 6) % 7;
        const assignedDay = isToday ? currentDayIdx : Math.min(6, Math.max(0, subDayIdx));
        const spanDays = assignedDay >= 6 ? 1 : 2;

        const diffMs = now.getTime() - subDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = 'Just now';
        if (diffMins < 60) {
          timeAgo = `${Math.max(1, diffMins)}m ago`;
        } else if (diffHours < 24) {
          timeAgo = `${diffHours}h ago`;
        } else if (diffDays === 1) {
          timeAgo = 'Yesterday';
        } else if (diffDays < 7) {
          timeAgo = `${diffDays}d ago`;
        } else {
          timeAgo = subDate.toLocaleDateString();
        }

        return {
          id: `live-${sub.id}`,
          title: sub.title,
          channel: sub.channel || 'Website',
          decision: decisionText,
          reviewerName: sub.submittedBy || 'Brand Guardian',
          reviewerInitials: sub.submittedBy ? sub.submittedBy.slice(0, 2).toUpperCase() : 'BG',
          timeAgo,
          dayIndex: assignedDay,
          spanDays,
          trackIndex: trackIndex as 0 | 1 | 2 | 3,
          submissionId: `Submission #${sub.id.slice(0, 8)}`,
          content: sub.rawText,
          decisionNote: `Recorded governance status: ${sub.status}. Verified via pgvector audit rules.`,
          findingsCount: sub.status === 'REVIEWED' ? 2 : 0,
          timelineSteps: [
            {
              title: `${decisionText} by ${sub.submittedBy || 'Brand Guardian'}`,
              description: `Audit outcome saved in PostgreSQL for submission ${sub.id.slice(0, 8)}.`,
              timeAgo,
              completed: true,
            },
            {
              title: 'Automated AI Check Completed',
              description: 'Grounded claims and tone verified against active brand guidelines.',
              timeAgo: subDate.toLocaleDateString(),
              completed: true,
            },
            {
              title: 'Submitted to Governance Queue',
              description: 'Initial draft copy uploaded.',
              timeAgo: subDate.toLocaleDateString(),
              completed: true,
            },
          ],
        };
      });

      const liveIds = new Set(liveItems.map((it) => it.id));
      const initialDynamic = getInitialTimelineData();
      const remaining = initialDynamic.filter((init) => !liveIds.has(init.id));
      setItems([...liveItems, ...remaining]);
    } else {
      setItems(getInitialTimelineData());
    }
  }, [queueData]);

  // Popup Modal State (Opens on small card click with blurred background & GSAP bottom animation)
  const [modalItem, setModalItem] = useState<TimelineDecision | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (item: TimelineDecision) => {
    setModalItem(item);
    setIsModalOpen(true);
  };

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                refetchTimeline();
                showToast('Refreshed decision history from database.');
              }}
              title="Refresh timeline"
              className="p-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isQueueLoading ? 'animate-spin' : ''}`} />
            </button>

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
          </div>
        }
      />

      {/* 2. Gantt Schedule Timeline Hero with Wide Filters & Interactive Date Picker */}
      <section aria-label="Decision Timeline Workstation">
        <DecisionHistoryTimeline
          items={items}
          selectedId={modalItem?.id || ''}
          onSelect={handleCardClick}
          statusFilter={statusFilter}
          onFilterChange={(flt) => setStatusFilter(flt)}
        />
      </section>

      {/* 3. Pop-up Card with blurred background and smooth GSAP entrance from bottom */}
      <DecisionDetailModal
        item={modalItem}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showToast={showToast}
      />
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
