import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-[#F1EFE8] text-[#25251F] border-[#E5E1D8]',
    success: 'bg-[#E8EBE1] text-[#4E6B54] border-[#D4DBC9]',
    warning: 'bg-[#F5EFE6] text-[#8A6B3D] border-[#E8DEC9]',
    danger: 'bg-[#F7EBEA] text-[#9A4C42] border-[#E8CFCB]',
    info: 'bg-[#EBF0F5] text-[#4A6478] border-[#D1DCE6]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
