'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { BrandGovernanceContext } from '@evolyn/shared';

export interface SetupStepperBannerProps {
  currentModule: 'brand-setup' | 'guidelines' | 'knowledge-library';
}

export function useBrandSetupProgress() {
  return useQuery({
    queryKey: ['brand-governance', 'context'],
    queryFn: () => apiClient.get<BrandGovernanceContext>('/api/brand-governance/context'),
    staleTime: 10000,
  });
}

export function SetupStepperBanner({ currentModule }: SetupStepperBannerProps) {
  const router = useRouter();
  const { data: context } = useBrandSetupProgress();

  const isBrandSetupDone = Boolean(
    context?.brandSetup?.brandName && context.brandSetup.brandName.trim()
  );
  const isGuidelinesDone = Boolean(context?.rules && context.rules.length > 0);
  const isKnowledgeDone = Boolean(context?.facts && context.facts.length > 0);
  const isAllDone = isBrandSetupDone && isGuidelinesDone && isKnowledgeDone;

  const steps = [
    {
      id: 'brand-setup',
      label: 'Brand Setup',
      href: '/brand-setup',
      done: isBrandSetupDone,
      active: currentModule === 'brand-setup',
    },
    {
      id: 'guidelines',
      label: 'Brand Rules',
      href: '/guidelines',
      done: isGuidelinesDone,
      active: currentModule === 'guidelines',
    },
    {
      id: 'knowledge-library',
      label: 'Knowledge Library',
      href: '/knowledge-library',
      done: isKnowledgeDone,
      active: currentModule === 'knowledge-library',
    },
  ];

  const handleNextClick = () => {
    if (!isBrandSetupDone) {
      router.push('/brand-setup');
    } else if (!isGuidelinesDone) {
      router.push('/guidelines');
    } else if (!isKnowledgeDone) {
      router.push('/knowledge-library');
    } else {
      router.push('/reviews');
    }
  };

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs text-xs mb-4">
      {/* Step Sequence */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#77766E] dark:text-[#A09D92] mr-1">
          Governance Setup:
        </span>
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            {idx > 0 && (
              <span className="text-[#C5C2BA] dark:text-[#42413C] select-none text-[10px]">
                →
              </span>
            )}
            <button
              type="button"
              onClick={() => router.push(step.href)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                step.active
                  ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#18181B] font-semibold shadow-2xs'
                  : step.done
                  ? 'bg-[#EEF4EE] dark:bg-[#1A261C] text-[#36533D] dark:text-[#86EFAC] border border-[#D4DBC9] dark:border-[#2D4530]'
                  : 'bg-white dark:bg-[#262520] text-[#77766E] dark:text-[#A09D92] border border-[#E5E1D8] dark:border-[#2C2B26] hover:text-[#25251F]'
              }`}
            >
              {step.done ? (
                <Check className="w-3 h-3 text-[#4E6B54] dark:text-[#86EFAC] stroke-[3]" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              )}
              <span>{step.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Action / Next Target */}
      <button
        type="button"
        onClick={handleNextClick}
        className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs ${
          isAllDone
            ? 'bg-[#4E6B54] hover:bg-[#3E5643] text-white'
            : 'bg-[#25251F] hover:bg-[#383832] dark:bg-[#F7F5F0] dark:hover:bg-[#EAE6DF] text-white dark:text-[#18181B]'
        }`}
      >
        {isAllDone ? (
          <>
            <Sparkles className="w-3.5 h-3.5 text-[#E6C687]" />
            <span>Launch Review Workspace</span>
          </>
        ) : (
          <>
            <span>Next Setup Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </div>
  );
}

