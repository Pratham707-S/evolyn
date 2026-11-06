'use client';

import React from 'react';
import { Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { GuidelineCategoryItem } from '../data/guidelines-data';
import { CategoryIcon } from './category-icon';

interface CategorySidebarProps {
  categories: GuidelineCategoryItem[];
  selectedCategoryId: string | 'all';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenFilterMenu?: () => void;
  categoryFilterCounts?: Record<string, number>;
}

export function CategorySidebar({
  categories,
  selectedCategoryId,
  searchQuery,
  onSearchChange,
  onSelectCategory,
  onOpenFilterMenu,
  categoryFilterCounts,
}: CategorySidebarProps) {
  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      {/* Search Input & Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#77766E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search guidelines..."
            className="w-full bg-[#FAF9F5] border border-[#E5E1D8] hover:border-[#68745D]/40 focus:border-[#25251F] focus:bg-[#FFFEFA] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-[#25251F] placeholder:text-[#A09D92] transition-all"
          />
        </div>

        <button
          type="button"
          onClick={onOpenFilterMenu}
          className="p-2 sm:p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF9F5] hover:bg-[#F2EFE8] text-[#25251F] transition-colors cursor-pointer shrink-0 shadow-2xs"
          title="Filter Options"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Categories Vertical List */}
      <div className="space-y-1.5 pt-1">
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const displayCount = categoryFilterCounts
            ? categoryFilterCounts[cat.id] ?? cat.count
            : cat.count;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left group ${
                isSelected
                  ? 'bg-[#F8F5EE] border border-[#E2DDD2] shadow-2xs'
                  : 'hover:bg-[#FAF9F5] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Category Icon Container */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'text-[#25251F]'
                      : 'text-[#77766E] group-hover:text-[#25251F]'
                  }`}
                >
                  <CategoryIcon iconName={cat.iconName} className="w-5 h-5 stroke-[1.8]" />
                </div>

                {/* Name & Count */}
                <div className="min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                      isSelected
                        ? 'text-[#25251F]'
                        : 'text-[#25251F] group-hover:text-[#25251F]'
                    }`}
                  >
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-[#77766E]">
                    {displayCount} guideline{displayCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {/* Chevron Arrow */}
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isSelected
                    ? 'text-[#25251F] translate-x-0.5'
                    : 'text-[#A09D92] group-hover:text-[#25251F]'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

