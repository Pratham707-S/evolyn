'use client';

import React from 'react';
import {
  UserPlus,
  GitFork,
  Download,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface QuickActionsCardProps {
  onInviteMember: () => void;
  onManageWorkflow: () => void;
  onImportGuidelines: () => void;
  onExportData: () => void;
}

export function QuickActionsCard({
  onInviteMember,
  onManageWorkflow,
  onImportGuidelines,
  onExportData,
}: QuickActionsCardProps) {
  const { t } = useLanguage();

  const actions = [
    {
      id: 'invite',
      label: t('quickActions.invite') || 'Invite Team Member',
      icon: UserPlus,
      onClick: onInviteMember,
    },
    {
      id: 'workflow',
      label: t('quickActions.workflow') || 'Manage Approval Workflow',
      icon: GitFork,
      onClick: onManageWorkflow,
    },
    {
      id: 'import',
      label: t('quickActions.import') || 'Import Guidelines',
      icon: Download,
      onClick: onImportGuidelines,
    },
    {
      id: 'export',
      label: t('quickActions.export') || 'Export Workspace Data',
      icon: Upload,
      onClick: onExportData,
    },
  ];

  return (
    <div className="bg-[#FFFEFA] dark:bg-[#18181B] border border-[#E5E1D8] dark:border-[#27272A] rounded-2xl p-5 shadow-2xs transition-colors">
      <h3 className="font-serif font-bold text-lg text-[#25251F] dark:text-[#F4F4F5] tracking-tight mb-3">
        {t('quickActions.title') || 'Quick Actions'}
      </h3>

      <div className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E5E1D8] dark:border-[#27272A] bg-white dark:bg-[#202023] hover:bg-[#FAF9F5] dark:hover:bg-[#27272A] hover:border-[#D5D1C7] text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] group-hover:text-[#25251F] dark:group-hover:text-[#F4F4F5] transition-colors" />
                <span className="text-xs sm:text-sm font-medium text-[#25251F] dark:text-[#F4F4F5]">
                  {act.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] group-hover:text-[#25251F] dark:group-hover:text-[#F4F4F5] group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
