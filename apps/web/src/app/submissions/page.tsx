'use client';

import React, { useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  SubmissionsMetrics,
  SubmissionsTable,
  SubmissionData,
} from '@/features/submissions';

// Initial dataset mirroring the visual reference exactly
const initialSubmissionsData: SubmissionData[] = [
  {
    id: 'sub-1',
    title: 'Q3 Product Campaign',
    excerpt: 'Introducing our new AI-powered brand governance...',
    fullText:
      'Introducing our new AI-powered brand governance platform. Evolyn eliminates compliance bottlenecks and guarantees 100% adherence to all regulatory standards across your marketing pipeline.',
    channel: 'LinkedIn',
    status: 'Needs Changes',
    submittedAt: '2h ago',
    latestReview: '2h ago',
    author: 'Marketing Team',
    version: 'v1.0',
  },
  {
    id: 'sub-2',
    title: 'Website Hero Update',
    excerpt: 'Evolyn helps enterprise teams keep every piece of...',
    fullText:
      'Evolyn helps enterprise teams keep every piece of content aligned with verified brand truth. Built with grounded AI and zero-hallucination guardrails.',
    channel: 'Website',
    status: 'Approved',
    submittedAt: '4h ago',
    latestReview: '3h ago',
    author: 'Design & Web Ops',
    version: 'v2.1',
  },
  {
    id: 'sub-3',
    title: 'Product Launch Email',
    excerpt: 'Be the first to explore Evolyn — a smarter way to...',
    fullText:
      'Be the first to explore Evolyn — a smarter way to verify claims, enforce tone of voice, and streamline creative approvals in real time.',
    channel: 'Email',
    status: 'Pending Review',
    submittedAt: '6h ago',
    latestReview: '—',
    author: 'Growth Team',
    version: 'v1.0',
  },
  {
    id: 'sub-4',
    title: 'Customer Case Study',
    excerpt: 'How a global brand improved compliance and speed...',
    fullText:
      'How a global enterprise achieved a 99.4% reduction in brand claim violations and shortened review turnaround from 3 days to under 15 minutes with Evolyn.',
    channel: 'Blog',
    status: 'Approved',
    submittedAt: 'Yesterday',
    latestReview: 'Yesterday',
    author: 'Content Editorial',
    version: 'v1.3',
  },
  {
    id: 'sub-5',
    title: 'Social Media Teaser',
    excerpt: 'A faster, safer way to keep your brand on track...',
    fullText:
      'A faster, safer way to keep your brand on track. Stay ahead of compliance risks with automated citation checks and evidence scoring.',
    channel: 'Instagram',
    status: 'Needs Changes',
    submittedAt: 'Yesterday',
    latestReview: 'Yesterday',
    author: 'Social Media Lead',
    version: 'v1.0',
  },
  {
    id: 'sub-6',
    title: 'Enterprise Security Whitepaper',
    excerpt: 'SOC 2 Type II compliance and cryptographic audit logs...',
    fullText:
      'SOC 2 Type II compliance and cryptographic audit logs ensure every brand review is strictly verifiable and tamper-proof.',
    channel: 'Blog',
    status: 'Approved',
    submittedAt: '2 days ago',
    latestReview: '2 days ago',
    author: 'Infra & Security Team',
    version: 'v1.1',
  },
  {
    id: 'sub-7',
    title: 'Partner Ecosystem Press Release',
    excerpt: 'Announcing global integrations with top creative suites...',
    fullText:
      'Announcing global integrations with top creative suites and content engines to bring brand governance directly into your creative workflows.',
    channel: 'Website',
    status: 'Pending Review',
    submittedAt: '3 days ago',
    latestReview: '—',
    author: 'Communications PR',
    version: 'v1.0',
  },
];

function SubmissionsContent() {
  const { openNewSubmission, showToast } = useAppShell();
  const [submissions, setSubmissions] = useState<SubmissionData[]>(initialSubmissionsData);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  // Export submissions handler
  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Title,Channel,Status,Submitted At,Latest Review']
        .concat(
          submissions.map(
            (s) =>
              `"${s.title}","${s.channel}","${s.status}","${s.submittedAt}","${s.latestReview}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evolyn-submissions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Submissions exported to CSV successfully');
  };

  const handleDeleteSubmission = (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    showToast('Submission removed');
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching reference */}
      <PageHeader
        title="Submissions"
        description="Manage, review and track all your brand content submissions."
        showNotificationBell={true}
        unreadNotificationsCount={2}
        actions={
          <>
            {/* Export Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#25251F]" />
              <span>Export</span>
            </Button>

            {/* + New Submission Button */}
            <Button
              variant="primary"
              size="md"
              onClick={openNewSubmission}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>New Submission</span>
            </Button>
          </>
        }
      />

      {/* 2. Top Metric KPI Cards (4 cards across) */}
      <section aria-label="Submission Metrics">
        <SubmissionsMetrics
          total={486}
          pending={12}
          approved={448}
          needsChanges={28}
          activeFilter={activeStatusFilter}
          onSelectFilter={(filter) => setActiveStatusFilter(filter)}
        />
      </section>

      {/* 3. All Submissions Table & Toolbar */}
      <section aria-label="All Submissions List">
        <SubmissionsTable
          initialSubmissions={submissions}
          statusFilter={activeStatusFilter}
          onStatusFilterChange={(st) => setActiveStatusFilter(st)}
          onDeleteSubmission={handleDeleteSubmission}
        />
      </section>
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <AppShell activeItem="Submissions">
      <SubmissionsContent />
    </AppShell>
  );
}
