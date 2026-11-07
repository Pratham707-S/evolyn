'use client';

import React from 'react';

export interface ApprovalsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    all: number;
    approved: number;
    changes: number;
    rejected: number;
  };
}

export function ApprovalsTabs({
  activeTab,
  onTabChange,
  counts = { all: 499, approved: 448, changes: 28, rejected: 7 },
}: ApprovalsTabsProps) {
  const tabs = [
    { id: 'ALL', label: `All Decisions (${counts.all})` },
    { id: 'Approved', label: `Approved (${counts.approved})` },
    { id: 'Changes Requested', label: `Changes Requested (${counts.changes})` },
    { id: 'Rejected', label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors select-none ${
              isActive
                ? 'bg-[#25251F] dark:bg-[#F4F4F5] text-white dark:text-[#18181B] shadow-xs font-semibold'
                : 'bg-[#F1EFE8] dark:bg-[#262520] text-[#25251F] dark:text-[#A09D92] hover:bg-[#E8E5DD] dark:hover:bg-[#33322C] dark:hover:text-[#F7F5F0]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

