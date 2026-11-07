'use client';

import React, { useRef } from 'react';
import {
  CheckCircle2,
  Edit3,
  XCircle,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AnimatedCounter } from '../../../components/ui/animated-counter';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export interface DecisionHistoryMetricsProps {
  total?: number;
  approved?: number;
  changesRequested?: number;
  rejected?: number;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export function DecisionHistoryMetrics({
  total = 499,
  approved = 448,
  changesRequested = 28,
  rejected = 7,
  activeFilter,
  onSelectFilter,
}: DecisionHistoryMetricsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cards = [
    {
      id: 'total',
      label: 'Total Decisions',
      value: total,
      trend: '↑ +12%',
      trendColor: 'text-[#64816A]',
      icon: CheckCircle2,
      filterValue: null,
      barColor: 'bg-[#DCD8CD]',
      activeBarColor: 'bg-[#68745D]',
      barHeights: [30, 45, 60, 80, 100],
    },
    {
      id: 'approved',
      label: 'Approved',
      value: approved,
      trend: '↑ +14%',
      trendColor: 'text-[#64816A]',
      icon: CheckCircle2,
      filterValue: 'Approved',
      barColor: 'bg-[#64816A]/30',
      activeBarColor: 'bg-[#64816A]',
      barHeights: [35, 50, 70, 85, 100],
    },
    {
      id: 'changesRequested',
      label: 'Requested Changes',
      value: changesRequested,
      trend: '↓ -18%',
      trendColor: 'text-[#B56E63]',
      icon: Edit3,
      filterValue: 'Changes Requested',
      barColor: 'bg-[#B78A4A]/30',
      activeBarColor: 'bg-[#B78A4A]',
      barHeights: [25, 40, 60, 75, 90],
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: rejected,
      trend: '↓ -42%',
      trendColor: 'text-[#B56E63]',
      icon: XCircle,
      filterValue: 'Rejected',
      barColor: 'bg-[#B56E63]/30',
      activeBarColor: 'bg-[#B56E63]',
      barHeights: [20, 35, 50, 65, 80],
    },
  ];

  // GSAP Signature Fluid Rising Bar Animation (identical to Dashboard Content Status & Compliance bars)
  useGSAP(
    () => {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      gsap.fromTo(
        '.decision-mini-bar',
        {
          scaleY: 0,
          opacity: 0,
          transformOrigin: 'bottom center',
        },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.95,
          stagger: 0.035,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.filterValue && card.filterValue !== null;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              if (onSelectFilter) {
                onSelectFilter(isSelected ? null : card.filterValue);
              }
            }}
            className={`text-left rounded-xl transition-all p-5 border text-[#25251F] group relative focus:outline-none focus-visible:ring-1 focus-visible:ring-[#68745D] flex items-center justify-between opacity-100 ${
              isSelected
                ? 'bg-[#FFFEFA] dark:bg-[#1E1D19] border-[#68745D] shadow-xs ring-1 ring-[#68745D]/20'
                : 'bg-[#FFFEFA] dark:bg-[#1E1D19] border-[#E5E1D8] dark:border-[#2C2B26] hover:border-[#68745D]/40'
            }`}
          >
            {/* Left Metrics Details */}
            <div className="space-y-1">
              <div className="w-5 h-5 flex items-center justify-center text-[#25251F] dark:text-[#F7F5F0]">
                <Icon className="w-5 h-5" />
              </div>

              <p className="text-xs text-[#77766E] dark:text-[#A09D92] font-medium pt-1">
                {card.label}
              </p>

              {/* Animated number from 0 */}
              <p className="font-serif text-3xl sm:text-[34px] font-normal text-[#25251F] dark:text-[#F7F5F0] tracking-tight leading-none">
                <AnimatedCounter value={card.value} duration={1.2} />
              </p>

              <p className={`text-[11px] font-medium pt-1 ${card.trendColor}`}>
                {card.trend}
              </p>
            </div>

            {/* Right Mini Bar Chart Graphic with GSAP growth */}
            <div className="w-20 h-10 flex items-end justify-end gap-1.5 shrink-0 pl-2">
              {card.barHeights.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`decision-mini-bar w-2 rounded-t-xs transition-colors origin-bottom ${
                    i === card.barHeights.length - 1
                      ? card.activeBarColor
                      : card.barColor
                  }`}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
