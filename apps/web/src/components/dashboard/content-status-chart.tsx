'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

interface ChannelStatusData {
  channel: string;
  approved: number; // percentage 0-100
  needsChanges: number; // percentage 0-100
}

interface ContentStatusChartProps {
  data?: ChannelStatusData[];
  isLoading?: boolean;
}

export function ContentStatusChart({ data, isLoading = false }: ContentStatusChartProps) {
  const [period, setPeriod] = useState('This week');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (isLoading) {
    return (
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-6 h-[278px] flex flex-col justify-between animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-40 h-4 bg-[#E5E1D8]/60 rounded" />
            <div className="w-52 h-3 bg-[#E5E1D8]/40 rounded" />
          </div>
          <div className="w-20 h-6 bg-[#E5E1D8]/40 rounded-lg" />
        </div>
        <div className="w-full h-36 bg-[#E5E1D8]/20 rounded-lg mt-auto flex items-end justify-around p-4 gap-4">
          {[40, 70, 55, 80, 60].map((h, i) => (
            <div key={i} className="w-8 bg-[#E5E1D8]/50 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const periods = ['This week', 'Last week', 'This month', 'This quarter'];

  const channels: ChannelStatusData[] = data || [
    { channel: 'Website', approved: 72, needsChanges: 24 },
    { channel: 'LinkedIn', approved: 65, needsChanges: 19 },
    { channel: 'Email', approved: 62, needsChanges: 19 },
    { channel: 'Ads', approved: 52, needsChanges: 22 },
    { channel: 'Blog', approved: 55, needsChanges: 17 },
  ];

  const yTicks = ['100%', '75%', '50%', '25%', '0%'];

  // GSAP Entrance Animation - Smooth & Fluid
  useGSAP(
    () => {
      // Respect prefers-reduced-motion: if reduced motion is requested, render immediately in final state
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }

      const tl = gsap.timeline();

      // 1. Approved bars rise gently from bottom baseline with opacity blend for fluid motion
      tl.fromTo(
        '.status-bar-approved',
        {
          scaleY: 0,
          opacity: 0,
          transformOrigin: 'bottom center',
        },
        {
          scaleY: 1,
          opacity: 1,
          duration: 1.25,
          stagger: 0.09,
          ease: 'power3.out',
        },
        0
      );

      // 2. Needs changes bars rise in a gentle coordinated wave
      tl.fromTo(
        '.status-bar-needs-changes',
        {
          scaleY: 0,
          opacity: 0,
          transformOrigin: 'bottom center',
        },
        {
          scaleY: 1,
          opacity: 1,
          duration: 1.2,
          stagger: 0.09,
          ease: 'power3.out',
        },
        0.08
      );

      // 3. Category labels fade in smoothly
      tl.fromTo(
        '.status-channel-label',
        { opacity: 0, y: 4 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: 'power2.out',
        },
        0.5
      );

      // 4. Legend appears smoothly after bars
      tl.fromTo(
        '.status-legend',
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.8
      );
    },
    { scope: containerRef, dependencies: [channels] }
  );

  return (
    <div
      ref={containerRef}
      className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 flex flex-col justify-between"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base text-[#25251F]">
              Content by Status
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A09D92] bg-[#F1EFE8] px-1.5 py-0.5 rounded">
              Sample Data
            </span>
          </div>

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
              <div className="absolute right-0 mt-1 w-32 bg-[#FFFEFA] border border-[#E5E1D8] rounded-lg shadow-lg py-1 z-20">
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
        <p className="text-xs text-[#77766E] mt-1 mb-4">
          Review outcomes for submitted content
        </p>
      </div>

      {/* Chart Body with Y-axis */}
      <div className="mt-2">
        <div className="flex gap-3 h-36">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-[10px] text-[#A09D92] py-1 select-none text-right w-7">
            {yTicks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>

          {/* Bars area */}
          <div className="flex-1 flex justify-around items-end border-b border-[#E5E1D8] pb-0 pt-2 px-1">
            {channels.map((item) => (
              <div
                key={item.channel}
                className="flex items-end gap-1.5 h-full group"
                title={`${item.channel}: ${item.approved}% Approved, ${item.needsChanges}% Needs changes`}
              >
                {/* Approved bar (dark charcoal) */}
                <div
                  className="status-bar-approved w-4 sm:w-5 bg-[#25251F] rounded-t-xs transition-colors duration-300 hover:bg-[#383832]"
                  style={{
                    height: `${item.approved}%`,
                    transformOrigin: 'bottom center',
                  }}
                />
                {/* Needs changes bar (light beige/cream) */}
                <div
                  className="status-bar-needs-changes w-4 sm:w-5 bg-[#EDE8DE] rounded-t-xs transition-colors duration-300 hover:bg-[#DDD6C8]"
                  style={{
                    height: `${item.needsChanges}%`,
                    transformOrigin: 'bottom center',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* X-axis Channel Labels */}
        <div className="flex justify-around items-center text-xs text-[#77766E] mt-2.5 pl-10 pr-2">
          {channels.map((item) => (
            <span
              key={item.channel}
              className="status-channel-label text-center font-normal"
            >
              {item.channel}
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="status-legend flex items-center gap-5 mt-4 pt-2.5 border-t border-[#E5E1D8]/40 pl-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#25251F] inline-block" />
            <span className="text-xs text-[#25251F] font-medium">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#EDE8DE] inline-block border border-[#E5E1D8]" />
            <span className="text-xs text-[#77766E]">Needs changes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
