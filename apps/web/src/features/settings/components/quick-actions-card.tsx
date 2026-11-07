'use client';

import React from 'react';
import {
  UserPlus,
  GitFork,
  Download,
  Upload,
  ChevronRight,
} from 'lucide-react';

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
  const actions = [
    {
      id: 'invite',
      label: 'Invite Team Member',
      icon: UserPlus,
      onClick: onInviteMember,
    },
    {
      id: 'workflow',
      label: 'Manage Approval Workflow',
      icon: GitFork,
      onClick: onManageWorkflow,
    },
    {
      id: 'import',
      label: 'Import Guidelines',
      icon: Download,
      onClick: onImportGuidelines,
    },
    {
      id: 'export',
      label: 'Export Workspace Data',
      icon: Upload,
      onClick: onExportData,
    },
  ];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 shadow-2xs">
      <h3 className="font-serif font-bold text-lg text-[#25251F] tracking-tight mb-3">
        Quick Actions
      </h3>

      <div className="space-y-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-[#E5E1D8] bg-white hover:bg-[#FAF9F5] hover:border-[#D5D1C7] text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-[#77766E] group-hover:text-[#25251F] transition-colors" />
                <span className="text-xs sm:text-sm font-medium text-[#25251F]">
                  {act.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#77766E] group-hover:text-[#25251F] group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

