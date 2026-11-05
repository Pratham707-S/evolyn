'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  ReviewMetrics,
  ReviewQueue,
  ReviewInspector,
  QueueItem,
} from '@/features/reviews';

const initialQueueItems: QueueItem[] = [
  {
    id: 'sub-1',
    title: 'Q3 Product Campaign',
    channel: 'LinkedIn',
    timeAgo: '2h ago',
    status: 'Ready for Decision',
    reviewId: 'Review #RV-1043',
    content:
      'Introducing our new AI-powered brand governance platform that helps marketing teams stay compliant, consistent, and on-brand across every channel.\n\nWith Evolyn, you can review content, detect guideline conflicts, and get evidence-backed recommendations in seconds.',
    summary:
      'The content is mostly aligned with brand guidelines, but there are 3 issues that need attention.',
    findings: [
      {
        id: 'find-1',
        severity: 'High',
        title: 'Unsubstantiated performance claim',
        explanation:
          'The phrase "in seconds" constitutes a performance guarantee that lacks empirical benchmark proof.',
        suggestedFix: 'in real time with guided review workflows',
        verbatimQuote:
          'Never make unqualified speed or uptime promises without citing audited platform benchmark benchmarks.',
        confidence: 0.96,
        evidenceStrength: 0.22,
      },
      {
        id: 'find-2',
        severity: 'Medium',
        title: 'Missing required brand terminology',
        explanation:
          'Mandatory registered trademark descriptor missing from primary platform introduction.',
        suggestedFix: 'Evolyn™ Brand Governance Platform',
        verbatimQuote:
          'The platform name must be introduced as Evolyn™ Brand Governance at the first mention in external posts.',
        confidence: 0.91,
        evidenceStrength: 0.88,
      },
      {
        id: 'find-3',
        severity: 'Medium',
        title: 'Tone is slightly overly promotional',
        explanation:
          'Superlative and declarative phrasing deviates from our understated, grounded enterprise voice standard.',
        suggestedFix: 'structured and evidence-backed governance',
        verbatimQuote:
          'Maintain an understated, authoritative tone. Avoid marketing hype and ungrounded absolutes.',
        confidence: 0.84,
        evidenceStrength: 0.75,
      },
    ],
  },
  {
    id: 'sub-2',
    title: 'Website Hero Update',
    channel: 'Website',
    timeAgo: '4h ago',
    status: 'In Review',
    reviewId: 'Review #RV-1042',
    content:
      'Enterprise teams maintain complete brand governance integrity across distributed creative pipelines. Verify factual statements with ground-truth documentation.',
    summary:
      'Initial automated analysis completed with 0 critical violations. Ready for human inspection.',
    findings: [
      {
        id: 'find-2-1',
        severity: 'Low',
        title: 'Minor terminology alignment',
        explanation: 'Recommended use of "ground truth" as two separate words.',
        suggestedFix: 'ground-truth documentation',
        verbatimQuote: 'Standardize brand terminology spelling per Chapter 2.',
        confidence: 0.78,
        evidenceStrength: 0.82,
      },
    ],
  },
  {
    id: 'sub-3',
    title: 'Product Launch Email',
    channel: 'Email',
    timeAgo: '6h ago',
    status: 'With Findings',
    reviewId: 'Review #RV-1041',
    content:
      'Be the first to explore Evolyn — guaranteed 100% zero-defect marketing copy for all global product releases.',
    summary:
      'Flagged 2 severe compliance risks regarding absolute guarantees and unverified defect-free claims.',
    findings: [
      {
        id: 'find-3-1',
        severity: 'High',
        title: 'Prohibited risk-free guarantee',
        explanation:
          'Absolute guarantees such as "100% zero-defect" violate regulatory advertising guidelines.',
        suggestedFix: 'comprehensive multi-layer verification',
        verbatimQuote:
          'Under no circumstances may marketing material state or imply zero defect or 100% risk-free operations.',
        confidence: 0.99,
        evidenceStrength: 0.05,
      },
    ],
  },
  {
    id: 'sub-4',
    title: 'Customer Case Study',
    channel: 'Blog',
    timeAgo: 'Yesterday',
    status: 'In Review',
    reviewId: 'Review #RV-1040',
    content:
      'How a Fortune 500 company reduced governance review cycles by 70% while improving factual compliance across 12 product lines.',
    summary: 'Evaluating statistical citations against SOC 2 and customer release approval.',
    findings: [],
  },
  {
    id: 'sub-5',
    title: 'Social Media Teaser',
    channel: 'Instagram',
    timeAgo: 'Yesterday',
    status: 'With Findings',
    reviewId: 'Review #RV-1039',
    content:
      'Say goodbye to brand inconsistency! The ultimate AI platform is here to solve all your content headaches.',
    summary: 'Detected 2 tone violations: hyperbolic phrasing and emotional hype.',
    findings: [
      {
        id: 'find-5-1',
        severity: 'Medium',
        title: 'Excessive hyperbole',
        explanation: 'Phrases like "ultimate" and "all your headaches" violate tone rules.',
        suggestedFix: 'reliable and verifiable brand governance',
        verbatimQuote: 'Do not use words like "ultimate", "revolutionary", or "magical".',
        confidence: 0.92,
        evidenceStrength: 0.9,
      },
    ],
  },
];

function ReviewWorkspaceContent() {
  const { openNewSubmission, showToast } = useAppShell();
  const [items, setItems] = useState<QueueItem[]>(initialQueueItems);
  const [selectedId, setSelectedId] = useState<string>('sub-1');
  const [queueFilter, setQueueFilter] = useState<string | null>(null);

  const activeItem = items.find((it) => it.id === selectedId) || items[0];

  const handleDecisionSubmitted = (type: string, note: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId
          ? {
              ...it,
              status: type === 'APPROVED' ? 'Ready for Decision' : 'With Findings',
            }
          : it
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching reference */}
      <PageHeader
        title="Review Workspace"
        description="Review submissions with AI findings, brand guidelines, and final decisions."
        showNotificationBell={true}
        unreadNotificationsCount={2}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={openNewSubmission}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>New Review</span>
          </Button>
        }
      />

      {/* 2. Top Metric KPI Cards */}
      <section aria-label="Review Workspace Metrics">
        <ReviewMetrics
          inReview={12}
          withFindings={28}
          readyForDecision={16}
          avgTime="4.2 min"
          activeFilter={queueFilter}
          onSelectFilter={(flt) => setQueueFilter(flt)}
        />
      </section>

      {/* 3. Split-Screen Workstation Layout */}
      <section
        aria-label="Split Review Workstation"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
      >
        {/* Left Column: Review Queue (approx 38% width -> col-span-5) */}
        <div className="lg:col-span-5">
          <ReviewQueue
            items={items}
            selectedId={activeItem.id}
            onSelect={(it) => setSelectedId(it.id)}
            statusFilter={queueFilter}
          />
        </div>

        {/* Right Column: Review Inspector Workstation (approx 62% width -> col-span-7) */}
        <div className="lg:col-span-7">
          <ReviewInspector
            item={activeItem}
            onDecisionSubmitted={handleDecisionSubmitted}
            showToast={showToast}
          />
        </div>
      </section>
    </div>
  );
}

export default function ReviewWorkspacePage() {
  return (
    <AppShell activeItem="Review Workspace">
      <ReviewWorkspaceContent />
    </AppShell>
  );
}
