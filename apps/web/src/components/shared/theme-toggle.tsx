'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-context';
import { cn } from '@/lib/utils/cn';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'switch';
}

export function ThemeToggle({ className, variant = 'button' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
          isDark ? 'bg-[#3A3831]' : 'bg-[#E5E1D8]',
          className
        )}
      >
        <span
          className={cn(
            'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center',
            isDark ? 'translate-x-5 bg-[#1C1B18]' : 'translate-x-0 bg-white'
          )}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-[#E5A855]" />
          ) : (
            <Sun className="w-3 h-3 text-[#F59E0B]" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'w-9 h-9 rounded-lg border border-[#E5E1D8] dark:border-[#2C2B26] bg-[#FFFEFA] dark:bg-[#1E1D19] flex items-center justify-center text-[#25251F] dark:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#262520] transition-all shadow-xs cursor-pointer select-none active:scale-95 group shrink-0',
        className
      )}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#F59E0B] transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#25251F] transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
}

