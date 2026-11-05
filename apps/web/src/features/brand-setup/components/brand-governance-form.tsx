'use client';

import React from 'react';
import { ArrowLeft, Check, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

export interface BrandGovernanceData {
  approvalStrategy: 'single' | 'dual' | 'automated';
  requireEvidence: boolean;
  blockCompetitors: boolean;
  enforcePalette: boolean;
  brandGuardianEmail: string;
  minComplianceScore: number;
}

export interface BrandGovernanceFormProps {
  data: BrandGovernanceData;
  onChange: (updated: Partial<BrandGovernanceData>) => void;
  onPrev: () => void;
  onPublish: () => void;
  showToast: (msg: string) => void;
}

export function BrandGovernanceForm({
  data,
  onChange,
  onPrev,
  onPublish,
  showToast,
}: BrandGovernanceFormProps) {
  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight">
          Brand Governance & Rules
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E]">
          Configure compliance automation, sign-off hierarchies, and brand guardian rules.
        </p>
      </div>

      {/* Review Flow Strategy Selection */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#25251F]">
          Approval Strategy
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Strategy 1: Single */}
          <button
            type="button"
            onClick={() => onChange({ approvalStrategy: 'single' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
              data.approvalStrategy === 'single'
                ? 'bg-[#FAF9F5] border-[#25251F] ring-1 ring-[#25251F] shadow-2xs'
                : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF9F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#25251F]">Standard</span>
              {data.approvalStrategy === 'single' && (
                <Check className="w-3.5 h-3.5 text-[#25251F] stroke-[2.5]" />
              )}
            </div>
            <p className="text-[11px] text-[#77766E] leading-snug">
              Single brand reviewer sign-off required for publishing.
            </p>
          </button>

          {/* Strategy 2: Dual */}
          <button
            type="button"
            onClick={() => onChange({ approvalStrategy: 'dual' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
              data.approvalStrategy === 'dual'
                ? 'bg-[#FAF9F5] border-[#25251F] ring-1 ring-[#25251F] shadow-2xs'
                : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF9F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#25251F]">Strict (Dual)</span>
              {data.approvalStrategy === 'dual' && (
                <Check className="w-3.5 h-3.5 text-[#25251F] stroke-[2.5]" />
              )}
            </div>
            <p className="text-[11px] text-[#77766E] leading-snug">
              Requires both Brand Guardian and Legal approvals.
            </p>
          </button>

          {/* Strategy 3: Fast-Track */}
          <button
            type="button"
            onClick={() => onChange({ approvalStrategy: 'automated' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
              data.approvalStrategy === 'automated'
                ? 'bg-[#FAF9F5] border-[#25251F] ring-1 ring-[#25251F] shadow-2xs'
                : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF9F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#25251F]">Fast-Track</span>
              {data.approvalStrategy === 'automated' && (
                <Check className="w-3.5 h-3.5 text-[#25251F] stroke-[2.5]" />
              )}
            </div>
            <p className="text-[11px] text-[#77766E] leading-snug">
              Auto-approve submissions with &ge;95% score and 0 high issues.
            </p>
          </button>
        </div>
      </div>

      {/* Automated Policy Toggles */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-[#25251F]">
          Automated Policy Enforcement
        </label>

        <div className="space-y-2.5">
          {/* Toggle 1: Evidence Citation */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] cursor-pointer hover:bg-[#F2EFE8] transition-colors">
            <input
              type="checkbox"
              checked={data.requireEvidence}
              onChange={(e) => onChange({ requireEvidence: e.target.checked })}
              className="mt-0.5 accent-[#25251F] rounded"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#25251F]">
                Mandatory Evidence Verification
              </p>
              <p className="text-[11px] text-[#77766E] mt-0.5 leading-snug">
                Flag any numeric metric or factual claim that lacks an approved citation in the Knowledge Library.
              </p>
            </div>
          </label>

          {/* Toggle 2: Competitor Interceptor */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] cursor-pointer hover:bg-[#F2EFE8] transition-colors">
            <input
              type="checkbox"
              checked={data.blockCompetitors}
              onChange={(e) => onChange({ blockCompetitors: e.target.checked })}
              className="mt-0.5 accent-[#25251F] rounded"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#25251F]">
                Competitor & Prohibited Terms Check
              </p>
              <p className="text-[11px] text-[#77766E] mt-0.5 leading-snug">
                Prevent unauthorized naming of direct competitors and unsubstantiated superlative claims.
              </p>
            </div>
          </label>

          {/* Toggle 3: Palette Strictness */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] cursor-pointer hover:bg-[#F2EFE8] transition-colors">
            <input
              type="checkbox"
              checked={data.enforcePalette}
              onChange={(e) => onChange({ enforcePalette: e.target.checked })}
              className="mt-0.5 accent-[#25251F] rounded"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#25251F]">
                Strict Visual Token Compliance
              </p>
              <p className="text-[11px] text-[#77766E] mt-0.5 leading-snug">
                Require published assets to strictly conform to registered brand hex codes and typography styles.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Brand Guardian Owner Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#25251F]">
            Primary Brand Guardian (Reviewer)
          </label>
          <input
            type="email"
            value={data.brandGuardianEmail}
            onChange={(e) => onChange({ brandGuardianEmail: e.target.value })}
            placeholder="guardian@evolyn.ai"
            className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#25251F] transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#25251F]">
            Auto-Approval Score Threshold ({data.minComplianceScore}%)
          </label>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="range"
              min={70}
              max={98}
              value={data.minComplianceScore}
              onChange={(e) =>
                onChange({ minComplianceScore: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#25251F] cursor-pointer"
            />
            <span className="font-mono text-xs font-semibold text-[#25251F] w-12 text-right">
              {data.minComplianceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E1D8]/60">
        <button
          type="button"
          onClick={onPrev}
          className="bg-[#FFFEFA] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Voice & Tone</span>
        </button>

        <button
          type="button"
          onClick={onPublish}
          className="bg-[#25251F] hover:bg-[#383832] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Publish Brand Setup</span>
        </button>
      </div>
    </div>
  );
}

