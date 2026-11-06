'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { StepItem } from './brand-setup-stepper';

export interface SetupProgressCardProps {
  steps: StepItem[];
  currentStep: number;
  onStepSelect: (stepId: number) => void;
}

export function SetupProgressCard({
  steps,
  currentStep,
  onStepSelect,
}: SetupProgressCardProps) {
  // Steps completed are those before currentStep (or step 1 is counted as in progress / 1 completed based on currentStep)
  // In the image: "1 of 4 completed" with "25%"
  const completedCount = Math.max(1, currentStep);
  const percentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header & Percentage */}
      <div>
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <h3 className="font-semibold text-[#25251F]">Setup Progress</h3>
          <span className="text-[#77766E]">
            {completedCount} of {steps.length} completed
          </span>
        </div>

        {/* Progress Bar with % indicator */}
        <div className="mt-3 relative">
          <div className="w-full h-1.5 bg-[#FAF9F5] border border-[#E5E1D8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#25251F] rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-end mt-1.5">
            <span className="text-[11px] font-medium text-[#77766E]">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Step Checklist List */}
      <div className="space-y-4 pt-1">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(step.id)}
              className="w-full flex items-start gap-3.5 text-left group cursor-pointer transition-colors"
            >
              {/* Step Status Indicator Icon */}
              <div className="pt-0.5 shrink-0">
                {isDone || isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-[#25251F] text-white flex items-center justify-center transition-transform group-hover:scale-105">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D5D1C7] bg-[#FFFEFA] flex items-center justify-center transition-colors group-hover:border-[#25251F]" />
                )}
              </div>

              {/* Title & Description */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold leading-tight transition-colors ${
                    isCurrent || isDone
                      ? 'text-[#25251F]'
                      : 'text-[#77766E] group-hover:text-[#25251F]'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-[#A09D92] mt-0.5 leading-snug">
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
