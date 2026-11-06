'use client';

import React from 'react';
import { GuidelineCategoryItem } from '../data/guidelines-data';

interface CategoryPillsProps {
  categories: GuidelineCategoryItem[];
  selectedCategoryId: string | 'all';
  totalGuidelinesCount: number;
  onSelectCategory: (categoryId: string | 'all') => void;
}

export function CategoryPills({
  categories,
  selectedCategoryId,
  totalGuidelinesCount,
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-2.5 min-w-max">
        {/* 'All Guidelines' Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
            selectedCategoryId === 'all'
              ? 'bg-[#25251F] text-white shadow-xs'
              : 'bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] hover:bg-[#F2EFE8]'
          }`}
        >
          <span>All Guidelines ({totalGuidelinesCount})</span>
        </button>

        {/* Individual Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
                isSelected
                  ? 'bg-[#25251F] text-white font-semibold shadow-xs'
                  : 'bg-[#FFFEFA] border border-[#E5E1D8] text-[#25251F] hover:bg-[#F2EFE8]'
              }`}
            >
              <span>
                {cat.name} ({cat.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

