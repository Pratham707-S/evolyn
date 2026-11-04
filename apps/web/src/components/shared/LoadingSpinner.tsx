import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({
  className,
  size = 'md',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-2 text-slate-500" role="status">
      <Loader2 className={cn('animate-spin text-blue-600', sizeMap[size], className)} />
      {label && <span className="text-xs font-medium">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
