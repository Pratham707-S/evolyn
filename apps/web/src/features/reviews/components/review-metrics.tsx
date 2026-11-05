'use client';

import React from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { AnimatedCounter } from '../../../components/ui/animated-counter';

export interface ReviewMetricsProps {
  inReview?: number;
  withFindings?: number;
  readyForDecision?: number;
  avgTime?: string;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export function ReviewMetrics({
  inReview = 12,
  withFindings = 28,
  readyForDecision = 16,
  avgTime = '4.2 min',
  activeFilter,
  onSelectFilter,
}: ReviewMetricsProps) {
  const cards = [
    {
      id: 'inReview',
      label: 'In Review',
      value: inReview,
      icon: Layers,
      trend: '↓ -20% vs. last 30 days',
      trendColor: 'text-[#77766E]',
      filterValue: 'In Review',
      decimals: 0,
      suffix: '',
    },
    {
      id: 'withFindings',
      label: 'With Findings',
      value: withFindings,
      icon: AlertTriangle,
      trend: '↓ -18% vs. last 30 days',
      trendColor: 'text-[#B56E63]',
      filterValue: 'With Findings',
      decimals: 0,
      suffix: '',
    },
    {
      id: 'readyForDecision',
      label: 'Ready for Decision',
      value: readyForDecision,
      icon: CheckCircle2,
      trend: '↑ +33% vs. last 30 days',
      trendColor: 'text-[#64816A]',
      filterValue: 'Ready for Decision',
      decimals: 0,
      suffix: '',
    },
    {
      id: 'avgTime',
      label: 'Avg. Review Time',
      value: avgTime,
      icon: Zap,
      trend: '↓ -35% vs. last 30 days',
      trendColor: 'text-[#64816A]',
      filterValue: null,
      decimals: 1,
      suffix: ' min',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterValue && card.filterValue !== null;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              if (card.filterValue && onSelectFilter) {
                onSelectFilter(isSelected ? null : card.filterValue);
              }
            }}
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

            {/* Big Metric Number (GSAP Animated from 0) */}
            <p className="font-serif text-3xl sm:text-[34px] font-normal text-[#25251F] tracking-tight leading-none mt-1">
              <AnimatedCounter
                value={card.value}
                decimals={card.decimals}
                suffix={card.suffix}
                duration={1.2}
              />
            </p>

            {/* Trend */}
            <p className={`text-[11px] font-medium mt-3 flex items-center gap-1 ${card.trendColor}`}>
              {card.trend}
            </p>
          </button>
        );
      })}
    </div>
  );
}
