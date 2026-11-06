import React from 'react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#E8EBE1] border border-[#68745D]/20 animate-spin flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#68745D]" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="font-serif text-xl font-medium text-[#25251F] tracking-tight">
            Evolyn
          </h2>
          <p className="text-xs text-[#77766E] animate-pulse">
            Loading governance workspace...
          </p>
        </div>
      </div>
    </div>
  );
}

