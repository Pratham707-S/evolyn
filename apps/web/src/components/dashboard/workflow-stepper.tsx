'use client';

import React from 'react';
import {
  Upload,
  Sparkles,
  Layers,
  CheckCircle2,
  BarChart3,
  ArrowRight,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface WorkflowStepperProps {
  onStepClick?: (stepId: string) => void;
}

export function WorkflowStepper({ onStepClick }: WorkflowStepperProps) {
  const steps: WorkflowStep[] = [
    {
      id: 'submit',
      title: 'Submit Content',
      description: 'Add marketing content for review',
      icon: Upload,
    },
    {
      id: 'review',
      title: 'AI Review',
      description: 'Check against brand guidelines',
      icon: Sparkles,
    },
    {
      id: 'evidence',
      title: 'Get Evidence',
      description: 'See rule, source and claim support',
      icon: Layers,
    },
    {
      id: 'approval',
      title: 'Human Approval',
      description: 'Approve, reject or request changes',
      icon: CheckCircle2,
    },
    {
      id: 'improve',
      title: 'Improve Brand',
      description: 'Track patterns and refine guidelines',
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div
            key={step.id}
            onClick={() => onStepClick?.(step.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStepClick?.(step.id);
              }
            }}
            className="group bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 flex flex-col justify-between hover:border-[#68745D]/60 hover:shadow-xs transition-all cursor-pointer select-none text-left"
          >
            <div>
              <div className="w-6 h-6 flex items-center justify-center text-[#25251F]">
                <Icon className="w-4 h-4 text-[#25251F] group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-semibold text-sm text-[#25251F] mt-2.5 mb-1 tracking-tight">
                {step.title}
              </h3>
            </div>

            <div className="flex items-end justify-between gap-2 mt-2">
              <p className="text-xs text-[#77766E] leading-relaxed line-clamp-2">
                {step.description}
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-[#25251F] flex-shrink-0 group-hover:translate-x-1 transition-transform mb-0.5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

