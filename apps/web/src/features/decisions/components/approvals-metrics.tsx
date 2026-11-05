'use client';

import React, { useRef } from 'react';
import {
  CheckCircle2,
  Hourglass,
  Edit3,
  XCircle,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { AnimatedCounter } from '../../../components/ui/animated-counter';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export interface ApprovalsMetricsProps {
  approved?: number;
  pending?: number;
  changesRequested?: number;
  rejected?: number;
  activeFilter?: string | null;
  onSelectFilter?: (filter: string | null) => void;
}

export function ApprovalsMetrics({
  approved = 448,
  pending = 16,
  changesRequested = 28,
  rejected = 7,
  activeFilter,
  onSelectFilter,
}: ApprovalsMetricsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const cards = [
    {
      id: 'approved',
      label: 'Approved',
      value: approved,
      trend: '↑ +14%',
      trendColor: 'text-[#64816A]',
      icon: CheckCircle2,
      filterValue: 'Approved',
      sparklineColor: '#64816A',
      sparklinePath: 'M0,26 C30,28 50,22 75,14 C95,8 105,4 120,2',
      gradientId: 'approvedGrad',
    },
    {
      id: 'pending',
      label: 'Pending Approval',
      value: pending,
      trend: '↑ +33%',
      trendColor: 'text-[#64816A]',
      icon: Hourglass,
      filterValue: 'Pending',
      sparklineColor: '#B78A4A',
      sparklinePath: 'M0,26 C35,26 55,20 75,12 C95,6 108,4 120,3',
      gradientId: 'pendingGrad',
    },
    {
      id: 'changesRequested',
      label: 'Requested Changes',
      value: changesRequested,
      trend: '↓ -18%',
      trendColor: 'text-[#B56E63]',
      icon: Edit3,
      filterValue: 'Changes Requested',
      sparklineColor: '#B56E63',
      sparklinePath: 'M0,22 C20,18 35,28 60,20 C85,12 100,22 120,12',
      gradientId: 'changesGrad',
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: rejected,
      trend: '↓ -42%',
      trendColor: 'text-[#B56E63]',
      icon: XCircle,
      filterValue: 'Rejected',
      sparklineColor: '#B56E63',
      sparklinePath: 'M0,24 C20,20 40,28 65,18 C85,10 100,24 120,14',
      gradientId: 'rejectedGrad',
    },
  ];

  // GSAP Signature Line-Drawing Graph Animation (identical to Dashboard Compliance curve)
  useGSAP(
    () => {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      const paths = containerRef.current?.querySelectorAll<SVGPathElement>('.sparkline-path');
      if (paths && paths.length > 0) {
        paths.forEach((p, idx) => {
          const len = p.getTotalLength?.() || 150;
          gsap.fromTo(
            p,
            {
              strokeDasharray: len,
              strokeDashoffset: len,
            },
            {
              strokeDashoffset: 0,
              duration: 1.3,
              delay: 0.1 + idx * 0.12,
              ease: 'power2.inOut',
            }
          );
        });
      }

      // Smooth subtle gradient area fill reveal under each curve
      gsap.fromTo(
        '.sparkline-area',
        {
          opacity: 0,
          scaleY: 0.3,
          transformOrigin: 'bottom center',
        },
        {
          opacity: 1,
          scaleY: 1,
          duration: 1.1,
          stagger: 0.12,
          delay: 0.25,
          ease: 'power2.out',
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
        const isSelected = activeFilter === card.filterValue;

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
                ? 'bg-[#FFFEFA] border-[#68745D] shadow-xs ring-1 ring-[#68745D]/20'
                : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40'
            }`}
          >
            {/* Left Metrics Details */}
            <div className="space-y-1">
              <div className="w-5 h-5 flex items-center justify-center text-[#25251F]">
                <Icon className="w-5 h-5" />
              </div>

              <p className="text-xs text-[#77766E] font-medium pt-1">
                {card.label}
              </p>

              {/* Animated number from 0 */}
              <p className="font-serif text-3xl sm:text-[34px] font-normal text-[#25251F] tracking-tight leading-none">
                <AnimatedCounter value={card.value} duration={1.2} />
              </p>

              <p className={`text-[11px] font-medium pt-1 ${card.trendColor}`}>
                {card.trend}
              </p>
            </div>

            {/* Right Sparkline Graphic with GSAP safe growth */}
            <div className="w-24 h-12 flex items-end justify-end shrink-0 pl-2">
              <svg
                viewBox="0 0 120 32"
                className="sparkline-svg w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id={card.gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={card.sparklineColor}
                      stopOpacity="0.25"
                    />
                    <stop
                      offset="100%"
                      stopColor={card.sparklineColor}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                {/* Area fill */}
                <path
                  className="sparkline-area"
                  d={`${card.sparklinePath} L120,32 L0,32 Z`}
                  fill={`url(#${card.gradientId})`}
                />
                {/* Curve stroke */}
                <path
                  className="sparkline-path"
                  d={card.sparklinePath}
                  fill="none"
                  stroke={card.sparklineColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
