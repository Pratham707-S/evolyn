'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImportKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
  showToast: (msg: string) => void;
}

export function ImportKnowledgeModal({
  isOpen,
  onClose,
  onImportComplete,
  showToast,
}: ImportKnowledgeModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!selectedFile) {
      showToast('Please select a file to import');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onImportComplete(3);
      showToast(`Successfully imported knowledge items from ${selectedFile.name}`);
      onClose();
      setSelectedFile(null);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F1EA] text-[#25251F] flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#25251F] leading-tight">
                Import Knowledge Assets
              </h2>
              <p className="text-xs text-[#77766E] mt-0.5">
                Upload CSV, JSON, or PDF benchmark documentation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
              dragOver
                ? 'border-[#25251F] bg-[#FAF8F3]'
                : selectedFile
                ? 'border-[#065F46] bg-[#ECFDF5]/20'
                : 'border-[#D5D1C7] hover:border-[#25251F] bg-[#FAF9F5]'
            }`}
          >
            <input
              type="file"
              id="file-upload-knowledge"
              accept=".csv,.json,.pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-knowledge"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shadow-xs">
                {selectedFile ? (
                  <CheckCircle2 className="w-5 h-5 text-[#065F46]" />
                ) : (
                  <Upload className="w-5 h-5 text-[#77766E]" />
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#25251F]">
                {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[11px] text-[#77766E]">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract`
                  : 'Supported formats: CSV, JSON, Markdown, or PDF (up to 25MB)'}
              </p>
            </label>
          </div>

          {/* Sample template info */}
          <div className="p-3 bg-[#FAF8F5] border border-[#EFECE6] rounded-xl flex items-start gap-2.5 text-xs text-[#52524E]">
            <AlertCircle className="w-4 h-4 text-[#77766E] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#25251F]">Automatic Entity Grounding</p>
              <p className="text-[11px] text-[#77766E] mt-0.5 leading-relaxed">
                Imported items are semantically parsed into facts, claims, and citations for immediate use in AI review runs.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E5E1D8] flex items-center justify-end gap-2.5 bg-white">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!selectedFile || isUploading}
            onClick={handleExecuteImport}
          >
            {isUploading ? 'Ingesting...' : 'Import Selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}

