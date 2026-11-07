'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  Layers,
  FlaskConical,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Trash2,
} from 'lucide-react';
import {
  KnowledgeItem,
  KnowledgeTypeLabel,
} from '../data/knowledge-data';
import { cn } from '@/lib/utils/cn';

interface KnowledgeTableProps {
  items: KnowledgeItem[];
  selectedItem: KnowledgeItem | null;
  onSelectItem: (item: KnowledgeItem) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedProduct: string;
  onProductChange: (product: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onDeleteItem?: (id: string) => void;
  showToast: (msg: string) => void;
}

export function KnowledgeTable({
  items,
  selectedItem,
  onSelectItem,
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedProduct,
  onProductChange,
  selectedStatus,
  onStatusChange,
  onDeleteItem,
  showToast,
}: KnowledgeTableProps) {
  // Checkbox selections for batch actions
  const [selectedIds, setSelectedIds] = useState<string[]>(['kn-1']);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 5;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedProduct, selectedStatus]);

  // Compute sliced items for current page
  const startIndex = (safePage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  // Checkbox handlers
  const handleToggleAll = () => {
    if (selectedIds.length === paginatedItems.length && paginatedItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedItems.map((i) => i.id));
    }
  };

  const handleToggleRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getItemIcon = (type: KnowledgeTypeLabel) => {
    switch (type) {
      case 'Product Facts':
        return (
          <div className="w-7 h-7 rounded-md bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
        );
      case 'Evidence & Studies':
        return (
          <div className="w-7 h-7 rounded-md bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center flex-shrink-0">
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
        );
      case 'Approved Claims':
        return (
          <div className="w-7 h-7 rounded-md bg-[#ECFDF5] text-[#065F46] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        );
      case 'Terminology':
        return (
          <div className="w-7 h-7 rounded-md bg-[#FFFBEB] text-[#B45309] font-serif font-bold text-xs flex items-center justify-center flex-shrink-0">
            Aa
          </div>
        );
      case 'Reference Docs':
      default:
        return (
          <div className="w-7 h-7 rounded-md bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center flex-shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getTypeBadge = (type: KnowledgeTypeLabel) => {
    switch (type) {
      case 'Product Facts':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            Product Facts
          </span>
        );
      case 'Evidence & Studies':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
            Evidence & Studies
          </span>
        );
      case 'Approved Claims':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
            Approved Claims
          </span>
        );
      case 'Terminology':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            Terminology
          </span>
        );
      case 'Reference Docs':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
            Reference Docs
          </span>
        );
    }
  };

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    showToast(`Copied ID ${id} to clipboard`);
    setActiveMenuId(null);
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl flex flex-col h-full min-h-0 shadow-2xs overflow-hidden">
      {/* Top Filter and Search Bar (shrink-0) */}
      <div className="p-3 sm:p-3.5 border-b border-[#E5E1D8] flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between bg-white shrink-0">
        {/* Search input */}
        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#77766E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search knowledge..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] focus:ring-1 focus:ring-[#25251F] placeholder:text-[#A09D92] text-[#25251F] transition-all"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Type dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-[#E5E1D8] rounded-xl px-2.5 py-1.5 pr-6 text-xs font-medium text-[#25251F] hover:bg-[#F9F8F5] focus:outline-none focus:border-[#25251F] cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Product Facts">Product Facts</option>
              <option value="Evidence & Studies">Evidence & Studies</option>
              <option value="Approved Claims">Approved Claims</option>
              <option value="Terminology">Terminology</option>
              <option value="Reference Docs">Reference Docs</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#77766E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Product dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-[#E5E1D8] rounded-xl px-2.5 py-1.5 pr-6 text-xs font-medium text-[#25251F] hover:bg-[#F9F8F5] focus:outline-none focus:border-[#25251F] cursor-pointer"
            >
              <option value="ALL">All Products</option>
              <option value="Evolyn Platform">Evolyn Platform</option>
              <option value="Brand">Brand</option>
              <option value="Enterprise Suite">Enterprise Suite</option>
              <option value="Mobile App">Mobile App</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#77766E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status dropdown */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full sm:w-auto appearance-none bg-white border border-[#E5E1D8] rounded-xl px-2.5 py-1.5 pr-6 text-xs font-medium text-[#25251F] hover:bg-[#F9F8F5] focus:outline-none focus:border-[#25251F] cursor-pointer"
            >
              <option value="ALL">Status</option>
              <option value="Approved">Approved</option>
              <option value="In Review">In Review</option>
              <option value="Draft">Draft</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#77766E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Content: internal scroll with no forced overflow */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px] sm:min-w-0">
          <thead>
            <tr className="border-b border-[#E5E1D8] bg-[#FDFBF7] text-[11px] font-semibold text-[#77766E] uppercase tracking-wider select-none sticky top-0 z-10">
              <th className="py-2.5 px-3 w-9 sm:w-10">
                <input
                  type="checkbox"
                  checked={
                    paginatedItems.length > 0 &&
                    selectedIds.length === paginatedItems.length
                  }
                  onChange={handleToggleAll}
                  className="w-3.5 h-3.5 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 font-semibold text-[#77766E]">Title</th>
              <th className="py-2.5 px-2.5 w-32 font-semibold text-[#77766E]">Type</th>
              <th className="py-2.5 px-2.5 w-28 font-semibold text-[#77766E]">Product</th>
              <th className="py-2.5 px-2.5 w-24 font-semibold text-[#77766E]">Last Updated</th>
              <th className="py-2.5 px-2 w-9 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFECE6] text-xs">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#77766E]">
                  <p className="font-serif text-base text-[#25251F]">No knowledge items match your criteria</p>
                  <p className="text-xs text-[#A09D92] mt-1">
                    Try adjusting your search terms or clearing the active filters.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isChecked = selectedIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className={cn(
                      'cursor-pointer transition-colors group select-none',
                      isSelected
                        ? 'bg-[#FAF7EE] hover:bg-[#F6F2E5]'
                        : 'hover:bg-[#FAF9F5]'
                    )}
                  >
                    {/* Checkbox (Always in exact same position for all rows!) */}
                    <td className="py-2.5 px-3 w-9 sm:w-10" onClick={(e) => handleToggleRow(e, item.id)}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-[#D5D1C7] text-[#25251F] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                    </td>

                    {/* Title & Subtitle */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getItemIcon(item.type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[#25251F] group-hover:text-black truncate leading-snug">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#77766E] truncate leading-tight mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap w-32">
                      {getTypeBadge(item.type)}
                    </td>

                    {/* Product */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap w-28 text-[11px] text-[#52524E] font-medium truncate">
                      {item.product}
                    </td>

                    {/* Last Updated */}
                    <td className="py-2.5 px-2.5 whitespace-nowrap w-24 text-[11px] text-[#77766E]">
                      {item.lastUpdated}
                    </td>

                    {/* Options Menu button */}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap w-9 relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === item.id ? null : item.id);
                        }}
                        className="p-1 rounded-md text-[#77766E] hover:text-[#25251F] hover:bg-[#EFECE6] transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown popup */}
                      {activeMenuId === item.id && (
                        <div
                          className="absolute right-2 top-8 z-20 w-44 bg-white border border-[#E5E1D8] rounded-xl shadow-lg py-1.5 text-xs text-[#25251F] text-left animate-in fade-in-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onSelectItem(item);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-1.5 hover:bg-[#FAF9F5] flex items-center gap-2 text-left"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#77766E]" />
                            View Inspector
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, item.id)}
                            className="w-full px-3 py-1.5 hover:bg-[#FAF9F5] flex items-center gap-2 text-left"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#77766E]" />
                            Copy Resource ID
                          </button>
                          {onDeleteItem && (
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteItem(item.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-[#FEE2E2] text-[#B91C1C] flex items-center gap-2 text-left border-t border-[#EFECE6] mt-1 pt-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Resource
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Status Footer (shrink-0) */}
      <div className="p-2.5 sm:p-3 border-t border-[#E5E1D8] flex items-center justify-between gap-2 text-xs text-[#77766E] bg-white shrink-0">
        <p className="font-medium text-[11px] truncate">
          Showing{' '}
          <span className="font-semibold text-[#25251F]">
            {items.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, items.length)}
          </span>{' '}
          of <span className="font-semibold text-[#25251F]">{items.length}</span> resources
        </p>

        {/* Real Pagination Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#E5E1D8] text-[#52524E] hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            if (
              totalPages > 5 &&
              pageNum !== 1 &&
              pageNum !== totalPages &&
              Math.abs(pageNum - safePage) > 1
            ) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={pageNum} className="px-0.5 text-[#A09D92] text-[11px]">
                    ...
                  </span>
                );
              }
              return null;
            }

            const isActive = pageNum === safePage;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-[#18181B] text-white shadow-xs'
                    : 'text-[#52524E] hover:bg-[#F1EFE8]'
                )}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-[#E5E1D8] text-[#52524E] hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
