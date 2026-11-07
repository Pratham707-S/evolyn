'use client';

import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Sparkles, Wand2, Plus } from 'lucide-react';

export function ReviewWorkspaceSkeleton() {
  return (
    <div className="h-full flex flex-col gap-3 min-h-0 animate-pulse">
      {/* 1. Page Header */}
      <PageHeader
        title="Review Workspace"
        description="Review and refine content with grounded Evolyn brand intelligence, compliance auditing, and evidence."
        showNotificationBell={true}
        compact={true}
        actions={
          <div className="bg-[#25251F]/60 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-not-allowed shadow-xs opacity-70">
            <Plus className="w-3.5 h-3.5" />
            <span>New Review</span>
          </div>
        }
      />

      {/* 2. 3-Column AI Writing & Review Studio Skeleton */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-5 overflow-hidden">
        {/* Left Column: Tools Skeleton */}
        <div className="hidden lg:flex lg:flex-col w-48 xl:w-56 shrink-0 h-full overflow-hidden space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-[#E5E1D8] rounded-md" />
            <div className="h-3 w-40 bg-[#E5E1D8]/60 rounded-md" />
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Center Column: TipTap Interactive Editor Canvas Skeleton */}
        <div className="flex-1 min-w-0 h-full flex flex-col bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl shadow-xs overflow-hidden">
          {/* Header bar skeleton */}
          <div className="px-4 py-3 border-b border-[#E5E1D8] bg-[#FAF8F5]/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-48 bg-[#E5E1D8] rounded-md" />
              <div className="h-4 w-16 bg-[#E8EBE1] rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-28 bg-[#FAF9F5] border border-[#E5E1D8] rounded-lg" />
              <div className="h-7 w-24 bg-[#25251F]/40 rounded-lg" />
            </div>
          </div>

          {/* Formatting Toolbar skeleton */}
          <div className="px-4 py-2 border-b border-[#E5E1D8] bg-[#FAF8F5]/20 flex items-center gap-2">
            <div className="h-6 w-14 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-6 w-14 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-6 w-20 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-6 w-20 bg-[#E5E1D8]/60 rounded-md" />
          </div>

          {/* Content area skeleton lines */}
          <div className="p-6 space-y-3.5 flex-1 overflow-hidden">
            <div className="h-6 w-3/4 bg-[#E5E1D8] rounded-md mb-4" />
            <div className="h-4 w-full bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-4 w-5/6 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-4 w-4/5 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-4 w-full bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-5 w-1/2 bg-[#E5E1D8] rounded-md my-4" />
            <div className="h-4 w-11/12 bg-[#E5E1D8]/60 rounded-md" />
            <div className="h-4 w-3/4 bg-[#E5E1D8]/60 rounded-md" />
          </div>
        </div>

        {/* Right Column: AI Findings Panel Skeleton */}
        <div className="hidden lg:flex lg:flex-col w-72 xl:w-[350px] shrink-0 h-full overflow-hidden space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 bg-[#E5E1D8] rounded-md" />
              <div className="h-4 w-12 bg-[#E8EBE1] rounded-full" />
            </div>
            <div className="h-3 w-48 bg-[#E5E1D8]/60 rounded-md" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-12 bg-[#25251F]/40 rounded-full" />
            <div className="h-6 w-16 bg-[#E5E1D8]/60 rounded-full" />
            <div className="h-6 w-16 bg-[#E5E1D8]/60 rounded-full" />
            <div className="h-6 w-16 bg-[#E5E1D8]/60 rounded-full" />
          </div>

          {/* Card Skeletons */}
          <div className="space-y-2.5 flex-1">
            <div className="p-3.5 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-[#FBEBE8] rounded-md" />
                <div className="h-3 w-10 bg-[#E5E1D8] rounded-md" />
              </div>
              <div className="h-3 w-full bg-[#E5E1D8]/60 rounded-md" />
              <div className="h-3 w-4/5 bg-[#E5E1D8]/60 rounded-md" />
            </div>

            <div className="p-3.5 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-[#FDF9F0] rounded-md" />
                <div className="h-3 w-10 bg-[#E5E1D8] rounded-md" />
              </div>
              <div className="h-3 w-full bg-[#E5E1D8]/60 rounded-md" />
              <div className="h-3 w-3/4 bg-[#E5E1D8]/60 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

