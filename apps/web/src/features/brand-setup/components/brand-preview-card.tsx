'use client';

import React from 'react';

export interface BrandPreviewCardProps {
  brandName: string;
  description: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

export function BrandPreviewCard({
  brandName,
  description,
  logoUrl,
  primaryColor,
  secondaryColor,
}: BrandPreviewCardProps) {
  const displayBrandName = brandName.trim() || 'Evolyn';
  const displayDescription =
    description.trim() ||
    "An AI-powered brand governance platform that helps marketing teams create on-brand, compliant, and evidence-backed content.";

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3.5">
      <h3 className="font-semibold text-xs sm:text-sm text-[#25251F]">
        Brand Preview
      </h3>

      {/* Soft Beige Preview Box */}
      <div className="bg-[#F8F6F1] border border-[#ECE8DF] rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Brand Logo & Name Header */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayBrandName}
              className="max-h-7 max-w-[120px] object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center text-[#25251F]">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-[#25251F]"
                >
                  <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.236l6.764 3.757L12 11.75 5.236 7.993 12 4.236zM4.75 9.472L11 12.944v7.32l-6.25-3.472V9.472zm8 7.32v-7.32l6.25-3.472v7.32L12.75 16.792z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-[#25251F] tracking-tight">
                {displayBrandName}
              </span>
            </div>
          )}
        </div>

        {/* Brand Description */}
        <p className="text-xs sm:text-[13px] text-[#4F4E48] leading-relaxed line-clamp-4">
          {displayDescription}
        </p>

        {/* Color Palette Swatches */}
        <div className="flex items-center gap-2.5 pt-1">
          {/* Primary Swatch */}
          <div
            title={`Primary Color: ${primaryColor}`}
            className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          />

          {/* Secondary Swatch */}
          <div
            title={`Secondary Color: ${secondaryColor}`}
            className="w-7 h-7 rounded-lg border border-black/10 shadow-2xs transition-transform hover:scale-105"
            style={{ backgroundColor: secondaryColor }}
          />
        </div>
      </div>
    </div>
  );
}

