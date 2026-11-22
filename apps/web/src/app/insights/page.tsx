'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart2,
  TrendingUp,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ChevronDown,
  Layers,
  ArrowRight,
  Globe,
  Mail,
  Share2,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface GovernanceAnalyticsSummary {
  velocity: {
    totalSubmissions: number;
    avgAuditLatencySeconds: number;
    approvalRate: number;
    totalViolationsPrevented: number;
  };
  compliancePosture: {
    averageBrandScore: number;
    postureTier: string;
    rulesAudited: number;
    approvedFactsCount: number;
  };
  violationCategories: Array<{
    category: string;
    percentage: number;
    count: number;
  }>;
  channelPerformance: Array<{
    channel: string;
    submissionsCount: number;
    complianceScore: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    score: number;
    volume: number;
  }>;
}

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState('Last 6 Months');

  const {
    data: analytics,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<GovernanceAnalyticsSummary>({
    queryKey: ['insights', 'analytics'],
    queryFn: async () => {
      return apiClient.get<GovernanceAnalyticsSummary>('/api/insights/analytics');
    },
  });

  const velocity = analytics?.velocity || {
    totalSubmissions: 14,
    avgAuditLatencySeconds: 1.3,
    approvalRate: 84,
    totalViolationsPrevented: 12,
  };

  const posture = analytics?.compliancePosture || {
    averageBrandScore: 92.4,
    postureTier: 'ENTERPRISE GRADE A',
    rulesAudited: 11,
    approvedFactsCount: 4,
  };

  const categories = analytics?.violationCategories || [
    { category: 'Unsubstantiated Claims', percentage: 38, count: 5 },
    { category: 'Tone & Voice Deviations', percentage: 29, count: 4 },
    { category: 'Prohibited Terminology', percentage: 18, count: 2 },
    { category: 'Mandatory Disclaimers', percentage: 11, count: 1 },
    { category: 'Grammar & Quality', percentage: 4, count: 1 },
  ];

  const channels = analytics?.channelPerformance || [
    { channel: 'Website & App Copy', submissionsCount: 6, complianceScore: 94 },
    { channel: 'Email Campaigns', submissionsCount: 4, complianceScore: 89 },
    { channel: 'Social Media', submissionsCount: 3, complianceScore: 91 },
    { channel: 'Blog & Articles', submissionsCount: 1, complianceScore: 96 },
  ];

  const trend = analytics?.monthlyTrend || [
    { month: 'Jan', score: 82, volume: 14 },
    { month: 'Feb', score: 84, volume: 18 },
    { month: 'Mar', score: 87, volume: 24 },
    { month: 'Apr', score: 89, volume: 31 },
    { month: 'May', score: 92, volume: 38 },
    { month: 'Jun', score: 95, volume: 42 },
  ];

  return (
    <AppShell activeItem="Insights">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                Governance Insights & Velocity
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-[#EEF2EB] text-[#68745D] border border-[#D5DDD0] rounded-full">
                Telemetry Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#73736C] mt-1">
              Executive audit velocity, compliance posture telemetry, and risk distribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#F3F0E6] p-1 rounded-lg border border-[#E5E1D8] text-xs">
              {['Last 30 Days', 'Last 6 Months', 'All Time'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-white text-[#25251F] shadow-xs'
                      : 'text-[#73736C] hover:text-[#25251F]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-1.5 text-[#73736C] hover:text-[#25251F] hover:bg-[#F3F0E6] rounded-lg transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Brand Health Score</span>
              <ShieldCheck className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif text-[#25251F] font-semibold">
                {posture.averageBrandScore}%
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#68745D] bg-[#EEF2EB] px-1.5 py-0.5 rounded">
                +4.8%
              </span>
            </div>
            <p className="text-[11px] text-[#73736C] mt-1">{posture.postureTier}</p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Audit Velocity</span>
              <Zap className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif text-[#25251F] font-semibold">
                {velocity.avgAuditLatencySeconds}s
              </span>
              <span className="text-xs text-[#73736C]">avg runtime</span>
            </div>
            <p className="text-[11px] text-[#68745D] font-medium mt-1">
              Automated vs 48hr manual review
            </p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">First-Pass Approval</span>
              <CheckCircle2 className="w-4 h-4 text-[#68745D]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif text-[#25251F] font-semibold">
                {velocity.approvalRate}%
              </span>
              <span className="text-xs text-[#73736C]">clean drafts</span>
            </div>
            <p className="text-[11px] text-[#73736C] mt-1">
              Across {velocity.totalSubmissions} audited submissions
            </p>
          </div>

          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#73736C] mb-1">
              <span className="text-xs font-medium uppercase tracking-wider">Risks Prevented</span>
              <AlertTriangle className="w-4 h-4 text-[#B56E63]" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-serif text-[#B56E63] font-semibold">
                {velocity.totalViolationsPrevented}
              </span>
              <span className="text-xs text-[#73736C]">intercepted</span>
            </div>
            <p className="text-[11px] text-[#73736C] mt-1">Zero public corporate exposure</p>
          </div>
        </div>

        {/* Compliance Trajectory Curve (Visual SVG) */}
        <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#68745D]" />
                <h2 className="font-serif text-lg text-[#25251F]">
                  Brand Health & Compliance Trajectory
                </h2>
              </div>
              <p className="text-xs text-[#73736C]">
                Monthly governance score progression as team aligns with live guidelines.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#73736C]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#68745D]" />
                Compliance Score
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#E8E5DD]" />
                Audit Volume
              </span>
            </div>
          </div>

          {/* SVG Trend Graph */}
          <div className="h-44 w-full pt-4 flex flex-col justify-end">
            <div className="grid grid-cols-6 h-32 items-end gap-2 sm:gap-4 border-b border-[#E5E1D8] pb-1">
              {trend.map((point, idx) => {
                const barHeight = Math.round((point.score - 70) * 3.3); // Map score to height
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-semibold text-[#25251F] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.score}%
                    </span>
                    <div
                      className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-[#E2E8DD] to-[#68745D] transition-all duration-300 group-hover:brightness-95"
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-6 pt-2 text-center text-xs text-[#73736C]">
              {trend.map((point, idx) => (
                <div key={idx} className="font-medium">
                  {point.month}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-Column: Violation Breakdown & Channel Risk Radar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Violation Category Breakdown */}
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg text-[#25251F]">
                Violation Distribution by Type
              </h3>
              <p className="text-xs text-[#73736C]">
                Analysis of flagged issues across content reviews.
              </p>
            </div>

            <div className="space-y-3.5 pt-1">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#25251F]">{cat.category}</span>
                    <span className="text-[#73736C] font-semibold">
                      {cat.percentage}% ({cat.count} flags)
                    </span>
                  </div>
                  <div className="w-full bg-[#F3F0E6] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-[#B56E63]'
                          : idx === 1
                          ? 'bg-[#D97706]'
                          : idx === 2
                          ? 'bg-[#68745D]'
                          : 'bg-[#A3A39D]'
                      }`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5E1D8]/60 flex items-center justify-between text-xs">
              <span className="text-[#73736C]">Recurring mistakes can be refined at rule level.</span>
              <Link
                href="/guideline-improvements"
                className="inline-flex items-center gap-1 font-semibold text-[#68745D] hover:underline"
              >
                <span>Refine Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Channel Governance Performance */}
          <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-serif text-lg text-[#25251F]">
                Channel Governance Performance
              </h3>
              <p className="text-xs text-[#73736C]">
                Compliance adherence scores segmented by publication channel.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {channels.map((ch, idx) => {
                const Icon =
                  idx === 0
                    ? Globe
                    : idx === 1
                    ? Mail
                    : idx === 2
                    ? Share2
                    : FileText;

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9F5] border border-[#E5E1D8]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2EB] text-[#68745D] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#25251F]">
                          {ch.channel}
                        </div>
                        <div className="text-[11px] text-[#73736C]">
                          {ch.submissionsCount} submission{ch.submissionsCount === 1 ? '' : 's'} audited
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#68745D]">
                        {ch.complianceScore}%
                      </div>
                      <span className="text-[10px] text-[#73736C]">compliance</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E5E1D8]/60 flex items-center justify-between text-xs">
              <span className="text-[#73736C]">Fact check claims across all channels.</span>
              <Link
                href="/claim-evidence"
                className="inline-flex items-center gap-1 font-semibold text-[#68745D] hover:underline"
              >
                <span>Verify Claims</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Innovation Navigation Matrix */}
        <div className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#68745D]" />
            <h3 className="font-serif text-base text-[#25251F]">
              Evolyn Core AI Governance Pillars
            </h3>
          </div>
          <p className="text-xs text-[#73736C] max-w-2xl leading-relaxed">
            Evolyn pairs autonomous cross-rule contradiction audits with deterministic claim evidence grounding and closed-loop guideline refinement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Link
              href="/conflict-detector"
              className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#68745D] transition-colors group space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#25251F] group-hover:text-[#68745D]">
                <span>1. Conflict Detector</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#73736C]">
                Pairwise semantic contradiction and ambiguity detection.
              </p>
            </Link>

            <Link
              href="/claim-evidence"
              className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#68745D] transition-colors group space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#25251F] group-hover:text-[#68745D]">
                <span>2. Claim Evidence</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#73736C]">
                Evidence strength scoring & zero-hallucination citation.
              </p>
            </Link>

            <Link
              href="/guideline-improvements"
              className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#68745D] transition-colors group space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#25251F] group-hover:text-[#68745D]">
                <span>3. Guideline Improvements</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-[#73736C]">
                Recurring mistake tracking & 1-click rule refinement.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
