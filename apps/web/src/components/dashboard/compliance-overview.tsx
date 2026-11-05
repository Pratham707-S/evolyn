'use client';

import React, { useState, useRef } from 'react';
import { Info, ArrowUp, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

interface ComplianceOverviewProps {
  score?: number;
  delta?: number;
}

export function ComplianceOverview({
  score = 92.4,
  delta = 4.8,
}: ComplianceOverviewProps) {
  const [period, setPeriod] = useState('Last 6 months');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const periods = ['Last 30 days', 'Last 6 months', 'Last year', 'All time'];

  // Month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Bar heights under the curve to create the exact layered editorial bar distribution seen in the reference image
  // 36 vertical bars smoothly escalating from Jan to Jun
  const verticalBars = [
    12, 14, 15, 17, 18, 19, // Jan
    21, 23, 24, 26, 27, 28, // Feb
    29, 31, 32, 33, 34, 35, // Mar
    37, 39, 41, 44, 47, 50, // Apr
    54, 59, 64, 70, 76, 82, // May
    88, 93, 98, 104, 110, 115, // Jun
  ];

  // GSAP Entrance Animation
  useGSAP(
    () => {
      // Respect prefers-reduced-motion: if reduced motion is requested, render immediately in final state
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      const path = pathRef.current;
      if (!path) return;

      const pathLength = path.getTotalLength();
      if (!pathLength) return;

      const tl = gsap.timeline();

      // 1. Background vertical bars rise from the bottom baseline
      tl.fromTo(
        '.compliance-bar',
        { scaleY: 0, transformOrigin: 'bottom center' },
        {
          scaleY: 1,
          duration: 0.9,
          stagger: 0.02,
          ease: 'power2.out',
        },
        0
      );

      // 2. Main black compliance line draws progressively from left to right
      tl.fromTo(
        path,
        {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        },
        {
          strokeDashoffset: 0,
          duration: 1.3,
          ease: 'power2.inOut',
        },
        0.25
      );

      // 3. Metric percentage and supporting indicator fade in subtly
      tl.fromTo(
        '.compliance-metric',
        { opacity: 0, y: 4 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power1.out',
        },
        0.6
      );

      // 4. Month labels fade in subtly
      tl.fromTo(
        '.compliance-month-label',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power1.out',
        },
        0.75
      );
    },
    { scope: containerRef, dependencies: [score, delta] }
  );

  return (
    <div
      ref={containerRef}
      className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 flex flex-col justify-between"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base text-[#25251F]">
              Brand Compliance
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A09D92] bg-[#F1EFE8] px-1.5 py-0.5 rounded">
              Sample Data
            </span>
            <div
              className="group relative cursor-pointer"
              title="Sample data: illustrative brand compliance curve."
            >
              <Info className="w-3.5 h-3.5 text-[#A09D92] hover:text-[#25251F] transition-colors" />
            </div>
          </div>

          {/* Period selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#77766E] border border-[#E5E1D8] rounded-md bg-[#FFFEFA] hover:bg-[#F1EFE8] transition-colors"
            >
              <span>{period}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#77766E]" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg shadow-lg py-1 z-20">
                {periods.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      period === p
                        ? 'bg-[#E8EBE1] text-[#25251F] font-medium'
                        : 'text-[#77766E] hover:bg-[#F1EFE8]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Metric and delta */}
        <div className="compliance-metric mt-3 flex items-baseline gap-2.5">
          <span className="text-3xl font-semibold tracking-tight text-[#25251F] font-sans">
            {score.toFixed(1)}%
          </span>
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-[#E8EBE1] text-[#4E6B54]">
            <ArrowUp className="w-3 h-3 stroke-[2.5]" />
            <span>+{delta.toFixed(1)}%</span>
          </span>
        </div>
        <p className="text-xs text-[#77766E] mt-0.5">
          Overall content compliance
        </p>
      </div>

      {/* Visual Chart Area */}
      <div className="mt-6">
        <div className="w-full h-32 relative">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 500 140"
            preserveAspectRatio="none"
          >
            {/* Background vertical density bars matching reference */}
            {verticalBars.map((height, i) => {
              const x = 15 + i * (470 / (verticalBars.length - 1));
              return (
                <rect
                  key={i}
                  x={x - 3}
                  y={130 - height}
                  width="6"
                  height={height}
                  rx="1.5"
                  fill="#EDE9E0"
                  className="compliance-bar transition-colors duration-300 hover:fill-[#D8D2C5]"
                />
              );
            })}

            {/* Smooth main compliance curve */}
            <path
              ref={pathRef}
              d="M 15 118 C 90 110, 160 102, 230 96 C 300 90, 360 84, 410 50 C 440 28, 465 18, 485 15"
              fill="none"
              stroke="#25251F"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Month labels evenly aligned */}
        <div className="flex justify-between items-center text-xs text-[#77766E] mt-3 px-1 border-t border-[#E5E1D8]/40 pt-2">
          {months.map((m) => (
            <span key={m} className="compliance-month-label font-normal">
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
