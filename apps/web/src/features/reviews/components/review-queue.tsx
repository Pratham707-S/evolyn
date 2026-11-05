'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Input } from '../../../components/ui/input';

export interface QueueItem {
  id: string;
  title: string;
  channel: string;
  timeAgo: string;
  status: 'Ready for Decision' | 'In Review' | 'With Findings';
  reviewId: string;
  content: string;
  summary: string;
  findings: Array<{
    id: string;
    severity: 'High' | 'Medium' | 'Low';
    title: string;
    explanation: string;
    suggestedFix: string;
    verbatimQuote: string;
    confidence: number;
    evidenceStrength: number;
  }>;
}

export interface ReviewQueueProps {
  items: QueueItem[];
  selectedId: string;
  onSelect: (item: QueueItem) => void;
  statusFilter?: string | null;
}

export function ReviewQueue({
  items,
  selectedId,
  onSelect,
  statusFilter,
}: ReviewQueueProps) {
  const [search, setSearch] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [localStatusFilter, setLocalStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 5;

  const activeFilter = statusFilter || localStatusFilter;

  const filtered = items.filter((it) => {
    if (activeFilter && it.status !== activeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        it.title.toLowerCase().includes(q) ||
        it.channel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const renderBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'Ready for Decision':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            Ready for Decision
          </span>
        );
      case 'With Findings':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA]">
            With Findings
          </span>
        );
      case 'In Review':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#77766E] border border-[#E5E1D8]">
            In Review
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg sm:text-xl font-normal text-[#25251F] tracking-tight">
          Review Queue
        </h2>
        <span className="text-xs bg-[#F1EFE8] text-[#77766E] px-2.5 py-0.5 rounded-full font-medium">
          {items.length} items
        </span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2 relative">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search submissions..."
            icon={<Search className="w-3.5 h-3.5" />}
            className="h-9 text-xs"
          />
        </div>

        <button
          type="button"
          onClick={() => setFilterMenuOpen(!filterMenuOpen)}
          className={`w-9 h-9 rounded-lg border border-[#E5E1D8] flex items-center justify-center transition-colors ${
            activeFilter ? 'bg-[#25251F] text-white' : 'bg-[#FFFEFA] text-[#77766E] hover:bg-[#F1EFE8]'
          }`}
          aria-label="Filter queue"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>

        {filterMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setFilterMenuOpen(false)}
            />
            <div className="absolute right-0 top-10 z-40 w-44 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl shadow-lg p-1.5 text-xs text-[#25251F]">
              <button
                type="button"
                onClick={() => {
                  setLocalStatusFilter(null);
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                  !activeFilter ? 'bg-[#F1EFE8] font-medium' : 'hover:bg-[#F1EFE8]'
                }`}
              >
                All Items
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalStatusFilter('Ready for Decision');
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                  activeFilter === 'Ready for Decision' ? 'bg-[#F1EFE8] font-medium' : 'hover:bg-[#F1EFE8]'
                }`}
              >
                Ready for Decision
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalStatusFilter('With Findings');
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                  activeFilter === 'With Findings' ? 'bg-[#F1EFE8] font-medium' : 'hover:bg-[#F1EFE8]'
                }`}
              >
                With Findings
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalStatusFilter('In Review');
                  setFilterMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg ${
                  activeFilter === 'In Review' ? 'bg-[#F1EFE8] font-medium' : 'hover:bg-[#F1EFE8]'
                }`}
              >
                In Review
              </button>
            </div>
          </>
        )}
      </div>

      {/* Queue Items List */}
      <div className="space-y-2 flex-1 min-h-[340px]">
        {paginated.length === 0 ? (
          <div className="py-12 text-center text-[#77766E] text-xs">
            No submissions matching filter.
          </div>
        ) : (
          paginated.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#F9F7F2] border-[#68745D] ring-1 ring-[#68745D]/20 shadow-2xs'
                    : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#25251F] text-white'
                        : 'bg-[#F1EFE8] text-[#25251F]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-[#25251F] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#77766E] truncate mt-0.5">
                      {item.channel} · {item.timeAgo}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">{renderBadge(item.status)}</div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="pt-2 border-t border-[#E5E1D8]/60 flex items-center justify-center gap-1 select-none text-xs">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setPage(1)}
          className={`w-7 h-7 rounded-lg font-medium flex items-center justify-center ${
            page === 1 ? 'bg-[#25251F] text-white' : 'border border-[#E5E1D8] text-[#25251F]'
          }`}
        >
          1
        </button>

        <button
          type="button"
          onClick={() => setPage(2)}
          className={`w-7 h-7 rounded-lg font-medium flex items-center justify-center ${
            page === 2 ? 'bg-[#25251F] text-white' : 'border border-[#E5E1D8] text-[#25251F]'
          }`}
        >
          2
        </button>

        <button
          type="button"
          onClick={() => setPage(3)}
          className={`w-7 h-7 rounded-lg font-medium flex items-center justify-center ${
            page === 3 ? 'bg-[#25251F] text-white' : 'border border-[#E5E1D8] text-[#25251F]'
          }`}
        >
          3
        </button>

        <span className="px-1 text-[#A09D92]">...</span>

        <button
          type="button"
          onClick={() => setPage(totalPages > 3 ? totalPages : 6)}
          className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] font-medium flex items-center justify-center hover:bg-[#F1EFE8]"
        >
          6
        </button>

        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

