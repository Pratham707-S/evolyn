'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import {
  SettingsTabs,
  SettingsTabId,
  GeneralSettingsForm,
  WorkspaceSummaryCard,
  QuickActionsCard,
  InviteMemberModal,
  TeamSettingsTab,
  ReviewSettingsTab,
  IntegrationsSettingsTab,
  SecuritySettingsTab,
  BillingSettingsTab,
} from '@/features/settings';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useAppShell();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleManageWorkflow = () => {
    setActiveTab('reviews');
    showToast('Switched to Review & Approvals settings');
  };

  const handleImportGuidelines = () => {
    showToast('Redirecting to Guidelines Hub...');
    router.push('/guidelines');
  };

  const handleExportData = () => {
    showToast('Generating workspace backup archive (JSON)...');
    setTimeout(() => {
      showToast('Workspace data package ready for download');
    }, 1200);
  };

  return (
    <AppShell activeItem="Settings">
      <div className="space-y-4 sm:space-y-5 max-w-[1500px] mx-auto pb-8">
        {/* Page Header */}
        <PageHeader
          title="Settings"
          description="Manage your workspace, team, review process, and platform preferences."
          showNotificationBell={true}
          showThemeToggle={true}
          unreadNotificationsCount={1}
        />

        {/* Horizontal Navigation Pills Bar */}
        <SettingsTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
        />

        {/* 2-Column Responsive Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Configuration Card (lg:col-span-8) */}
          <div className="lg:col-span-8">
            {activeTab === 'general' && (
              <GeneralSettingsForm showToast={showToast} />
            )}
            {activeTab === 'team' && (
              <TeamSettingsTab
                showToast={showToast}
                onOpenInvite={() => setIsInviteModalOpen(true)}
              />
            )}
            {activeTab === 'reviews' && (
              <ReviewSettingsTab showToast={showToast} />
            )}
            {activeTab === 'integrations' && (
              <IntegrationsSettingsTab showToast={showToast} />
            )}
            {activeTab === 'notifications' && (
              <ReviewSettingsTab showToast={showToast} />
            )}
            {activeTab === 'security' && (
              <SecuritySettingsTab showToast={showToast} />
            )}
            {activeTab === 'billing' && (
              <BillingSettingsTab showToast={showToast} />
            )}
          </div>

          {/* Right Sidebar: Workspace Card & Quick Actions (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
            {/* Workspace Overview & 3D Isometric Cube */}
            <WorkspaceSummaryCard />

            {/* Quick Actions Card */}
            <QuickActionsCard
              onInviteMember={() => setIsInviteModalOpen(true)}
              onManageWorkflow={handleManageWorkflow}
              onImportGuidelines={handleImportGuidelines}
              onExportData={handleExportData}
            />
          </div>
        </div>

        {/* Modals */}
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          showToast={showToast}
        />
      </div>
    </AppShell>
  );
}
