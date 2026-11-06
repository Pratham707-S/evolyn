'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { ContentSubmission } from '@evolyn/shared';
import {
  DashboardSidebar,
  DashboardHeader,
  WorkflowStepper,
  ComplianceOverview,
  ContentStatusChart,
  DashboardMetrics,
  RecentSubmissions,
  SubmissionItem,
  NewSubmissionModal,
} from '../components/dashboard';

export default function Home() {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Fetch real submissions from Neon PostgreSQL via Express API
  const {
    data: submissionsData,
    isLoading: isSubmissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ['submissions', 'list'],
    queryFn: () =>
      apiClient.get<{ submissions: ContentSubmission[]; total: number }>('/api/submissions'),
  });

  const isLive = Boolean(submissionsData?.submissions && submissionsData.submissions.length > 0);

  // Map live submissions or fallback to initial preview items
  const submissions: SubmissionItem[] = useMemo(() => {
    if (submissionsData?.submissions && submissionsData.submissions.length > 0) {
      return submissionsData.submissions.slice(0, 5).map((s: ContentSubmission) => ({
        id: s.id,
        title: s.title,
        timestamp: new Date(s.createdAt).toLocaleDateString(),
        status:
          s.status === 'APPROVED'
            ? 'Approved'
            : s.status === 'REJECTED'
            ? 'Needs changes'
            : 'Pending',
      }));
    }

    // Default fallback dataset
    return [
      {
        id: 'sub-1',
        title: 'Q3 Product Campaign (LinkedIn)',
        timestamp: '2h ago',
        status: 'Needs changes',
      },
      {
        id: 'sub-2',
        title: 'Website Hero Update',
        timestamp: '4h ago',
        status: 'Approved',
      },
      {
        id: 'sub-3',
        title: 'Product Launch Email',
        timestamp: '6h ago',
        status: 'Approved',
      },
      {
        id: 'sub-4',
        title: 'Customer Case Study',
        timestamp: 'Yesterday',
        status: 'Needs changes',
      },
    ];
  }, [submissionsData]);

  const navRoutes: Record<string, string> = {
    Dashboard: '/',
    Submissions: '/submissions',
    'Review Workspace': '/reviews',
    Approvals: '/approvals',
    'Decision History': '/decision-history',
    'Brand Setup': '/brand-setup',
    Guidelines: '/guidelines',
    'Knowledge Library': '/knowledge-library',
    'Conflict Detector': '/conflict-detector',
    'Claim Evidence': '/claim-evidence',
    'Guideline Improvements': '/guideline-improvements',
    Insights: '/insights',
    Settings: '/settings',
  };

  const handleNavigate = (item: string) => {
    setActiveNav(item);
    const route = navRoutes[item];
    if (route) {
      router.push(route);
    }
  };

  const handleNewSubmissionSuccess = (newSub: SubmissionItem) => {
    refetchSubmissions();
    setNotificationToast(`Persisted "${newSub.title}" in PostgreSQL database.`);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  const handleStepClick = (stepId: string) => {
    if (stepId === 'submit') {
      setIsModalOpen(true);
    } else if (stepId === 'review') {
      router.push('/reviews');
    } else if (stepId === 'evidence') {
      router.push('/claim-evidence');
    } else if (stepId === 'approval') {
      router.push('/approvals');
    } else if (stepId === 'improve') {
      router.push('/guideline-improvements');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#25251F] font-sans antialiased selection:bg-[#68745D] selection:text-white flex">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        activeItem={activeNav}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-4">
          {/* Toast feedback banner */}
          {notificationToast && (
            <div className="fixed top-4 right-4 z-50 bg-[#25251F] text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-[#64816A]" />
              <span>{notificationToast}</span>
            </div>
          )}

          {/* Header */}
          <DashboardHeader
            onNewSubmission={() => setIsModalOpen(true)}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            unreadNotificationsCount={2}
          />

          {/* Row 1: 5-Step Core Workflow Stepper */}
          <section aria-label="Governance Workflow">
            <WorkflowStepper onStepClick={handleStepClick} />
          </section>

          {/* Row 2: Middle Charts */}
          <section
            aria-label="Compliance and Review Analytics"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <ComplianceOverview score={92.4} delta={4.8} />
            <ContentStatusChart />
          </section>

          {/* Row 3: Bottom Analytics */}
          <section
            aria-label="Platform Health and Recent Audits"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"
          >
            <DashboardMetrics />
            <RecentSubmissions
              submissions={submissions}
              isLive={isLive}
              isLoading={isSubmissionsLoading}
              onViewAll={() => router.push('/submissions')}
              onSelectSubmission={() => router.push('/reviews')}
            />
          </section>

          {/* Minimal Editorial Footer */}
          <footer className="pt-4 pb-2 border-t border-[#E5E1D8]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A09D92] gap-2">
            <p>
              Evolyn Brand Governance · Team Matrix Mechanics
            </p>
            <p>
              Autonomous Compliance & Verbatim Evidence Architecture
            </p>
          </footer>
        </div>
      </main>

      {/* New Submission Modal */}
      <NewSubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitSuccess={handleNewSubmissionSuccess}
      />
    </div>
  );
}
