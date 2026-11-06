'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, Check, ArrowRight } from 'lucide-react';
import { GuidelineCategoryItem } from '../data/guidelines-data';

interface ImportGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: GuidelineCategoryItem[];
  onImportSuccess: (count: number, categoryId: string) => void;
}

export function ImportGuidelineModal({
  isOpen,
  onClose,
  categories,
  onImportSuccess,
}: ImportGuidelineModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetCategory, setTargetCategory] = useState(categories[0]?.id || 'tone-voice');
  const [isExtracting, setIsExtracting] = useState(false);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartImport = () => {
    if (!selectedFile) return;
    setIsExtracting(true);

    setTimeout(() => {
      setIsExtracting(false);
      onImportSuccess(3, targetCategory);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]/70">
          <div>
            <h3 className="font-serif text-xl text-[#25251F]">
              Import Guidelines
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              Upload PDF or Markdown files to extract and categorize brand rules with AI.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F2EFE8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#25251F]">
              Destination Category
            </label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3 py-2 text-xs sm:text-sm text-[#25251F] cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              selectedFile
                ? 'border-[#68745D] bg-[#F6F8F5]'
                : 'border-[#E5E1D8] hover:border-[#68745D]/40 bg-[#FAF9F5]'
            }`}
          >
            <input
              type="file"
              id="guideline-file-input"
              accept=".pdf,.md,.txt,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#E8EBE1] text-[#68745D] flex items-center justify-center mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#25251F]">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-[#77766E]">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-[#B56E63] hover:underline cursor-pointer pt-1"
                >
                  Choose another file
                </button>
              </div>
            ) : (
              <label
                htmlFor="guideline-file-input"
                className="cursor-pointer space-y-2 block"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] text-[#77766E] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#25251F]">
                  Click to browse or drag & drop brand documents
                </p>
                <p className="text-[11px] text-[#A09D92]">
                  PDF, Markdown, DOCX or TXT (up to 20MB)
                </p>
              </label>
            )}
          </div>

          {/* AI Extraction Note */}
          <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] flex items-start gap-2.5 text-xs text-[#77766E]">
            <Check className="w-4 h-4 text-[#68745D] shrink-0 mt-0.5" />
            <p className="leading-snug">
              Evolyn AI parses documents, separates atomic rules, checks for cross-rule conflicts, and maps them to your category taxonomy automatically.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isExtracting}
              className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-xs font-medium text-[#25251F] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartImport}
              disabled={!selectedFile || isExtracting}
              className="px-4 py-2 rounded-xl bg-[#25251F] hover:bg-[#383832] disabled:opacity-40 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {isExtracting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Extracting Rules...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Extract & Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

