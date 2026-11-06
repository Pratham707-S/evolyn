'use client';

import React, { useState } from 'react';
import {
  FileText,
  Pencil,
  MoreHorizontal,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  GuidelineCategoryItem,
  GuidelineItem,
  GuidelineItemStatus,
} from '../data/guidelines-data';
import { CategoryIcon } from './category-icon';

interface GuidelinesListProps {
  currentCategory?: GuidelineCategoryItem;
  guidelines: GuidelineItem[];
  totalCount: number;
  onEditCategory?: () => void;
  onEditGuideline?: (guideline: GuidelineItem) => void;
  onDeleteGuideline?: (guidelineId: string) => void;
  onStatusChange?: (guidelineId: string, newStatus: GuidelineItemStatus) => void;
  showToast: (msg: string) => void;
}

export function GuidelinesList({
  currentCategory,
  guidelines,
  totalCount,
  onEditCategory,
  onEditGuideline,
  onDeleteGuideline,
  onStatusChange,
  showToast,
}: GuidelinesListProps) {
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'status'>('updated');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Sorting
  const sortedGuidelines = [...guidelines].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0; // default recently updated
  });

  const getStatusBadge = (status: GuidelineItemStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="bg-[#EEF4EE] text-[#4E6B54] border border-[#D1E2D3] rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0">
            Active
          </span>
        );
      case 'Needs Review':
        return (
          <span className="bg-[#FDF4E7] text-[#935B1E] border border-[#F2D7B3] rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0">
            Needs Review
          </span>
        );
      case 'Draft':
        return (
          <span className="bg-[#F1EFE8] text-[#77766E] border border-[#E5E1D8] rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0">
            Draft
          </span>
        );
      default:
        return (
          <span className="bg-[#F1EFE8] text-[#77766E] border border-[#E5E1D8] rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0">
            {status}
          </span>
        );
    }
  };

  const title = currentCategory ? currentCategory.name : 'All Guidelines';
  const description = currentCategory
    ? currentCategory.description
    : 'View and govern all active brand guidelines across all categories.';
  const iconName = currentCategory ? currentCategory.iconName : 'megaphone';

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      {/* 1. Category Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#E5E1D8]/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] text-[#25251F] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <CategoryIcon iconName={iconName} className="w-4 h-4 stroke-[1.8]" />
          </div>

          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-xs text-[#77766E] mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Controls for Category */}
        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            type="button"
            onClick={onEditCategory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-[#25251F] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Pencil className="w-3.5 h-3.5 text-[#68745D]" />
            <span>Edit Category</span>
          </button>

          <button
            type="button"
            onClick={() => showToast('Category settings options opened.')}
            className="p-1.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer shadow-2xs"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Guidelines Toolbar (Count, Sort, View Toggle) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <span className="text-xs sm:text-sm font-semibold text-[#25251F]">
          {sortedGuidelines.length} Guideline{sortedGuidelines.length === 1 ? '' : 's'}
        </span>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] rounded-xl pl-2.5 pr-6 py-1 text-xs text-[#25251F] font-medium cursor-pointer transition-colors"
            >
              <option value="updated">Sort: Recently Updated</option>
              <option value="title">Sort: Alphabetical (A-Z)</option>
              <option value="status">Sort: Status</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#77766E]">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          {/* List / Grid View Switcher */}
          <div className="flex items-center bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#FFFEFA] text-[#25251F] shadow-2xs font-semibold'
                  : 'text-[#77766E] hover:text-[#25251F]'
              }`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#FFFEFA] text-[#25251F] shadow-2xs font-semibold'
                  : 'text-[#77766E] hover:text-[#25251F]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Guidelines Content */}
      {sortedGuidelines.length === 0 ? (
        <div className="py-10 text-center space-y-1.5 border border-dashed border-[#E5E1D8] rounded-xl bg-[#FAF9F5]">
          <p className="text-sm font-medium text-[#25251F]">No guidelines found</p>
          <p className="text-xs text-[#77766E]">
            Try adjusting your search query or filter settings.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* List Mode: Parent card fits 4 cards height. If more than 4, inner scrollbar appears. */
        <div className="divide-y divide-[#E5E1D8]/60 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
          {sortedGuidelines.map((guideline) => {
            const isMenuOpen = activeMenuId === guideline.id;

            return (
              <div
                key={guideline.id}
                className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors"
              >
                {/* Left: Document Icon & Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-[#E5E1D8] text-[#77766E] flex items-center justify-center shrink-0 mt-0.5 group-hover:text-[#25251F] group-hover:border-[#68745D]/40 transition-colors">
                    <FileText className="w-4 h-4 stroke-[1.8]" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#25251F] leading-snug group-hover:text-[#68745D] transition-colors cursor-pointer"
                      onClick={() => onEditGuideline?.(guideline)}
                    >
                      {guideline.title}
                    </h3>
                    <p className="text-xs text-[#77766E] leading-relaxed line-clamp-2">
                      {guideline.description}
                    </p>
                  </div>
                </div>

                {/* Right: Badge, Timestamp, Action Menu */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0 pt-1 sm:pt-0">
                  {getStatusBadge(guideline.status)}

                  <span className="text-[11px] text-[#A09D92] whitespace-nowrap min-w-[85px] text-right">
                    {guideline.updatedAt}
                  </span>

                  {/* Row Dropdown Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(isMenuOpen ? null : guideline.id)
                      }
                      className="p-1 rounded-lg hover:bg-[#F2EFE8] text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
                      title="Guideline Actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-7 z-20 w-44 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl shadow-lg p-1.5 space-y-1 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditGuideline?.(guideline);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#25251F] hover:bg-[#FAF9F5] flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#68745D]" />
                          <span>Edit Guideline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigator.clipboard.writeText(
                              `${guideline.title}\n${guideline.description}`
                            );
                            showToast(`Copied guideline: "${guideline.title}"`);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#25251F] hover:bg-[#FAF9F5] flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#77766E]" />
                          <span>Copy Rule Text</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            const nextStatus =
                              guideline.status === 'Active'
                                ? 'Needs Review'
                                : 'Active';
                            onStatusChange?.(guideline.id, nextStatus);
                            showToast(
                              `Status set to "${nextStatus}" for "${guideline.title}"`
                            );
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#25251F] hover:bg-[#FAF9F5] flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4E6B54]" />
                          <span>
                            Mark as {guideline.status === 'Active' ? 'Needs Review' : 'Active'}
                          </span>
                        </button>

                        <div className="border-t border-[#E5E1D8]/60 my-1" />

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteGuideline?.(guideline.id);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-[#B56E63] hover:bg-[#FDEAEA]/50 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Guideline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Mode: Parent card fits 4 cards (2 rows of 2). If more, inner scrollbar. */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[280px] overflow-y-auto pr-1.5 custom-scrollbar">
          {sortedGuidelines.map((guideline) => (
            <div
              key={guideline.id}
              className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 transition-all space-y-2.5 flex flex-col justify-between group"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FFFEFA] border border-[#E5E1D8] text-[#77766E] flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 stroke-[1.8]" />
                  </div>
                  {getStatusBadge(guideline.status)}
                </div>

                <h3
                  onClick={() => onEditGuideline?.(guideline)}
                  className="text-xs sm:text-[13px] font-semibold text-[#25251F] leading-snug group-hover:text-[#68745D] transition-colors cursor-pointer"
                >
                  {guideline.title}
                </h3>
                <p className="text-[11px] text-[#77766E] leading-relaxed line-clamp-2">
                  {guideline.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-[#E5E1D8]/60 text-[10px] text-[#A09D92]">
                <span>{guideline.updatedAt}</span>
                <button
                  type="button"
                  onClick={() => onEditGuideline?.(guideline)}
                  className="text-[#68745D] font-medium hover:underline cursor-pointer"
                >
                  Edit Rule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

