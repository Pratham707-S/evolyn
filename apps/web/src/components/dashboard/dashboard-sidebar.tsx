'use client';

import React from 'react';
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

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

export function DashboardSidebar({
  mobileOpen = false,
  onMobileClose,
  activeItem = 'Dashboard',
  onNavigate,
}: SidebarProps) {
  const workspaceNav = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Submissions', icon: CheckSquare },
    { name: 'Review Workspace', icon: FileEdit },
    { name: 'Approvals', icon: CheckCircle2 },
    { name: 'Decision History', icon: History },
  ];

  const brandNav = [
    { name: 'Brand Setup', icon: Boxes },
    { name: 'Guidelines', icon: FileText },
    { name: 'Knowledge Library', icon: BookOpen },
  ];

  const intelligenceNav = [
    { name: 'Conflict Detector', icon: Sparkles },
    { name: 'Claim Evidence', icon: ShieldCheck },
    { name: 'Guideline Improvements', icon: Sliders },
  ];

  const bottomNav = [
    { name: 'Insights', icon: BarChart2 },
    { name: 'Settings', icon: Settings },
  ];

  const handleItemClick = (name: string) => {
    if (onNavigate) onNavigate(name);
    if (onMobileClose) onMobileClose();
  };

  const content = (
    <div className="flex flex-col h-full bg-[#F1EFE8] border-r border-[#E5E1D8] w-60 py-5 px-4 select-none">
      {/* Brand Logo */}
      <div className="flex items-center justify-between mb-7 px-2">
        <div className="flex items-center gap-2.5">
          {/* Isometric Cube Icon matching reference */}
          <div className="w-6 h-6 flex items-center justify-center text-[#25251F] flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-[#25251F]"
            >
              <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.236l6.764 3.757L12 11.75 5.236 7.993 12 4.236zM4.75 9.472L11 12.944v7.32l-6.25-3.472V9.472zm8 7.32v-7.32l6.25-3.472v7.32L12.75 16.792z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#25251F]">
            Evolyn
          </span>
        </div>

        {/* Mobile close button */}
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-1 rounded-md text-[#77766E] hover:text-[#25251F] hover:bg-[#E5E1D8]"
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
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] uppercase">
            Workspace
          </div>
          <div className="space-y-0.5">
            {workspaceNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] text-white shadow-sm'
                      : 'text-[#25251F] hover:bg-[#E8E5DD]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#77766E]'}`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] uppercase">
            Brand
          </div>
          <div className="space-y-0.5">
            {brandNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] text-white shadow-sm'
                      : 'text-[#25251F] hover:bg-[#E8E5DD]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#77766E]'}`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intelligence */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-semibold tracking-wider text-[#77766E] uppercase">
            Intelligence
          </div>
          <div className="space-y-0.5">
            {intelligenceNav.map((item) => {
              const isActive = activeItem === item.name;
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => handleItemClick(item.name)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-[#25251F] text-white shadow-sm'
                      : 'text-[#25251F] hover:bg-[#E8E5DD]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#77766E]'}`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom items */}
        <div className="pt-2 border-t border-[#E5E1D8]/60 space-y-0.5">
          {bottomNav.map((item) => {
            const isActive = activeItem === item.name;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleItemClick(item.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-[#25251F] text-white shadow-sm'
                    : 'text-[#25251F] hover:bg-[#E8E5DD]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#77766E]'}`}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Workspace Footer Profile */}
      <div className="pt-3 border-t border-[#E5E1D8] mt-2">
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#E8E5DD] transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-[#E5E1D8] flex items-center justify-center font-medium text-xs text-[#25251F] flex-shrink-0">
              E
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[#25251F] leading-tight truncate">
                Evolyn Team
              </p>
              <p className="text-[11px] text-[#77766E] leading-tight truncate">
                Brand Workspace
              </p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#77766E] flex-shrink-0 ml-1" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile drawer backdrop and panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}

