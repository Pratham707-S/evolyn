'use client';

import React from 'react';
import {
  Upload,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  Type,
  FileCheck,
} from 'lucide-react';

export interface BrandAssetsData {
  headerFont: string;
  bodyFont: string;
  mediaAssetsCount: number;
}

export interface BrandAssetsFormProps {
  data: BrandAssetsData;
  onChange: (updated: Partial<BrandAssetsData>) => void;
  onPrev: () => void;
  onNext: () => void;
  showToast: (msg: string) => void;
}

export function BrandAssetsForm({
  data,
  onChange,
  onPrev,
  onNext,
  showToast,
}: BrandAssetsFormProps) {
  const assetPacks = [
    { title: 'Primary Brand Emblem (Dark)', format: 'SVG • 24x24 px', status: 'Uploaded' },
    { title: 'Light Mode Wordmark', format: 'PNG • 480x120 px', status: 'Uploaded' },
    { title: 'App Icon / Favicon', format: 'ICO / SVG • 32x32 px', status: 'Uploaded' },
    { title: 'Social Share Card Template', format: 'JPG • 1200x630 px', status: 'Pending' },
  ];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
      <div className="space-y-1">
        <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight">
          Brand Assets & Typography
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E]">
          Configure approved media logos, graphic marks, and enterprise typography.
        </p>
      </div>

      {/* Asset Pack Checklist */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#25251F]">
          Approved Brand Marks & Media Kits
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assetPacks.map((asset, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#E8EBE1] flex items-center justify-center text-[#68745D] shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#25251F] truncate">{asset.title}</p>
                  <p className="text-[11px] text-[#A09D92]">{asset.format}</p>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  asset.status === 'Uploaded'
                    ? 'bg-[#EEF4EE] text-[#4E6B54] border border-[#D1E2D3]'
                    : 'bg-[#FDF4E7] text-[#865920] border border-[#F0D5B5]'
                }`}
              >
                {asset.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Hierarchy */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold text-[#25251F]">
          Typography System
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#77766E]">
              Editorial Display Font
            </span>
            <p className="font-serif text-xl text-[#25251F]">Instrument Serif</p>
            <p className="text-[11px] text-[#A09D92]">
              Used for headlines, editorial statements, and section intros.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#77766E]">
              Interface & Body Font
            </span>
            <p className="font-sans font-semibold text-lg text-[#25251F]">DM Sans</p>
            <p className="text-[11px] text-[#A09D92]">
              Used for clean readability across data tables, cards, and UI inputs.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E1D8]/60">
        <button
          type="button"
          onClick={onPrev}
          className="bg-[#FFFEFA] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Profile</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="bg-[#25251F] hover:bg-[#383832] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <span>Next: Voice & Tone</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
