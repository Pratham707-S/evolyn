'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: number;
  key: string;
  label: string;
  description: string;
}

export interface BrandSetupStepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function BrandSetupStepper({
  steps,
  currentStep,
  onStepClick,
}: BrandSetupStepperProps) {
  return (
    <div className="w-full bg-[#FAF9F5] border border-[#E5E1D8] rounded-2xl p-3 sm:p-4 shadow-2xs overflow-x-auto no-scrollbar">
      <nav aria-label="Brand Setup Progress Steps" className="min-w-[620px] sm:min-w-0">
        <ol className="flex items-center justify-between gap-2 sm:gap-4">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isUpcoming = currentStep < step.id;

            return (
              <li
                key={step.id}
                className={`flex items-center ${
                  idx < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                {/* Step Pill Button */}
                <button
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all cursor-pointer group select-none ${
                    isCurrent
                      ? 'bg-[#FFFEFA] shadow-xs ring-1 ring-[#25251F]/10'
                      : 'hover:bg-[#F1EFE8]'
                  }`}
                >
                  {/* Step Number Circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0 ${
                      isCurrent
                        ? 'bg-[#25251F] text-white'
                        : isCompleted
                        ? 'bg-[#64816A] text-white'
                        : 'bg-[#FFFEFA] border border-[#D5D1C7] text-[#77766E]'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      step.id
                    )}
                  </span>

                  {/* Step Label */}
                  <span
                    className={`text-xs font-medium whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'text-[#25251F] font-semibold'
                        : isCompleted
                        ? 'text-[#25251F]'
                        : 'text-[#77766E] group-hover:text-[#25251F]'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connecting Divider Line */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-4 h-[1px] bg-[#E5E1D8]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-[#64816A]' : 'bg-transparent'
                      }`}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
