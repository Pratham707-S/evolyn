'use client';

import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AnimatedCounter } from '../../../components/ui/animated-counter';

export interface SubmissionsMetricsProps {
  total: number;
  pending: number;
  approved: number;
  needsChanges: number;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export function SubmissionsMetrics({
  total = 486,
  pending = 12,
  approved = 448,
  needsChanges = 28,
  activeFilter,
  onSelectFilter,
}: SubmissionsMetricsProps) {
  const cards = [
    {
      id: 'total',
      label: 'Total Submissions',
      value: total,
      icon: FileText,
      trend: '↑ +12% vs. last 30 days',
      trendColor: 'text-[#64816A]',
      filterValue: null,
    },
    {
      id: 'pending',
      label: 'Pending Review',
      value: pending,
      icon: Clock,
      trend: '↓ -20% vs. last 30 days',
      trendColor: 'text-[#77766E]',
      filterValue: 'Pending Review',
    },
    {
      id: 'approved',
      label: 'Approved',
      value: approved,
      icon: CheckCircle2,
      trend: '↑ +14% vs. last 30 days',
      trendColor: 'text-[#64816A]',
      filterValue: 'Approved',
    },
    {
      id: 'needsChanges',
      label: 'Needs Changes',
      value: needsChanges,
      icon: AlertTriangle,
      trend: '↓ -18% vs. last 30 days',
      trendColor: 'text-[#B56E63]',
      filterValue: 'Needs Changes',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.filterValue === null && !activeFilter) ||
          activeFilter === card.filterValue;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter && onSelectFilter(card.filterValue)}
            className={`text-left rounded-xl transition-all p-5 border text-[#25251F] group relative focus:outline-none focus-visible:ring-1 focus-visible:ring-[#68745D] opacity-100 ${
              isSelected
                ? 'bg-[#FFFEFA] border-[#68745D] shadow-xs ring-1 ring-[#68745D]/20'
                : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40'
            }`}
          >
            {/* Top row: Icon & Right arrow */}
            <div className="flex items-center justify-between text-[#25251F]">
              <div className="w-5 h-5 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[#25251F]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#77766E] group-hover:translate-x-0.5 group-hover:text-[#25251F] transition-all" />
            </div>

            {/* Label */}
            <p className="text-xs text-[#77766E] font-medium mt-3.5">
              {card.label}
            </p>

            {/* Metric Number (GSAP Animated from 0) */}
            <p className="font-serif text-3xl sm:text-[34px] font-normal text-[#25251F] tracking-tight leading-none mt-1">
              <AnimatedCounter value={card.value} duration={1.2} />
            </p>

            {/* Trend percentage */}
            <p
              className={`text-[11px] font-medium mt-3 flex items-center gap-1 ${card.trendColor}`}
            >
              {card.trend}
            </p>
          </button>
        );
      })}
    </div>
  );
}
