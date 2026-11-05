'use client';

import React from 'react';
import { Bell, Plus, Menu } from 'lucide-react';

interface DashboardHeaderProps {
  onNewSubmission: () => void;
  onOpenMobileSidebar?: () => void;
  unreadNotificationsCount?: number;
}

export function DashboardHeader({
  onNewSubmission,
  onOpenMobileSidebar,
  unreadNotificationsCount = 0,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E1D8]/70">
      <div className="flex items-start gap-3">
        {/* Mobile menu trigger */}
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden mt-1 p-1.5 rounded-lg border border-[#E5E1D8] text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="font-serif text-3xl sm:text-[34px] font-normal tracking-tight text-[#25251F] leading-tight">
            Brand Governance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77766E] mt-1 font-sans">
            Review content, enforce guidelines, and keep your brand consistent with evidence.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 self-start sm:self-center">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative w-9 h-9 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] flex items-center justify-center text-[#25251F] hover:bg-[#F1EFE8] transition-colors shadow-xs"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-[#25251F]" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B56E63]" />
          )}
        </button>

        {/* New Submission Button */}
        <button
          type="button"
          onClick={onNewSubmission}
          className="bg-[#25251F] hover:bg-[#383832] text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Submission</span>
        </button>
      </div>
    </header>
  );
}

