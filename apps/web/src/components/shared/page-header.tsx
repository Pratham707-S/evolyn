'use client';

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAppShell } from '../layout/app-shell';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  showNotificationBell?: boolean;
  unreadNotificationsCount?: number;
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  actions,
  showNotificationBell = true,
  unreadNotificationsCount = 0,
  compact = false,
}: PageHeaderProps) {
  const { openMobileSidebar, showToast } = useAppShell();

  return (
    <header
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        compact ? 'pb-3 mb-1 shrink-0' : 'pb-6'
      } border-b border-[#E5E1D8]/70`}
    >
      <div className="flex items-start gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={openMobileSidebar}
          className="lg:hidden mt-1 p-1.5 rounded-lg border border-[#E5E1D8] text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1
            className={`font-serif ${
              compact ? 'text-2xl sm:text-[26px]' : 'text-3xl sm:text-[34px]'
            } font-normal tracking-tight text-[#25251F] leading-tight`}
          >
            {title}
          </h1>
          {description && (
            <p
              className={`${
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              } text-[#77766E] mt-0.5 font-sans`}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
        {showNotificationBell && (
          <button
            type="button"
            onClick={() => showToast('No new notifications')}
            className="relative w-9 h-9 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] flex items-center justify-center text-[#25251F] hover:bg-[#F1EFE8] transition-colors shadow-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-[#25251F]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#B56E63]" />
            )}
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}

