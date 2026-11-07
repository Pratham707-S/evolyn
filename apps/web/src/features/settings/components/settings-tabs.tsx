'use client';

import React from 'react';
import {
  Sliders,
  Users,
  CheckCircle2,
  Link2,
  Bell,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/i18n/language-context';

export type SettingsTabId =
  | 'general'
  | 'team'
  | 'reviews'
  | 'integrations'
  | 'notifications'
  | 'security'
  | 'billing';

interface SettingsTabsProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ activeTab, onTabChange }: SettingsTabsProps) {
  const { t } = useLanguage();

  const tabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: t('settings.tab.general') || 'General', icon: Sliders },
    { id: 'team', label: t('settings.tab.team') || 'Team & Access', icon: Users },
    { id: 'reviews', label: t('settings.tab.reviews') || 'Review & Approvals', icon: CheckCircle2 },
    { id: 'integrations', label: t('settings.tab.integrations') || 'Integrations', icon: Link2 },
    { id: 'notifications', label: t('settings.tab.notifications') || 'Notifications', icon: Bell },
    { id: 'security', label: t('settings.tab.security') || 'Security', icon: ShieldCheck },
    { id: 'billing', label: t('settings.tab.billing') || 'Billing', icon: CreditCard },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-1">
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
                isActive
                  ? 'bg-[#18181B] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] shadow-xs font-semibold'
                  : 'bg-transparent text-[#77766E] dark:text-[#A1A1AA] hover:text-[#25251F] dark:hover:text-[#F4F4F5] hover:bg-[#EFECE6] dark:hover:bg-[#27272A]'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white dark:text-[#18181B]' : 'text-[#77766E] dark:text-[#A1A1AA]')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
