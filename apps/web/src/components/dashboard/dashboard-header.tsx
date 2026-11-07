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
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-6 border-b border-[#E5E1D8]/70">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden mt-0.5 p-2 rounded-lg border border-[#E5E1D8] text-[#25251F] hover:bg-[#F1EFE8] transition-colors shrink-0 touch-manipulation"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-normal tracking-tight text-[#25251F] leading-tight break-words">
            Brand Governance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#77766E] mt-1 font-sans leading-relaxed">
            Review content, enforce guidelines, and keep your brand consistent with evidence.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3 self-stretch sm:self-center justify-between sm:justify-end shrink-0 pt-1 sm:pt-0">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative w-9 h-9 shrink-0 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] flex items-center justify-center text-[#25251F] hover:bg-[#F1EFE8] transition-colors shadow-xs touch-manipulation"
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
          className="bg-[#25251F] hover:bg-[#383832] text-white text-xs sm:text-sm font-medium px-3.5 py-2 min-h-[36px] rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors touch-manipulation"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>New Submission</span>
        </button>
      </div>
    </header>
  );
}

