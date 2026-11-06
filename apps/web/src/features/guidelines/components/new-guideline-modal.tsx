'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  GuidelineCategoryItem,
  GuidelineItem,
  GuidelineItemStatus,
  GuidelineSeverity,
} from '../data/guidelines-data';

interface NewGuidelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: GuidelineCategoryItem[];
  defaultCategoryId?: string;
  initialData?: GuidelineItem | null;
  onSave: (guideline: Omit<GuidelineItem, 'id' | 'updatedAt'> & { id?: string }) => void;
}

export function NewGuidelineModal({
  isOpen,
  onClose,
  categories,
  defaultCategoryId,
  initialData,
  onSave,
}: NewGuidelineModalProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [ruleStatement, setRuleStatement] = useState('');
  const [severity, setSeverity] = useState<GuidelineSeverity>('WARNING');
  const [status, setStatus] = useState<GuidelineItemStatus>('Active');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategoryId(initialData.categoryId);
      setDescription(initialData.description);
      setRuleStatement(initialData.ruleStatement || '');
      setSeverity(initialData.severity);
      setStatus(initialData.status);
    } else {
      setTitle('');
      setCategoryId(defaultCategoryId && defaultCategoryId !== 'all' ? defaultCategoryId : categories[0]?.id || 'tone-voice');
      setDescription('');
      setRuleStatement('');
      setSeverity('WARNING');
      setStatus('Active');
    }
  }, [initialData, defaultCategoryId, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const matchedCat = categories.find((c) => c.id === categoryId);

    onSave({
      id: initialData?.id,
      title: title.trim(),
      categoryId,
      categoryName: matchedCat?.name || 'General',
      description: description.trim(),
      ruleStatement: ruleStatement.trim() || description.trim(),
      severity,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]/70">
          <div>
            <h3 className="font-serif text-xl text-[#25251F]">
              {initialData ? 'Edit Guideline' : 'New Guideline'}
            </h3>
            <p className="text-xs text-[#77766E] mt-0.5">
              Configure brand rule parameters and AI evaluation criteria.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#25251F]">
              Guideline Rule Title <span className="text-[#B56E63]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Avoid exaggerated or absolute claims"
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#25251F] transition-all"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#25251F]">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3 py-2 text-xs sm:text-sm text-[#25251F] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#25251F]">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GuidelineItemStatus)}
                className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl px-3 py-2 text-xs sm:text-sm text-[#25251F] cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#25251F]">
              Rule Summary & Guidance <span className="text-[#B56E63]">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how content creators should apply this guideline..."
              className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl p-3 text-xs sm:text-sm text-[#25251F] resize-none leading-relaxed"
              required
            />
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#25251F]">
              AI Review Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CRITICAL', 'WARNING', 'SUGGESTION'] as GuidelineSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    severity === sev
                      ? 'bg-[#25251F] text-white border-[#25251F] shadow-2xs'
                      : 'bg-[#FAF9F5] text-[#77766E] border-[#E5E1D8] hover:bg-[#F2EFE8]'
                  }`}
                >
                  {sev === 'CRITICAL' ? 'Critical' : sev === 'WARNING' ? 'Warning' : 'Suggestion'}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E1D8]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-xs font-medium text-[#25251F] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#25251F] hover:bg-[#383832] text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{initialData ? 'Save Changes' : 'Create Guideline'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

