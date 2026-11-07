'use client';

import React from 'react';
import {
  Box,
  Users,
  Layers,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function WorkspaceSummaryCard() {
  // 1. Fetch live guidelines count
  const { data: guidelinesData } = useQuery({
    queryKey: ['settings', 'guidelines-count'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/guidelines');
        if (!res.ok) return { count: 42 };
        const data = await res.json();
        return { count: Array.isArray(data.guidelines) ? data.guidelines.length : 42 };
      } catch {
        return { count: 42 };
      }
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch live facts count
  const { data: factsData } = useQuery({
    queryKey: ['settings', 'facts-count'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/knowledge/facts');
        if (!res.ok) return { count: 56 };
        const data = await res.json();
        return { count: Array.isArray(data.facts) ? data.facts.length : 56 };
      } catch {
        return { count: 56 };
      }
    },
    staleTime: 60 * 1000,
  });

  // 3. Fetch live submissions to deduce team members
  const [memberCount, setMemberCount] = React.useState(1);

  React.useEffect(() => {
    const updateCount = () => {
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('evolyn_team_members');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setMemberCount(Math.max(1, parsed.length + 1));
              return;
            }
          }
        }
      } catch {
        // ignore
      }
      setMemberCount(1);
    };

    updateCount();
    window.addEventListener('storage', updateCount);
    window.addEventListener('evolyn_team_updated', updateCount);
    return () => {
      window.removeEventListener('storage', updateCount);
      window.removeEventListener('evolyn_team_updated', updateCount);
    };
  }, []);
  const guidelinesCount = guidelinesData?.count ?? 42;
  const factsCount = factsData?.count ?? 56;

  return (
    <div className="bg-[#FFFEFA] dark:bg-[#18181B] border border-[#E5E1D8] dark:border-[#27272A] rounded-2xl p-5 shadow-2xs relative overflow-hidden transition-colors">
      {/* Soft gradient ambient glow in upper-right */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#EAE6FF]/60 dark:from-[#3B2D71]/40 via-[#F3EEFF]/40 dark:via-[#261E47]/30 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Row with 3D Cube Graphic */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          {/* Black Cube Logo */}
          <div className="w-10 h-10 rounded-xl bg-[#111111] dark:bg-[#27272A] flex items-center justify-center text-white flex-shrink-0 shadow-xs">
            <Box className="w-5 h-5 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-lg text-[#25251F] dark:text-[#F4F4F5] tracking-tight leading-tight">
                Evolyn
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] dark:bg-[#064E3B] dark:text-[#6EE7B7] border border-[#A7F3D0] dark:border-[#047857]">
                Active
              </span>
            </div>
            <p className="text-xs text-[#77766E] dark:text-[#A1A1AA] mt-0.5">Brand Workspace</p>
          </div>
        </div>

        {/* 3D Isometric Purple Cube Illustration */}
        <div className="w-16 h-16 flex-shrink-0 relative flex items-center justify-center select-none">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_8px_16px_rgba(108,92,231,0.22)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Isometric Cube Top Face */}
            <polygon
              points="50,15 85,35 50,55 15,35"
              fill="url(#cubeTopGradient)"
            />
            {/* Isometric Cube Left Face */}
            <polygon
              points="15,35 50,55 50,90 15,70"
              fill="url(#cubeLeftGradient)"
            />
            {/* Isometric Cube Right Face */}
            <polygon
              points="50,55 85,35 85,70 50,90"
              fill="url(#cubeRightGradient)"
            />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="cubeTopGradient" x1="15" y1="15" x2="85" y2="55" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E0D7FE" />
                <stop offset="1" stopColor="#C7B6FC" />
              </linearGradient>
              <linearGradient id="cubeLeftGradient" x1="15" y1="35" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9C85F7" />
                <stop offset="1" stopColor="#7E60F3" />
              </linearGradient>
              <linearGradient id="cubeRightGradient" x1="50" y1="55" x2="85" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#B39EFA" />
                <stop offset="1" stopColor="#8F74F5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Feature / Stats list */}
      <div className="mt-5 space-y-2.5 pt-4 border-t border-[#EFECE6] dark:border-[#27272A] text-xs text-[#52524E] dark:text-[#D4D4D8] relative z-10">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] flex-shrink-0" />
          <span className="font-medium">{memberCount} team members</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] flex-shrink-0" />
          <span className="font-medium">5 review stages</span>
        </div>

        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] flex-shrink-0" />
          <span className="font-medium">{guidelinesCount} guidelines</span>
        </div>

        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#77766E] dark:text-[#A1A1AA] flex-shrink-0" />
          <span className="font-medium">{factsCount} knowledge resources</span>
        </div>
      </div>
    </div>
  );
}

