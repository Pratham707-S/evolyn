'use client';

import React, { useState } from 'react';
import { X, Download, Sparkles, Check, FileText, ShieldCheck, Palette } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { PDF_THEMES, type PdfTheme } from '../constants/pdf-themes';
import { exportStyledPdf } from '../utils/export-styled-pdf';

export interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  contentHtml: string;
  channel?: string;
  complianceScore?: number;
}

export function ExportPdfModal({
  isOpen,
  onClose,
  title,
  contentHtml,
  channel = 'Website',
  complianceScore = 100,
}: ExportPdfModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<PdfTheme>(PDF_THEMES[0]);
  const [includeComplianceBadge, setIncludeComplianceBadge] = useState(true);
  const [includeCoverHeader, setIncludeCoverHeader] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportStyledPdf({
        title,
        contentHtml,
        channel,
        theme: selectedTheme,
        includeComplianceBadge,
        includeCoverHeader,
        complianceScore,
      });
      // Short delay then close
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E1D8] flex items-center justify-between flex-shrink-0 bg-[#FFFEFA]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8EBE1] text-[#4E6B54] flex items-center justify-center shadow-2xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-[#25251F] font-semibold leading-snug">
                Export Styled Brand PDF
              </h2>
              <p className="text-xs text-[#77766E] mt-0.5">
                Select an aesthetic theme and document options to download a publication-ready PDF.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#77766E] hover:text-[#25251F] rounded-lg hover:bg-[#F1EFE8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF9F5]">
          {/* Section 1: Theme Selection */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#77766E] block mb-2.5">
              1. Choose Brand Aesthetic & Color Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PDF_THEMES.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-[#68745D] bg-[#FFFEFA] shadow-sm ring-2 ring-[#68745D]/40'
                        : 'border-[#E5E1D8] bg-[#FFFEFA]/60 hover:bg-[#FFFEFA] hover:border-[#68745D]/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#25251F]">{theme.name}</span>
                        {/* Color swatches */}
                        <div className="flex items-center -space-x-1">
                          {theme.swatchColors.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-4 rounded-full border border-black/10 shadow-2xs inline-block"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#68745D] font-medium block mt-0.5">
                        {theme.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#77766E] leading-relaxed line-clamp-2">
                      {theme.description}
                    </p>

                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#68745D] text-white flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Live Mini Preview */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#77766E] block mb-2">
              2. Live Style Preview
            </label>
            <div
              className="p-4 rounded-xl border transition-all duration-300 shadow-2xs"
              style={{
                backgroundColor: selectedTheme.paperBg,
                borderColor: selectedTheme.borderColor,
                color: selectedTheme.textPrimary,
              }}
            >
              <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: selectedTheme.borderColor }}>
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: selectedTheme.textMuted }}>
                  {channel} &bull; Evolyn Brand System
                </span>
                {includeComplianceBadge && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1"
                    style={{ backgroundColor: selectedTheme.badgeBg, color: selectedTheme.badgeText }}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {complianceScore}% Brand Compliant
                  </span>
                )}
              </div>
              <h3
                className="text-base font-bold mb-1 truncate"
                style={{
                  color: selectedTheme.accentColor,
                  fontFamily: selectedTheme.headingFont,
                }}
              >
                {title || 'Sample Brand Campaign Document'}
              </h3>
              <p className="text-xs line-clamp-2 opacity-80" style={{ fontFamily: selectedTheme.bodyFont }}>
                This is a live preview of your verified document text. Titles, body prose, citations, and guidelines are formatted to publication standards.
              </p>
            </div>
          </div>

          {/* Section 3: Formatting Toggles */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#77766E] block mb-2.5">
              3. Governance & Metadata Options
            </label>
            <div className="space-y-2 bg-[#FFFEFA] p-3.5 rounded-xl border border-[#E5E1D8]">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#68745D]" />
                  <span className="text-xs font-medium text-[#25251F]">
                    Include Brand Governance Stamp
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeComplianceBadge}
                  onChange={(e) => setIncludeComplianceBadge(e.target.checked)}
                  className="rounded text-[#68745D] focus:ring-[#68745D] cursor-pointer"
                />
              </label>

              <div className="border-t border-[#E5E1D8]/60" />

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#68745D]" />
                  <span className="text-xs font-medium text-[#25251F]">
                    Include Document Title & Date Header
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeCoverHeader}
                  onChange={(e) => setIncludeCoverHeader(e.target.checked)}
                  className="rounded text-[#68745D] focus:ring-[#68745D] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Full Page Color Instruction Callout */}
          <div className="p-3 bg-[#E8EBE1]/60 border border-[#68745D]/30 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#4E6B54] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#25251F] leading-relaxed">
              <strong className="font-semibold text-[#4E6B54]">Edge-to-Edge Color Tip:</strong> In the browser print dialog, ensure <span className="underline font-semibold">Background graphics</span> is checked so the full theme background covers every page seamlessly without white margins.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FFFEFA] border-t border-[#E5E1D8] flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-[#25251F] hover:bg-[#383832] text-white flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#E8EBE1]" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Styled PDF'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

