'use client';

import React, { useState, useMemo } from 'react';
import { Download, Plus, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { ContentSubmission } from '@evolyn/shared';
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
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  // TanStack Query for live submissions
  const {
    data: res,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['submissions', 'workspace'],
    queryFn: () => fetchAllSubmissions(),
  });

  const isLive = Boolean(res?.submissions && res.submissions.length > 0);

  const submissions: SubmissionData[] = useMemo(() => {
    if (res?.submissions && res.submissions.length > 0) {
      return res.submissions.map((s: ContentSubmission, idx: number) => ({
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
    }
    return initialSubmissionsData;
  }, [res]);

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

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/api/submissions/${id}`);
    },
    onSuccess: () => {
      showToast('Submission removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => {
      showToast(`Delete failed: ${err.message || 'Server error'}`);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiClient.delete('/api/submissions', {
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: (_, ids) => {
      showToast(`Removed ${ids.length} submission${ids.length > 1 ? 's' : ''}.`);
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
    onError: (err: any) => {
      showToast(`Bulk delete failed: ${err.message || 'Server error'}`);
    },
  });

  const handleDeleteSubmission = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDeleteManySubmissions = (ids: string[]) => {
    bulkDeleteMutation.mutate(ids);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Submissions"
        description="Monitor, filter, and audit content submissions undergoing brand governance review."
        showNotificationBell={true}
        unreadNotificationsCount={2}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                showToast('Refreshed submissions from backend database.');
              }}
              title="Refresh submissions"
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={openNewSubmission}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Submission</span>
            </Button>
          </div>
        }
      />

      {/* 2. Top Metrics Grid */}
      <SubmissionsMetrics
        total={metrics.total}
        pending={metrics.pending}
        approved={metrics.approved}
        needsChanges={metrics.needsChanges}
        activeFilter={activeStatusFilter}
        onSelectFilter={(filter) => setActiveStatusFilter(filter)}
      />

      {/* 3. Submissions Table Section */}
      <SubmissionsTable
        initialSubmissions={submissions}
        statusFilter={activeStatusFilter}
        onStatusFilterChange={(filter) => setActiveStatusFilter(filter)}
        onDeleteSubmission={handleDeleteSubmission}
        onDeleteManySubmissions={handleDeleteManySubmissions}
      />
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
