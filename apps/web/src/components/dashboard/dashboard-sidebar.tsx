'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  CheckSquare,
  FileEdit,
  CheckCircle2,
  History,
  Boxes,
  FileText,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Sliders,
  BarChart2,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const navRoutes: Record<string, string> = {
  Dashboard: '/',
  Submissions: '/submissions',
  'Review Workspace': '/reviews',
  Approvals: '/approvals',
  'Decision History': '/decision-history',
  'Brand Setup': '/brand-setup',
  Guidelines: '/guidelines',
  'Knowledge Library': '/knowledge-library',
  'Conflict Detector': '/conflict-detector',
  'Claim Evidence': '/claim-evidence',
  'Guideline Improvements': '/guideline-improvements',
  Insights: '/insights',
  Settings: '/settings',
};

export function DashboardSidebar({
  mobileOpen = false,
  onMobileClose,
  activeItem = 'Dashboard',
  onNavigate,
}: SidebarProps) {
  const { t } = useLanguage();

  const workspaceNav = [
    { name: 'Dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { name: 'Submissions', label: t('nav.submissions', 'Submissions'), icon: CheckSquare },
    { name: 'Review Workspace', label: t('nav.reviews', 'Review Workspace'), icon: FileEdit },
    { name: 'Approvals', label: t('nav.approvals', 'Approvals'), icon: CheckCircle2 },
    { name: 'Decision History', label: t('nav.decisionHistory', 'Decision History'), icon: History },
  ];

  const brandNav = [
    { name: 'Brand Setup', label: t('nav.brandSetup', 'Brand Setup'), icon: Boxes },
    { name: 'Guidelines', label: t('nav.guidelines', 'Guidelines'), icon: FileText },
    { name: 'Knowledge Library', label: t('nav.knowledgeLibrary', 'Knowledge Library'), icon: BookOpen },
  ];

  const intelligenceNav = [
    { name: 'Conflict Detector', label: t('nav.conflictDetector', 'Conflict Detector'), icon: Sparkles },
    { name: 'Claim Evidence', label: t('nav.claimEvidence', 'Claim Evidence'), icon: ShieldCheck },
    { name: 'Guideline Improvements', label: t('nav.guidelineImprovements', 'Guideline Improvements'), icon: Sliders },
  ];

  const bottomNav = [
    { name: 'Insights', label: t('nav.insights', 'Insights'), icon: BarChart2 },
    { name: 'Settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  const handleItemClick = (name: string) => {
    if (onNavigate) onNavigate(name);
    if (onMobileClose) onMobileClose();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#F1EFE8] dark:bg-[#181714] border-r border-[#E5E1D8] dark:border-[#2C2B26] w-60 max-w-[calc(100vw-3rem)] py-5 px-4 select-none">
      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-7 px-2">
        <div className="flex items-center gap-2.5">
          {/* Isometric Cube Icon matching reference */}
          <div className="w-6 h-6 flex items-center justify-center text-[#25251F] dark:text-[#F7F5F0] flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-[#25251F] dark:text-[#F7F5F0]"
            >
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.236l6.764 3.757L12 11.75 5.236 7.993 12 4.236zM4.75 9.472L11 12.944v7.32l-6.25-3.472V9.472zm8 7.32v-7.32l6.25-3.472v7.32L12.75 16.792z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#25251F] dark:text-[#F7F5F0]">
            Evolyn
          </span>
        </div>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-[#77766E] dark:text-[#A09D92] hover:text-[#25251F] dark:hover:text-[#F7F5F0] hover:bg-[#E5E1D8] dark:hover:bg-[#262520] transition-colors touch-manipulation"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1 -mr-1">
        {/* Workspace */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] dark:text-[#A09D92] uppercase">
            {t('nav.workspace', 'Workspace')}
          </div>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              const route = navRoutes[item.name] || '#';
              return (
                <Link
                  key={item.name}
                  href={route}
                  prefetch={true}
                  onClick={() => handleItemClick(item.name)}
                  className={`group w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] dark:bg-[#2A2924] text-white dark:text-[#F7F5F0] shadow-xs font-semibold dark:border dark:border-[#3D3A32]'
                      : 'text-[#25251F] dark:text-[#A09D92] hover:bg-[#E8E5DD] dark:hover:bg-[#24231E] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white dark:text-[#F7F5F0]'
                        : 'text-[#77766E] dark:text-[#77766E] group-hover:text-[#25251F] dark:group-hover:text-[#F7F5F0]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Brand */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] dark:text-[#A09D92] uppercase">
            {t('nav.brand', 'Brand')}
          </div>
          <div className="space-y-0.5">
            {brandNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              const route = navRoutes[item.name] || '#';
              return (
                <Link
                  key={item.name}
                  href={route}
                  prefetch={true}
                  onClick={() => handleItemClick(item.name)}
                  className={`group w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] dark:bg-[#2A2924] text-white dark:text-[#F7F5F0] shadow-xs font-semibold dark:border dark:border-[#3D3A32]'
                      : 'text-[#25251F] dark:text-[#A09D92] hover:bg-[#E8E5DD] dark:hover:bg-[#24231E] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white dark:text-[#F7F5F0]'
                        : 'text-[#77766E] dark:text-[#77766E] group-hover:text-[#25251F] dark:group-hover:text-[#F7F5F0]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Intelligence */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] dark:text-[#A09D92] uppercase">
            {t('nav.intelligence', 'Intelligence')}
          </div>
          <div className="space-y-0.5">
            {intelligenceNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              const route = navRoutes[item.name] || '#';
              return (
                <Link
                  key={item.name}
                  href={route}
                  prefetch={true}
                  onClick={() => handleItemClick(item.name)}
                  className={`group w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] dark:bg-[#2A2924] text-white dark:text-[#F7F5F0] shadow-xs font-semibold dark:border dark:border-[#3D3A32]'
                      : 'text-[#25251F] dark:text-[#A09D92] hover:bg-[#E8E5DD] dark:hover:bg-[#24231E] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-white dark:text-[#F7F5F0]'
                        : 'text-[#77766E] dark:text-[#77766E] group-hover:text-[#25251F] dark:group-hover:text-[#F7F5F0]'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom items */}
        <div className="pt-2 border-t border-[#E5E1D8]/60 dark:border-[#2C2B26] space-y-0.5">
          {bottomNav.map((item) => {
            const isActive = activeItem === item.name;
            const Icon = item.icon;
            const route = navRoutes[item.name] || '#';
            return (
              <Link
                key={item.name}
                href={route}
                prefetch={true}
                onClick={() => handleItemClick(item.name)}
                className={`group w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-[#25251F] dark:bg-[#2A2924] text-white dark:text-[#F7F5F0] shadow-xs font-semibold dark:border dark:border-[#3D3A32]'
                    : 'text-[#25251F] dark:text-[#A09D92] hover:bg-[#E8E5DD] dark:hover:bg-[#24231E] hover:text-[#25251F] dark:hover:text-[#F7F5F0]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-white dark:text-[#F7F5F0]'
                      : 'text-[#77766E] dark:text-[#77766E] group-hover:text-[#25251F] dark:group-hover:text-[#F7F5F0]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Workspace Footer Profile */}
      <div className="pt-3 border-t border-[#E5E1D8] dark:border-[#2C2B26] mt-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#E8E5DD] dark:hover:bg-[#24231E] transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#E5E1D8] dark:bg-[#2A2924] border border-transparent dark:border-[#3D3A32] flex items-center justify-center font-medium text-xs text-[#25251F] dark:text-[#F7F5F0] flex-shrink-0">
              E
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[#25251F] dark:text-[#F7F5F0] leading-tight truncate">
                Evolyn Team
              </p>
              <p className="text-[11px] text-[#77766E] dark:text-[#A09D92] leading-tight truncate">
                Brand Workspace
              </p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#77766E] dark:text-[#A09D92] flex-shrink-0 ml-1" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sticky sidebar: in-flow flex item that never overlaps content */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen z-30">
        {content}
      </aside>

      {/* Mobile drawer backdrop and panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex shadow-2xl max-w-[85vw]">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
