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
  const tabs: { id: SettingsTabId; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'team', label: 'Team & Access', icon: Users },
    { id: 'reviews', label: 'Review & Approvals', icon: CheckCircle2 },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'billing', label: 'Billing', icon: CreditCard },
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
                  ? 'bg-[#18181B] text-white shadow-xs font-semibold'
                  : 'bg-transparent text-[#77766E] hover:text-[#25251F] hover:bg-[#EFECE6]'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-[#77766E]')} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

