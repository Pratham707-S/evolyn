'use client';

import React from 'react';
import {
  FileText,
  Check,
  AlertTriangle,
  Layers,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { AnimatedCounter } from '../ui/animated-counter';

export interface MetricCardData {
  id: string;
  label: string;
  value: number | string;
  delta: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
}

interface DashboardMetricsProps {
  metrics?: MetricCardData[];
  isLoading?: boolean;
}

export function DashboardMetrics({ metrics, isLoading = false }: DashboardMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 min-h-[160px] sm:min-h-[175px] flex flex-col justify-between animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded bg-[#E5E1D8]/60" />
              <div className="w-12 h-4 rounded bg-[#E5E1D8]/40" />
            </div>
            <div className="space-y-2 mt-2">
              <div className="w-16 h-8 rounded bg-[#E5E1D8]/70" />
              <div className="w-28 h-3.5 rounded bg-[#E5E1D8]/50" />
            </div>
            <div className="w-28 h-3 rounded bg-[#E5E1D8]/40" />
          </div>
        ))}
      </div>
    );
  }

  const defaultMetrics: MetricCardData[] = [
    {
      id: 'reviewed',
      label: 'Content reviewed',
      value: '486',
      delta: '+12%',
      trend: 'up',
      icon: FileText,
    },
    {
      id: 'approved',
      label: 'Approved',
      value: '448',
      delta: '+14%',
      trend: 'up',
      icon: Check,
    },
    {
      id: 'needs-changes',
      label: 'Needs changes',
      value: '28',
      delta: '-18%',
      trend: 'down',
      icon: AlertTriangle,
    },
    {
      id: 'violations',
      label: 'Critical violations',
      value: '7',
      delta: '-42%',
      trend: 'down',
      icon: Layers,
    },
  ];

  const isLive = Boolean(metrics);
  const items = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
      {items.map((m) => {
        const Icon = m.icon;
        const isUp = m.trend === 'up';
        const isNeedsChanges = m.id === 'needs-changes';

        return (
          <div
            key={m.id}
            className={`bg-[#FFFEFA] rounded-xl p-4 sm:p-5 min-h-[160px] sm:min-h-[175px] flex flex-col justify-between transition-colors opacity-100 ${
              isNeedsChanges
                ? 'border border-[#68745D]/50 hover:border-[#68745D]'
                : 'border border-[#E5E1D8] hover:border-[#68745D]/40'
            }`}
          >
            {/* 1. Icon and Status Pill */}
            <div className="flex items-center justify-between text-[#25251F]">
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#25251F]" />
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isLive
                    ? 'text-[#4E6B54] bg-[#EEF4EE] border border-[#D4DBC9]'
                    : 'text-[#A09D92] bg-[#F1EFE8]'
                }`}
              >
                {isLive ? 'Live' : 'Sample'}
              </span>
            </div>

            <div>
              {/* 2. Metric Number (Animated with GSAP from 0) */}
              <span className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-normal text-[#25251F] leading-tight mt-2 sm:mt-3 tracking-tight block">
                <AnimatedCounter value={m.value} duration={1.2} />
              </span>

              {/* 3. Metric Label */}
              <span className="text-xs text-[#77766E] font-sans font-normal mt-0.5 sm:mt-1 block truncate">
                {m.label}
              </span>
            </div>

            {/* 4. Percentage Indicator */}
            <div className="mt-2.5 sm:mt-3.5 flex items-center gap-1 text-[11px] sm:text-xs text-[#77766E] font-sans font-medium truncate">
              {isUp ? (
                <ArrowUp className="w-3 h-3 stroke-[2.5] shrink-0" />
              ) : (
                <ArrowDown className="w-3 h-3 stroke-[2.5] shrink-0" />
              )}
              <span className="truncate">{m.delta} vs. last 30 days</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
