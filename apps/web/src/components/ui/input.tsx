import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 text-[#A09D92] flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] placeholder:text-[#A09D92] text-xs sm:text-sm rounded-lg py-2 transition-all focus:outline-none focus:border-[#68745D] focus:ring-1 focus:ring-[#68745D]',
            icon ? 'pl-9 pr-3' : 'px-3',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

