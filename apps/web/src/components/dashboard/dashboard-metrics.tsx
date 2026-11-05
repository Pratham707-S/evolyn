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
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
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

  const items = metrics || defaultMetrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {items.map((m) => {
        const Icon = m.icon;
        const isUp = m.trend === 'up';
        const isNeedsChanges = m.id === 'needs-changes';

        return (
          <div
            key={m.id}
            className={`bg-[#FFFEFA] rounded-xl p-6 h-[188px] flex flex-col justify-start transition-colors ${
              isNeedsChanges
                ? 'border border-[#68745D]/50 hover:border-[#68745D]'
                : 'border border-[#E5E1D8] hover:border-[#68745D]/40'
            }`}
          >
            {/* 1. Icon (Consistent 20px size) */}
            <div className="w-5 h-5 flex items-center justify-center text-[#25251F]">
              <Icon className="w-5 h-5 text-[#25251F]" />
            </div>

            {/* 2. Metric Number (32-36px, Instrument Serif) */}
            <span className="font-serif text-[34px] font-normal text-[#25251F] leading-tight mt-3 tracking-tight block">
              {m.value}
            </span>

            {/* 3. Metric Label */}
            <span className="text-xs text-[#77766E] font-sans font-normal mt-1 block">
              {m.label}
            </span>

            {/* 4. Percentage Indicator (12-16px directly below label) */}
            <div className="mt-3.5 flex items-center gap-1 text-xs text-[#77766E] font-sans font-medium">
              {isUp ? (
                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{m.delta}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
