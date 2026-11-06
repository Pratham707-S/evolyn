import React from 'react';
import type { DecisionType, SubmissionStatus } from '@evolyn/shared';
import { cn } from '../../../lib/utils/cn';

interface DecisionBadgeProps {
  decision?: DecisionType | SubmissionStatus | string | null;
  className?: string;
}

export function DecisionBadge({ decision, className }: DecisionBadgeProps) {
  if (!decision) return null;

  const normalized = decision.toUpperCase();

  let styles = 'bg-[#F1EFE8] text-[#25251F] border-[#E5E1D8]';
  let label = decision;

  if (normalized === 'APPROVED') {
    styles = 'bg-[#E8EBE1] text-[#4E6B54] border-[#D4DBC9]';
    label = 'Approved';
  } else if (normalized === 'REJECTED') {
    styles = 'bg-[#F7EBEA] text-[#9A4C42] border-[#E8CFCB]';
    label = 'Rejected';
  } else if (normalized === 'CHANGES_REQUESTED' || normalized === 'NEEDS CHANGES') {
    styles = 'bg-[#F5EFE6] text-[#8A6B3D] border-[#E8DEC9]';
    label = 'Changes Requested';
  } else if (normalized === 'REVIEWED') {
    styles = 'bg-[#EBF0F5] text-[#4A6478] border-[#D1DCE6]';
    label = 'Reviewed (Ready for Sign-off)';
  } else if (normalized === 'PENDING' || normalized === 'ANALYZING') {
    styles = 'bg-[#F1EFE8] text-[#77766E] border-[#E5E1D8]';
    label = normalized === 'ANALYZING' ? 'Analyzing' : 'Pending Review';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-tight transition-colors',
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}
