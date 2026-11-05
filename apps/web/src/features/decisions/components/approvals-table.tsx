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
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const perPage = 5;

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
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9]">
            Approved
          </span>
        );
      case 'Changes Requested':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA]">
            Changes Requested
          </span>
        );
      case 'Rejected':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDEAEA] text-[#B56E63] border border-[#F7C6C6]">
            Rejected
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
      if (channelFilter !== 'ALL' && item.channel.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.snippet.toLowerCase().includes(q) ||
          item.reviewerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, statusTab, channelFilter, search]);

  const totalDecisionsCount = 499;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full sm:w-56">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search approvals..."
            icon={<Search className="w-3.5 h-3.5" />}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
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
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>

          <button
            type="button"
            className="w-9 h-9 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#77766E] hover:bg-[#F1EFE8] flex items-center justify-center transition-colors"
            aria-label="Filter settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E1D8] text-[#77766E] font-medium pb-2 select-none">
              <th className="py-2.5 px-3 font-normal text-[#77766E]">Content</th>
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
                      isSelected
                        ? 'bg-[#F9F7F2]'
                        : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {/* Content */}
                    <td className="py-3 px-3 max-w-[200px] sm:max-w-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-[#F1EFE8] border border-[#E5E1D8] flex items-center justify-center text-[#25251F] shrink-0 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-[#25251F] group-hover:text-[#68745D] transition-colors truncate">
                            {row.title}
                          </p>
                          <p className="text-[11px] text-[#77766E] truncate mt-0.5">
                            {row.snippet}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        {getChannelIcon(row.channel)}
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
                              <ExternalLink className="w-3.5 h-3.5" />
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

      {/* Pagination Footer */}
      <div className="pt-3 border-t border-[#E5E1D8]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#77766E]">
        <p>
          Showing 1-{Math.min(5, filtered.length)} of {totalDecisionsCount} decisions
        </p>

        <div className="flex items-center gap-1 self-center sm:self-auto select-none">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
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
            onClick={() => setPage(100)}
            className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] font-medium flex items-center justify-center hover:bg-[#F1EFE8]"
          >
            100
          </button>

          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

