'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  FileText,
  Linkedin,
  Globe,
  Mail,
  BookOpen,
  Instagram,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  LayoutList,
  Table as TableIcon,
  CheckCheck,
} from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { DecisionItem } from './approval-inspector';

export interface ApprovalsTableProps {
  items: DecisionItem[];
  selectedId: string;
  onSelect: (item: DecisionItem) => void;
  statusTab: string;
}

export function ApprovalsTable({
  items,
  selectedId,
  onSelect,
  statusTab,
}: ApprovalsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('30d');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const perPage = 4;

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />;
      case 'website':
        return <Globe className="w-3.5 h-3.5 text-[#25251F]" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-[#77766E]" />;
      case 'blog':
        return <BookOpen className="w-3.5 h-3.5 text-[#68745D]" />;
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-[#77766E]" />;
    }
  };

  const renderDecisionBadge = (decision: DecisionItem['decision']) => {
    switch (decision) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            <CheckCircle2 className="w-3 h-3 text-[#64816A]" />
            Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF4E7] text-[#865920] border border-[#F0D5B5]">
            <AlertTriangle className="w-3 h-3 text-[#B78A4A]" />
            Changes Requested
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDEAEA] text-[#8A332B] border border-[#F4BFB9]">
            <XCircle className="w-3 h-3 text-[#B56E63]" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F1EFE8] text-[#25251F] border border-[#E5E1D8]">
            <Clock className="w-3 h-3 text-[#77766E]" />
            Pending Sign-Off
          </span>
        );
    }
  };

  // Filter items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      // Status tab
      if (statusTab !== 'ALL' && item.decision !== statusTab) {
        return false;
      }
      // Channel
      if (
        channelFilter !== 'ALL' &&
        item.channel.toLowerCase() !== channelFilter.toLowerCase()
      ) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q) ||
          item.reviewerName.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, statusTab, channelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs lg:h-full flex flex-col min-h-0">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="w-full sm:w-56">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search reviewed items..."
            icon={<Search className="w-3.5 h-3.5" />}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs"
          >
            <option value="ALL">All Channels</option>
            <option value="linkedin">LinkedIn</option>
            <option value="website">Website</option>
            <option value="email">Email</option>
            <option value="blog">Blog</option>
            <option value="instagram">Instagram</option>
          </Select>

          <Select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs"
          >
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>

          {/* View Mode Toggle (Cards vs Table) */}
          <div className="inline-flex rounded-lg border border-[#E5E1D8] p-0.5 bg-[#FAF9F5]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards View with Changes Summary"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#25251F] text-white shadow-2xs'
                  : 'text-[#77766E] hover:text-[#25251F]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Dense Table View"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#25251F] text-white shadow-2xs'
                  : 'text-[#77766E] hover:text-[#25251F]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Review Submissions List / Feed (Card View) */}
      {viewMode === 'cards' ? (
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
          {paginated.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#77766E] bg-[#FAF9F5] border border-[#E5E1D8] rounded-xl">
              No approval records match your criteria.
            </div>
          ) : (
            paginated.map((row) => {
              const isSelected = row.id === selectedId;
              const changes = row.changes || [];
              const approvedCount = changes.filter((c) => c.isApproved).length;
              const pendingCount = changes.filter((c) => !c.isApproved).length;

              return (
                <div
                  key={row.id}
                  onClick={() => onSelect(row)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-[#FAF8F5] border-[#68745D] ring-1 ring-[#68745D]/30 shadow-xs'
                      : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF9F5]/50'
                  }`}
                >
                  {/* Top Row: Title, Channel, Decision */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
                        {getChannelIcon(row.channel)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-xs sm:text-sm text-[#25251F] truncate group-hover:text-[#68745D] transition-colors">
                            {row.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[#77766E] mt-0.5">
                          {row.channel} • {row.reviewId} • {row.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderDecisionBadge(row.decision)}
                    </div>
                  </div>

                  {/* Summary of Changes after Review */}
                  <div className="p-2.5 rounded-lg bg-[#F7F5F0]/80 border border-[#E5E1D8]/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#25251F] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#68745D]" />
                        <span>Changes After Review:</span>
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <span className="bg-[#EEF4EE] text-[#36533D] px-1.5 py-0.2 rounded font-medium border border-[#D1E2D3]">
                          ✓ {approvedCount} Approved
                        </span>
                        {pendingCount > 0 && (
                          <span className="bg-[#FDF4E7] text-[#865920] px-1.5 py-0.2 rounded font-medium border border-[#F0D5B5]">
                            ⏳ {pendingCount} Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[#55544E] text-[11px] leading-relaxed line-clamp-2">
                      {row.summary}
                    </p>
                  </div>

                  {/* Footer Row: Reviewer & Workspace Action Link */}
                  <div className="flex items-center justify-between text-[11px] text-[#77766E] pt-1 border-t border-[#E5E1D8]/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#E5E1D8] text-[9px] font-semibold text-[#25251F] flex items-center justify-center">
                        {row.reviewer}
                      </div>
                      <span>Reviewer: {row.reviewerName}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/reviews?id=${row.id}`);
                      }}
                      className="text-[#68745D] hover:underline flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Workspace</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 3. Alternative Dense Table View */
        <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E1D8] text-[#77766E] font-medium pb-2 select-none">
                <th className="py-2.5 px-3 font-normal text-[#77766E]">Content & Review Summary</th>
                <th className="py-2.5 px-3 font-normal text-[#77766E] w-24">Channel</th>
                <th className="py-2.5 px-3 font-normal text-[#77766E] w-32">Decision</th>
                <th className="py-2.5 px-3 font-normal text-[#77766E] w-20 text-center">Reviewer</th>
                <th className="py-2.5 px-3 font-normal text-[#77766E] w-24">Date</th>
                <th className="py-2.5 px-3 font-normal text-[#77766E] w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D8]/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#77766E]">
                    No decisions matching criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const isSelected = row.id === selectedId;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onSelect(row)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#F9F7F2]' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Content */}
                      <td className="py-3 px-3 max-w-[240px] sm:max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs text-[#25251F] group-hover:text-[#68745D] transition-colors truncate">
                              {row.title}
                            </p>
                            <p className="text-[11px] text-[#77766E] truncate mt-0.5">
                              {row.summary || row.snippet}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {getChannelIcon(row.channel)}
                          <span className="text-[11px] capitalize">{row.channel}</span>
                        </div>
                      </td>

                      {/* Decision */}
                      <td className="py-3 px-3">
                        {renderDecisionBadge(row.decision)}
                      </td>

                      {/* Reviewer Avatar */}
                      <td className="py-3 px-3 text-center">
                        <div className="w-6 h-6 rounded-full bg-[#E5E1D8] text-[10px] font-semibold text-[#25251F] inline-flex items-center justify-center">
                          {row.reviewer}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-[#77766E] text-[11px] whitespace-nowrap">
                        {row.date}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-3 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === row.id ? null : row.id)
                          }
                          className="w-6 h-6 rounded text-[#77766E] hover:text-[#25251F] hover:bg-[#E5E1D8] inline-flex items-center justify-center"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {openMenuId === row.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-2 top-8 z-40 w-40 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl shadow-lg p-1 text-left text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  router.push(`/reviews?id=${row.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#F1EFE8] rounded-lg text-[#25251F]"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#68745D]" />
                                <span>View in Review</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5E1D8] text-xs text-[#77766E] shrink-0">
        <span className="text-[11px]">
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1} to{' '}
          {Math.min(safePage * perPage, filtered.length)} of {filtered.length} reviewed submissions
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
            <button
              key={pNum}
              type="button"
              onClick={() => setPage(pNum)}
              className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                safePage === pNum
                  ? 'bg-[#25251F] text-white shadow-2xs font-semibold'
                  : 'border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] hover:bg-[#F1EFE8]'
              }`}
            >
              {pNum}
            </button>
          ))}

          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
