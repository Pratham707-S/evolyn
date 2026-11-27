'use client';

import React from 'react';
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
  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      {/* Header & Percentage */}
      <div>
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <h3 className="font-semibold text-[#25251F]">Setup steps</h3>
          <span className="text-[#77766E]">
            Current step {Math.min(currentStep, steps.length)} of {steps.length}
          </span>
        </div>
      </div>

      {/* Step Checklist List */}
      <div className="space-y-4 pt-1">
        {steps.map((step) => {
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
                {isCurrent ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#25251F] bg-[#FFFEFA] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25251F]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-[#D5D1C7] bg-[#FFFEFA] flex items-center justify-center transition-colors group-hover:border-[#25251F]" />
                )}
              </div>

              {/* Title & Description */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold leading-tight transition-colors ${
                    isCurrent
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
