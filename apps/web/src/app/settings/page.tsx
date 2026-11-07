'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { useLanguage } from '@/lib/i18n/language-context';
import { apiClient } from '@/lib/api/client';
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
  NotificationsSettingsTab,
  SecuritySettingsTab,
  BillingSettingsTab,
} from '@/features/settings';

export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useAppShell();
  const { t } = useLanguage();
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

  const handleExportData = async () => {
    showToast('Packaging complete workspace backup archive (JSON)...');
    try {
      // Gather live backend resources where available
      let guidelines = [];
      let facts = [];
      try {
        const gRes = await apiClient<{ guidelines?: any[] }>('/api/guidelines');
        guidelines = gRes?.guidelines || [];
      } catch {
        // fallback
      }
      try {
        const fRes = await apiClient<{ facts?: any[] }>('/api/knowledge/facts');
        facts = fRes?.facts || [];
      } catch {
        // fallback
      }

      const backupData = {
        exportedAt: new Date().toISOString(),
        platform: 'Evolyn Enterprise Brand Governance',
        version: '1.0.0',
        workspaceSettings: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('evolyn_workspace_settings') || '{}') : {},
        reviewPolicy: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('evolyn_review_policy') || '{}') : {},
        notificationSettings: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('evolyn_notification_settings') || '{}') : {},
        securitySettings: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('evolyn_security_settings') || '{}') : {},
        teamMembers: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('evolyn_team_members') || '[]') : [],
        guidelines,
        approvedFacts: facts,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `evolyn-workspace-backup-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Workspace backup archive downloaded successfully');
    } catch {
      showToast('Unable to export workspace package');
    }
  };

  return (
    <AppShell activeItem="Settings">
      <div className="space-y-4 sm:space-y-5 max-w-[1500px] mx-auto pb-8">
        {/* Page Header with Live Theme Toggle */}
        <PageHeader
          title={t('settings.title') || 'Settings'}
          description={t('settings.description') || 'Manage your workspace, team, review process, and platform preferences.'}
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
              <NotificationsSettingsTab showToast={showToast} />
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
          onMemberAdded={() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('evolyn_team_updated'));
          }}
        />
      </div>
    </AppShell>
  );
}
