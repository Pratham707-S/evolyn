import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, icon, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        {icon && (
          <div className="absolute left-2.5 text-[#77766E] flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={cn(
            'appearance-none bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] text-xs sm:text-sm rounded-lg py-2 pr-8 transition-all hover:bg-[#F1EFE8]/50 focus:outline-none focus:border-[#68745D] cursor-pointer',
            icon ? 'pl-8' : 'pl-3',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2.5 text-[#77766E] pointer-events-none flex items-center">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

