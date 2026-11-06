import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'olive' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', children, ...props }, ref) => {
    const variantStyles = {
      primary:
        'bg-[#25251F] text-white hover:bg-[#383832] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
      secondary:
        'bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] hover:bg-[#F1EFE8] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
      outline:
        'border border-[#E5E1D8] bg-transparent text-[#25251F] hover:bg-[#F1EFE8] disabled:opacity-50 disabled:cursor-not-allowed',
      ghost:
        'bg-transparent text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] disabled:opacity-50 disabled:cursor-not-allowed',
      olive:
        'bg-[#68745D] text-white hover:bg-[#515B48] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
      danger:
        'bg-[#B56E63] text-white hover:bg-[#9E5B51] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed',
    };

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
      md: 'text-xs sm:text-sm px-3.5 py-2 rounded-lg gap-2',
      lg: 'text-sm sm:text-base px-4 py-2.5 rounded-xl gap-2.5',
      icon: 'w-9 h-9 p-0 rounded-lg justify-center',
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#68745D]',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

