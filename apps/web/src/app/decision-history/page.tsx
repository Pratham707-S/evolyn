'use client';

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import type { ContentSubmission, Decision } from '@evolyn/shared';
import {
  DecisionHistoryTimeline,
  DecisionBadge,
  fetchAllSubmissions,
  fetchDecisionHistory,
} from '@/features/decisions';
import {
  History,
  FileText,
  Clock,
  User,
  Search,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Download,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';

function DecisionHistoryContent() {
  const searchParams = useSearchParams();
  const urlSubmissionId = searchParams.get('submissionId');
  const { showToast } = useAppShell();

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null);
  const [historyDecisions, setHistoryDecisions] = useState<Decision[]>([]);

  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');

  // Load all submissions for selector
  const loadSubmissions = useCallback(async () => {
    setIsSubmissionsLoading(true);
    setError(null);
    try {
      const res = await fetchAllSubmissions();
      setSubmissions(res.submissions);

      // Select submission matching URL query or first submission
      const targetId = urlSubmissionId;
      if (targetId) {
        const found = res.submissions.find((s) => s.id === targetId);
        if (found) {
          setSelectedSubmission(found);
          return;
        }
      }

      if (res.submissions.length > 0) {
        setSelectedSubmission((prev) => {
          if (prev && res.submissions.some((s) => s.id === prev.id)) {
            return prev;
          }
          return res.submissions[0];
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load submissions.';
      setError(msg);
    } finally {
      setIsSubmissionsLoading(false);
    }
  }, [urlSubmissionId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Load decision history for selected submission
  useEffect(() => {
    if (!selectedSubmission) {
      setHistoryDecisions([]);
      return;
    }

    let isMounted = true;
    setIsHistoryLoading(true);

    fetchDecisionHistory(selectedSubmission.id)
      .then((res) => {
        if (isMounted) {
          setHistoryDecisions(res.decisions);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(`Failed to fetch audit history: ${err.message}`);
          setHistoryDecisions([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSubmission]);

  const handleExport = () => {
    if (!filteredDecisions || filteredDecisions.length === 0) {
      showToast('No decision records found to export for the selected time window.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Submission ID,Submission Title,Decision,Reviewer,Timestamp,Comments']
        .concat(
          filteredDecisions.map(
            (it) =>
              `"${selectedSubmission?.id || ''}","${(selectedSubmission?.title || '').replace(/"/g, '""')}","${it.decision}","${it.reviewerName}","${it.createdAt}","${(it.comments || '').replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `decision-history-audit-${selectedSubmission?.id || 'all'}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exported complete decision audit history');
  };

  const handleDateRangeCycle = () => {
    const nextRange =
      dateRange === 'Last 30 Days'
        ? 'Last 90 Days'
        : dateRange === 'Last 90 Days'
        ? 'Last 7 Days'
        : 'Last 30 Days';
    setDateRange(nextRange);
    showToast(`Time window set to ${nextRange}`);
  };

  const filteredDecisions = useMemo(() => {
    const now = Date.now();
    const daysMap: Record<string, number> = {
      'Last 7 Days': 7,
      'Last 30 Days': 30,
      'Last 90 Days': 90,
    };
    const days = daysMap[dateRange] ?? 30;
    const cutoffTime = now - days * 24 * 60 * 60 * 1000;

    return historyDecisions.filter((d) => {
      if (!d.createdAt) return false;
      const decisionTime = new Date(d.createdAt).getTime();
      // Exclude invalid dates and future-dated decisions
      if (Number.isNaN(decisionTime) || decisionTime > now) {
        return false;
      }
      return decisionTime >= cutoffTime;
    });
  }, [historyDecisions, dateRange]);

  const filteredSubmissions = submissions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.submittedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 1. Page Header matching PR #14 layout and visual hierarchy */}
      <PageHeader
        title="Decision History"
        description="A complete record of review decisions, changes, and approvals for audit and compliance."
        showNotificationBell={true}
        unreadNotificationsCount={submissions.filter((s) => s.status === 'REVIEWED').length}
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
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
            <button
              type="button"
              onClick={handleDateRangeCycle}
              className="bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-[#F1EFE8] transition-colors shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#77766E]" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
            </button>

            {/* Governance Indicator Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#77766E] bg-[#F1EFE8] px-3 py-2 rounded-lg border border-[#E5E1D8]">
              <History className="w-3.5 h-3.5 text-[#68745D]" />
              <span>Immutable Governance Log</span>
            </div>
          </div>
        }
      />

      {/* Error notification */}
      {error && (
        <div className="bg-[#F7EBEA] border border-[#E8CFCB] text-[#9A4C42] text-xs p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadSubmissions()}
            className="text-xs font-semibold underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Split Workbench: Submissions Selector & History Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Submissions Selector (4 cols) */}
        <div className="lg:col-span-4 bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#77766E]" />
              <h2 className="font-serif text-base text-[#25251F] tracking-tight">
                Select Submission
              </h2>
            </div>
            <button
              type="button"
              onClick={loadSubmissions}
              disabled={isSubmissionsLoading}
              className="p-1 rounded-md text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSubmissionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A09D92] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search submissions..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E1D8] bg-[#F7F5F0]/60 text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:ring-1 focus:ring-[#68745D]"
            />
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
            {isSubmissionsLoading ? (
              <div className="py-8 text-center text-xs text-[#77766E] space-y-1">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[#68745D]" />
                <p>Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77766E]">
                No submissions found.
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedSubmission(sub);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-[#68745D] bg-[#FFFEFA] ring-1 ring-[#68745D] shadow-xs'
                        : 'border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F7F5F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#25251F] line-clamp-1">
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase bg-[#F1EFE8] text-[#77766E] px-1.5 py-0.5 rounded flex-shrink-0">
                        {sub.channel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#A09D92] pt-0.5">
                      <span className="truncate">{sub.submittedBy}</span>
                      <DecisionBadge decision={sub.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Audit Trail Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <DecisionHistoryTimeline
            decisions={filteredDecisions}
            isLoading={isHistoryLoading}
            submissionTitle={selectedSubmission?.title}
          />

          {selectedSubmission && (
            <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 flex items-center justify-between text-xs text-[#77766E] shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[#25251F]">Submission Status:</span>
                <DecisionBadge decision={selectedSubmission.status} />
              </div>

              {selectedSubmission.status === 'REVIEWED' && (
                <Link
                  href={`/approvals?submissionId=${selectedSubmission.id}`}
                  className="text-[#68745D] hover:text-[#515B48] font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Open in Approvals Workbench</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DecisionHistoryPage() {
  return (
    <Suspense
      fallback={
        <AppShell activeItem="Decision History">
          <div className="py-20 text-center text-xs text-[#77766E]">
            Loading Decision History...
          </div>
        </AppShell>
      }
    >
      <AppShell activeItem="Decision History">
        <DecisionHistoryContent />
      </AppShell>
    </Suspense>
  );
}
