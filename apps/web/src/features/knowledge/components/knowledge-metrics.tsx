'use client';

import React from 'react';
import {
  BookOpen,
  Layers,
  FlaskConical,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  KnowledgeCategoryId,
  KnowledgeCategoryMetric,
} from '../data/knowledge-data';
import { cn } from '@/lib/utils/cn';

interface KnowledgeMetricsProps {
  categories: KnowledgeCategoryMetric[];
  selectedCategoryId: KnowledgeCategoryId;
  onSelectCategory: (id: KnowledgeCategoryId) => void;
}

export function KnowledgeMetrics({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: KnowledgeMetricsProps) {
  const getIcon = (iconName: KnowledgeCategoryMetric['iconName'], isSelected: boolean) => {
    switch (iconName) {
      case 'book':
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#18181B] text-white shadow-xs'
                : 'bg-[#18181B] text-white group-hover:bg-[#27272A]'
            )}
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        );
      case 'layers':
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#18181B] text-white'
                : 'bg-[#F4F1EA] text-[#52524E] group-hover:bg-[#EAE6DC]'
            )}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        );
      case 'flask':
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#18181B] text-white'
                : 'bg-[#F4F1EA] text-[#52524E] group-hover:bg-[#EAE6DC]'
            )}
          >
            <FlaskConical className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        );
      case 'shield':
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#18181B] text-white'
                : 'bg-[#F4F1EA] text-[#52524E] group-hover:bg-[#EAE6DC]'
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        );
      case 'typography':
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors font-serif font-bold text-xs tracking-tight',
              isSelected
                ? 'bg-[#18181B] text-white'
                : 'bg-[#F4F1EA] text-[#25251F] group-hover:bg-[#EAE6DC]'
            )}
          >
            Aa
          </div>
        );
      case 'document':
      default:
        return (
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              isSelected
                ? 'bg-[#18181B] text-white'
                : 'bg-[#F4F1EA] text-[#52524E] group-hover:bg-[#EAE6DC]'
            )}
          >
            <FileText className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {/* Horizontal scroll container on mobile/tablet, grid on larger screens */}
      <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 scroll-smooth">
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                'group flex-shrink-0 min-w-[140px] sm:min-w-0 bg-[#FFFEFA] border rounded-xl p-2.5 sm:p-3 transition-all text-left flex items-center gap-2.5 select-none',
                isSelected
                  ? 'border-[#25251F] shadow-sm bg-white ring-1 ring-[#25251F]/10'
                  : 'border-[#E5E1D8] hover:border-[#D5D1C7] hover:bg-[#FAF9F5] shadow-2xs'
              )}
            >
              {getIcon(category.iconName, isSelected)}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-[#77766E] truncate leading-tight">
                  {category.label}
                </p>
                <p className="text-lg sm:text-xl font-serif font-bold text-[#25251F] leading-tight mt-0.5 tracking-tight">
                  {category.count}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

