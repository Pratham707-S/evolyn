'use client';

import React, { useState, useEffect } from 'react';
import { Download, Plus } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { fetchAllSubmissions } from '@/features/decisions';
import {
  SubmissionsMetrics,
  SubmissionsTable,
  SubmissionData,
} from '@/features/submissions';

// Initial demo dataset shown only as fallback sample data when live records are unavailable
const initialSubmissionsData: SubmissionData[] = [
  {
    id: 'demo-1',
    title: '[Sample] Q3 Product Campaign',
    excerpt: 'Introducing our new AI-powered brand governance...',
    fullText:
      'Introducing our new AI-powered brand governance platform. Evolyn eliminates compliance bottlenecks and guarantees 100% adherence to all regulatory standards across your marketing pipeline.',
    channel: 'LinkedIn',
    status: 'Needs Changes',
    submittedAt: '2h ago',
    latestReview: '2h ago',
    author: 'Sample Marketing Team',
    version: 'v1.0',
  },
  {
    id: 'demo-2',
    title: '[Sample] Website Hero Update',
    excerpt: 'Evolyn helps enterprise teams keep every piece of...',
    fullText:
      'Evolyn helps enterprise teams keep every piece of content aligned with verified brand truth. Built with grounded AI and zero-hallucination guardrails.',
    channel: 'Website',
    status: 'Approved',
    submittedAt: '4h ago',
    latestReview: '3h ago',
    author: 'Sample Design Ops',
    version: 'v2.1',
  },
  {
    id: 'demo-3',
    title: '[Sample] Product Launch Email',
    excerpt: 'Be the first to explore Evolyn — a smarter way to...',
    fullText:
      'Be the first to explore Evolyn — a smarter way to verify claims, enforce tone of voice, and streamline creative approvals in real time.',
    channel: 'Email',
    status: 'Pending Review',
    submittedAt: '6h ago',
    latestReview: '—',
    author: 'Sample Growth Team',
    version: 'v1.0',
  },
  {
    id: 'demo-4',
    title: '[Sample] Customer Case Study',
    excerpt: 'How a global brand improved compliance and speed...',
    fullText:
      'How a global enterprise achieved a 99.4% reduction in brand claim violations and shortened review turnaround from 3 days to under 15 minutes with Evolyn.',
    channel: 'Blog',
    status: 'Approved',
    submittedAt: 'Yesterday',
    latestReview: 'Yesterday',
    author: 'Sample Editorial',
    version: 'v1.3',
  },
  {
    id: 'demo-5',
    title: '[Sample] Social Media Teaser',
    excerpt: 'A faster, safer way to keep your brand on track...',
    fullText:
      'A faster, safer way to keep your brand on track. Stay ahead of compliance risks with automated citation checks and evidence scoring.',
    channel: 'Instagram',
    status: 'Needs Changes',
    submittedAt: 'Yesterday',
    latestReview: 'Yesterday',
    author: 'Sample Social Team',
    version: 'v1.0',
  },
  {
    id: 'demo-6',
    title: '[Sample] Enterprise Security Whitepaper',
    excerpt: 'SOC 2 Type II compliance and cryptographic audit logs...',
    fullText:
      'SOC 2 Type II compliance and cryptographic audit logs ensure every brand review is strictly verifiable and tamper-proof.',
    channel: 'Blog',
    status: 'Approved',
    submittedAt: '2 days ago',
    latestReview: '2 days ago',
    author: 'Sample Infra Team',
    version: 'v1.1',
  },
  {
    id: 'demo-7',
    title: '[Sample] Partner Ecosystem Press Release',
    excerpt: 'Announcing global integrations with top creative suites...',
    fullText:
      'Announcing global integrations with top creative suites and content engines to bring brand governance directly into your creative workflows.',
    channel: 'Website',
    status: 'Pending Review',
    submittedAt: '3 days ago',
    latestReview: '—',
    author: 'Sample PR Team',
    version: 'v1.0',
  },
];

function SubmissionsContent() {
  const { openNewSubmission, showToast } = useAppShell();
  const [submissions, setSubmissions] = useState<SubmissionData[]>(initialSubmissionsData);
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  // Fetch live submissions if available from backend
  useEffect(() => {
    let isMounted = true;
    fetchAllSubmissions()
      .then((res) => {
        if (isMounted && res.submissions && res.submissions.length > 0) {
          const liveData: SubmissionData[] = res.submissions.map((s, idx) => ({
            id: s.id,
            title: s.title,
            excerpt: s.rawText ? s.rawText.slice(0, 60) + '...' : '',
            fullText: s.rawText || '',
            channel: s.channel || 'Website',
            status:
              s.status === 'APPROVED'
                ? 'Approved'
                : s.status === 'REJECTED'
                ? 'Needs Changes'
                : 'Pending Review',
            submittedAt: new Date(s.createdAt).toLocaleDateString(),
            latestReview: s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : '—',
            author: s.submittedBy || 'Marketing Team',
            version: `v1.${idx}`,
          }));
          setSubmissions(liveData);
          setIsDemoData(false);
        }
      })
      .catch(() => {
        // Retain visibly labelled demo dataset if backend is unreachable
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live metrics
  const metrics = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'Pending Review').length,
    approved: submissions.filter((s) => s.status === 'Approved').length,
    needsChanges: submissions.filter((s) => s.status === 'Needs Changes').length,
  };

  // Safe CSV escaping helper
  const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;

  // Export submissions handler
  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Title,Channel,Status,Submitted At,Latest Review']
        .concat(
          submissions.map(
            (s) =>
              `${escapeCsv(s.title)},${escapeCsv(s.channel)},${escapeCsv(s.status)},${escapeCsv(s.submittedAt)},${escapeCsv(s.latestReview)}`
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

      {/* Demo Notice Banner */}
      {isDemoData && (
        <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl px-4 py-2.5 text-xs text-[#77766E] flex items-center justify-between">
          <span>Notice: Displaying sample/demo submissions. Live records will appear when available from the backend.</span>
          <span className="font-medium text-[#25251F] uppercase text-[10px] tracking-wider px-2 py-0.5 bg-[#EDE8DF] rounded">Demo Mode</span>
        </div>
      )}

      {/* 2. Top Metric KPI Cards (4 cards across) */}
      <section aria-label="Submission Metrics">
        <SubmissionsMetrics
          total={metrics.total}
          pending={metrics.pending}
          approved={metrics.approved}
          needsChanges={metrics.needsChanges}
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
