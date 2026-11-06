'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, X } from 'lucide-react';

export interface BrandVoiceData {
  formality: number; // 1-5 (1: Formal, 5: Casual)
  boldness: number; // 1-5 (1: Understated, 5: Bold)
  accessibility: number; // 1-5 (1: Deep Technical, 5: Plain Language)
  toneDescriptors: string[];
  dos: string[];
  donts: string[];
}

export interface BrandVoiceFormProps {
  data: BrandVoiceData;
  onChange: (updated: Partial<BrandVoiceData>) => void;
  onPrev: () => void;
  onNext: () => void;
  showToast: (msg: string) => void;
}

const AVAILABLE_DESCRIPTORS = [
  'Authoritative',
  'Precise',
  'Modern',
  'Empathetic',
  'Confident',
  'Accessible',
  'Direct',
  'Visionary',
  'Subtle',
  'Insightful',
];

export function BrandVoiceForm({
  data,
  onChange,
  onPrev,
  onNext,
  showToast,
}: BrandVoiceFormProps) {
  const toggleDescriptor = (descriptor: string) => {
    const exists = data.toneDescriptors.includes(descriptor);
    if (exists) {
      onChange({
        toneDescriptors: data.toneDescriptors.filter((d) => d !== descriptor),
      });
    } else {
      if (data.toneDescriptors.length >= 5) {
        showToast('You can select up to 5 tone descriptors');
        return;
      }
      onChange({
        toneDescriptors: [...data.toneDescriptors, descriptor],
      });
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-serif text-2xl sm:text-[26px] font-normal text-[#25251F] tracking-tight">
          Voice & Tone
        </h2>
        <p className="text-xs sm:text-sm text-[#77766E]">
          Configure brand personality dimensions, tone spectrum, and editorial boundaries.
        </p>
      </div>

      {/* Tone Descriptors (Pill Selection) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[#25251F]">
            Brand Personality Descriptors{' '}
            <span className="text-[#A09D92] font-normal">(Pick up to 5)</span>
          </label>
          <span className="text-[11px] text-[#A09D92] font-mono">
            {data.toneDescriptors.length} / 5 selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {AVAILABLE_DESCRIPTORS.map((trait) => {
            const isSelected = data.toneDescriptors.includes(trait);
            return (
              <button
                key={trait}
                type="button"
                onClick={() => toggleDescriptor(trait)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#25251F] text-white border-[#25251F] shadow-xs'
                    : 'bg-[#FAF9F5] text-[#4F4E48] border-[#E5E1D8] hover:border-[#68745D]/60 hover:bg-[#F2EFE8]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                <span>{trait}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Sliders */}
      <div className="space-y-5 pt-2">
        {/* Dimension 1: Formality */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#25251F]">Formality</span>
            <span className="text-[#77766E] font-medium">
              {data.formality <= 2
                ? 'Formal & Academic'
                : data.formality === 3
                ? 'Balanced Professional'
                : 'Conversational & Casual'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#A09D92] w-20 shrink-0">
              Formal
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={data.formality}
              onChange={(e) =>
                onChange({ formality: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#25251F] cursor-pointer"
            />
            <span className="text-[11px] text-[#A09D92] w-20 text-right shrink-0">
              Casual
            </span>
          </div>
        </div>

        {/* Dimension 2: Boldness */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#25251F]">Boldness</span>
            <span className="text-[#77766E] font-medium">
              {data.boldness <= 2
                ? 'Understated & Grounded'
                : data.boldness === 3
                ? 'Confident & Direct'
                : 'Audacious & Bold'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#A09D92] w-20 shrink-0">
              Understated
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={data.boldness}
              onChange={(e) =>
                onChange({ boldness: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#25251F] cursor-pointer"
            />
            <span className="text-[11px] text-[#A09D92] w-20 text-right shrink-0">
              Bold
            </span>
          </div>
        </div>

        {/* Dimension 3: Technicality */}
        <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#25251F]">Technical Depth</span>
            <span className="text-[#77766E] font-medium">
              {data.accessibility <= 2
                ? 'Specialist & Technical'
                : data.accessibility === 3
                ? 'Industry Standard'
                : 'Universal & Accessible'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#A09D92] w-20 shrink-0">
              Technical
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={data.accessibility}
              onChange={(e) =>
                onChange({ accessibility: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#25251F] cursor-pointer"
            />
            <span className="text-[11px] text-[#A09D92] w-20 text-right shrink-0">
              Accessible
            </span>
          </div>
        </div>
      </div>

      {/* Do's & Don'ts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Do's */}
        <div className="p-4 rounded-xl bg-[#F6F8F5] border border-[#D5E1D3] space-y-2">
          <span className="text-xs font-semibold text-[#48634B] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48634B]" />
            Editorial Principles (Do's)
          </span>
          <ul className="text-xs text-[#4F594D] space-y-1.5 list-disc pl-4">
            {data.dos.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Don'ts */}
        <div className="p-4 rounded-xl bg-[#FDF7F5] border border-[#ECD9D3] space-y-2">
          <span className="text-xs font-semibold text-[#A05244] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A05244]" />
            Strict Exclusions (Don'ts)
          </span>
          <ul className="text-xs text-[#70524B] space-y-1.5 list-disc pl-4">
            {data.donts.map((item, idx) => (
              <li key={idx} className="leading-snug">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E1D8]/60">
        <button
          type="button"
          onClick={onPrev}
          className="bg-[#FFFEFA] hover:bg-[#F1EFE8] border border-[#E5E1D8] text-[#25251F] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Brand Assets</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="bg-[#25251F] hover:bg-[#383832] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <span>Next: Governance</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
