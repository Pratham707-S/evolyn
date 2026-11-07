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

// Submissions page displays 100% live database records (no mock/fake items)
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

  const queryClient = useQueryClient();

  const isUuid = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const isLive = Boolean(res?.submissions && res.submissions.length > 0);

  const submissions: SubmissionData[] = useMemo(() => {
    if (res && Array.isArray(res.submissions)) {
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
    return [];
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
    if (ids.length > 0) {
      bulkDeleteMutation.mutate(ids);
    }
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
