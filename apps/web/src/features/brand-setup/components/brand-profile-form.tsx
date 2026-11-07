'use client';

import React, { useRef } from 'react';
import {
  Upload,
  Trash2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface BrandProfileData {
  brandName: string;
  industry: string;
  description: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface BrandProfileFormProps {
  data: BrandProfileData;
  onChange: (updated: Partial<BrandProfileData>) => void;
  onNext: () => void;
  showToast: (msg: string) => void;
}

export function BrandProfileForm({
  data,
  onChange,
  onNext,
  showToast,
}: BrandProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file exceeds 2MB limit');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          onChange({ logoUrl: dataUrl });
          showToast(`Uploaded and persisted logo: ${file.name}`);
        }
      };
      reader.onerror = () => {
        showToast('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onChange({ logoUrl: '' });
    showToast('Removed custom logo. Reset to default brand emblem.');
  };

  const industries = [
    'Marketing Technology',
    'SaaS & Cloud Computing',
    'Enterprise Software',
    'Financial Services & Fintech',
    'Healthcare & Life Sciences',
    'E-commerce & Retail',
    'Media, Entertainment & Publishing',
    'Consumer Technology & Hardware',
    'Professional & Legal Services',
  ];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
      {/* 1. Form Header */}
      <div className="space-y-1">
        <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight">
          Brand Profile
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E]">
          Set up your brand's basic identity and key information.
        </p>
      </div>

      {/* 2. Brand Name & Industry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Brand Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#25251F]">
            Brand Name <span className="text-[#B56E63]">*</span>
          </label>
          <input
            type="text"
            value={data.brandName}
            onChange={(e) => onChange({ brandName: e.target.value })}
            placeholder="e.g. Evolyn"
            className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#25251F] transition-all"
            required
          />
        </div>

        {/* Industry */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-[#25251F]">
            Industry
          </label>
          <div className="relative">
            <select
              value={data.industry}
              onChange={(e) => onChange({ industry: e.target.value })}
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#25251F] transition-all appearance-none cursor-pointer"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#77766E]">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Brand Description Textarea */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#25251F]">
          Brand Description
        </label>
        <div className="relative">
          <textarea
            rows={3}
            maxLength={300}
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Describe your brand's mission, audience, and core value proposition..."
            className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl p-3.5 text-xs sm:text-sm text-[#25251F] transition-all resize-none leading-relaxed"
          />
        </div>
        <div className="flex justify-end">
          <span className="text-[11px] text-[#A09D92] font-mono">
            {data.description.length} / 300
          </span>
        </div>
      </div>

      {/* 4. Brand Logo & Brand Colors Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
        {/* Brand Logo Box (md:col-span-6) */}
        <div className="md:col-span-6 space-y-2">
          <label className="block text-xs font-semibold text-[#25251F]">
            Brand Logo
          </label>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Visual Logo Card */}
            <div className="h-16 w-full sm:w-44 bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl flex items-center justify-center p-3 shrink-0 shadow-2xs">
              {data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt={data.brandName}
                  className="max-h-10 max-w-full object-contain"
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
                  <span className="font-semibold text-base text-[#25251F] tracking-tight">
                    {data.brandName || 'Evolyn'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex sm:flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#FFFEFA] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#68745D]" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveLogo}
                className="bg-[#FFFEFA] hover:bg-[#FDEAEA]/50 border border-[#E5E1D8] text-[#77766E] hover:text-[#B56E63] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <div className="pt-1">
            <input
              type="text"
              value={data.logoUrl?.startsWith('data:') ? '' : data.logoUrl || ''}
              onChange={(e) => onChange({ logoUrl: e.target.value.trim() })}
              placeholder="Or paste image URL (https://...)"
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3 py-1.5 text-xs text-[#25251F] transition-all"
            />
          </div>
          <p className="text-[11px] text-[#A09D92]">
            PNG, JPG or SVG (max 2MB) or direct image URL
          </p>
        </div>

        {/* Primary Color (md:col-span-3) */}
        <div className="md:col-span-3 space-y-2">
          <label className="block text-xs font-semibold text-[#25251F]">
            Primary Brand Color
          </label>

          <div className="flex items-center gap-2.5 bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 rounded-xl p-2.5 transition-colors">
            {/* Color Swatch / Native Picker */}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 shadow-2xs">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
              />
              <div
                style={{ backgroundColor: data.primaryColor }}
                className="w-full h-full rounded-lg"
              />
            </div>

            <input
              type="text"
              value={data.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="w-full bg-transparent font-mono text-xs text-[#25251F] focus:outline-none uppercase"
            />
          </div>
        </div>

        {/* Secondary Color (md:col-span-3) */}
        <div className="md:col-span-3 space-y-2">
          <label className="block text-xs font-semibold text-[#25251F]">
            Secondary Color
          </label>

          <div className="flex items-center gap-2.5 bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 rounded-xl p-2.5 transition-colors">
            {/* Color Swatch / Native Picker */}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 shadow-2xs">
              <input
                type="color"
                value={data.secondaryColor}
                onChange={(e) => onChange({ secondaryColor: e.target.value })}
                className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0"
              />
              <div
                style={{ backgroundColor: data.secondaryColor }}
                className="w-full h-full rounded-lg"
              />
            </div>

            <input
              type="text"
              value={data.secondaryColor}
              onChange={(e) => onChange({ secondaryColor: e.target.value })}
              className="w-full bg-transparent font-mono text-xs text-[#25251F] focus:outline-none uppercase"
            />
          </div>
        </div>
      </div>

      {/* 5. Bottom Navigation Button */}
      <div className="flex justify-end pt-4 border-t border-[#E5E1D8]/60">
        <button
          type="button"
          onClick={onNext}
          className="bg-[#25251F] hover:bg-[#383832] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer hover:gap-2.5"
        >
          <span>Next: Brand Assets</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
