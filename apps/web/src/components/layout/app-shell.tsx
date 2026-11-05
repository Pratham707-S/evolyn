'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '../dashboard/dashboard-sidebar';
import { NewSubmissionModal } from '../dashboard/new-submission-modal';
import { SubmissionItem } from '../dashboard/recent-submissions';

interface AppShellProps {
  children: React.ReactNode;
  activeItem: string;
}

export interface AppShellContextValue {
  openMobileSidebar: () => void;
  openNewSubmission: () => void;
  showToast: (message: string) => void;
  activeItem: string;
}

const AppShellContext = createContext<AppShellContextValue>({
  openMobileSidebar: () => {},
  openNewSubmission: () => {},
  showToast: () => {},
  activeItem: 'Dashboard',
});

export const useAppShell = () => useContext(AppShellContext);

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

export function AppShell({ children, activeItem }: AppShellProps) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNavigate = (itemName: string) => {
    const route = navRoutes[itemName];
    if (route) {
      router.push(route);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleNewSubmission = (newSub: SubmissionItem) => {
    showToast(`New audit created for "${newSub.title}"`);
  };

  const contextValue: AppShellContextValue = {
    openMobileSidebar: () => setMobileSidebarOpen(true),
    openNewSubmission: () => setIsModalOpen(true),
    showToast,
    activeItem,
  };

  return (
    <AppShellContext.Provider value={contextValue}>
      <div className="min-h-screen bg-[#F7F5F0] text-[#25251F] font-sans antialiased selection:bg-[#68745D] selection:text-white flex">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-[#25251F] text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span className="w-2 h-2 rounded-full bg-[#64816A]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Shared Sidebar Component */}
        <DashboardSidebar
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          activeItem={activeItem}
          onNavigate={handleNavigate}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
            {children}
          </div>
        </main>

        {/* Shared New Submission Modal */}
        <NewSubmissionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmitSuccess={handleNewSubmission}
        />
      </div>
    </AppShellContext.Provider>
  );
}
