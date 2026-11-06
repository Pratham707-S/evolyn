'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console without breaking client rendering
    console.error('Unhandled Evolyn workspace error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-8 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 rounded-xl bg-[#FDF4E7] border border-[#F0D5B5] text-[#B78A4A] mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 stroke-[2]" />
        </div>

        <div className="space-y-1.5">
          <h2 className="font-serif text-2xl text-[#25251F] tracking-tight">
            Something unexpected occurred
          </h2>
          <p className="text-xs text-[#77766E] leading-relaxed">
            {error?.message ||
              'A temporary application error occurred while loading this view.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25251F] hover:bg-[#383832] text-white text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F1EFE8] hover:bg-[#E5E1D8] text-[#25251F] text-xs font-medium transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#77766E]" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

