'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
  Eye,
  Trash2,
  Share2,
} from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { SubmissionData, SubmissionPreviewModal } from './submission-preview-modal';

export interface SubmissionsTableProps {
  initialSubmissions: SubmissionData[];
  statusFilter?: string | null;
  onStatusFilterChange?: (status: string | null) => void;
  onDeleteSubmission?: (id: string) => void;
  onDeleteManySubmissions?: (ids: string[]) => void;
}

export function SubmissionsTable({
  initialSubmissions,
  statusFilter,
  onStatusFilterChange,
  onDeleteSubmission,
  onDeleteManySubmissions,
}: SubmissionsTableProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionData[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);
  const [previewItem, setPreviewItem] = useState<SubmissionData | null>(null);

  const itemsPerPage = 5;

  // Sync internal items if props change
  React.useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  // Close floating menu on scroll or resize so it doesn't detach
  React.useEffect(() => {
    const handleClose = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
        setMenuCoords(null);
      }
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [activeMenuId]);

  const handleOpenMenu = (itemId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeMenuId === itemId) {
      setActiveMenuId(null);
      setMenuCoords(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 135;
    const openUpwards = spaceBelow < menuHeight;
    setMenuCoords({
      top: openUpwards ? rect.top - menuHeight : rect.bottom + 4,
      right: Math.max(16, window.innerWidth - rect.right),
    });
    setActiveMenuId(itemId);
  };

  // Channel Icon Resolver
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

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EEF4EE] text-[#4E6B54] border border-[#D4DBC9] whitespace-nowrap">
            Approved
          </span>
        );
      case 'Needs Changes':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2EC] text-[#B56E63] border border-[#F2D7CA] whitespace-nowrap">
            Needs Changes
          </span>
        );
      case 'Pending Review':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F1EA] text-[#77766E] border border-[#E5E1D8] whitespace-nowrap">
            Pending Review
          </span>
        );
    }
  };

  // Filter and sort items
  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter((item) => {
        // Status filter
        if (statusFilter && statusFilter !== 'ALL' && item.status !== statusFilter) {
          return false;
        }
        // Channel filter
        if (channelFilter !== 'ALL' && item.channel.toLowerCase() !== channelFilter.toLowerCase()) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.excerpt.toLowerCase().includes(q) ||
            item.channel.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return b.id.localeCompare(a.id);
        if (sortBy === 'OLDEST') return a.id.localeCompare(b.id);
        if (sortBy === 'TITLE') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [submissions, statusFilter, channelFilter, searchQuery, sortBy]);

  // Total pages
  const totalCount = submissions.length;
  const displayedTotal = filteredSubmissions.length;
  const totalPages = Math.max(1, Math.ceil(displayedTotal / itemsPerPage));
  const paginatedItems = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedItems.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onDeleteSubmission) {
      onDeleteSubmission(id);
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setActiveMenuId(null);
    setMenuCoords(null);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (onDeleteManySubmissions) {
      onDeleteManySubmissions(ids);
    } else {
      setSubmissions((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Bulk actions banner */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-2.5 px-4 bg-[#25251F] text-white rounded-xl shadow-xs text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedIds.size} submission{selectedIds.size > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-xs text-[#E5E1D8] hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B56E63] hover:bg-[#a05c52] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Section Header & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight">
          All Submissions
        </h2>

        {/* Toolbar: Search & Select Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="w-full sm:w-60">
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search submissions..."
              icon={<Search className="w-3.5 h-3.5" />}
              className="bg-[#FFFEFA] h-9 text-xs"
            />
          </div>

          {/* Status Dropdown */}
          <Select
            value={statusFilter || 'ALL'}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? null : e.target.value;
              if (onStatusFilterChange) onStatusFilterChange(val);
              setCurrentPage(1);
            }}
            className="h-9 text-xs"
          >
            <option value="ALL">All Status</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Needs Changes">Needs Changes</option>
          </Select>

          {/* Channel Dropdown */}
          <Select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setCurrentPage(1);
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

          {/* Sort Dropdown */}
          <Select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-xs"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="TITLE">Title A-Z</option>
          </Select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#FFFEFA] dark:bg-[#1E1D19] border border-[#E5E1D8] dark:border-[#2C2B26] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E1D8] dark:border-[#2C2B26] bg-[#FAF8F5]/60 dark:bg-[#262520] text-[#77766E] dark:text-[#A09D92] font-medium select-none">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedItems.length > 0 &&
                      paginatedItems.every((item) => selectedIds.has(item.id))
                    }
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-[#E5E1D8] text-[#68745D] accent-[#68745D] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92]">Content</th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92] w-36">Channel</th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92] w-32">Status</th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92] w-28">Submitted</th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92] w-32">Latest Review</th>
                <th className="py-3 px-4 font-normal text-[#77766E] dark:text-[#A09D92] w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1D8]/60 dark:divide-[#2C2B26]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#77766E] dark:text-[#A09D92]">
                    <FileText className="w-8 h-8 text-[#A09D92] mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-medium text-[#25251F] dark:text-[#F7F5F0]">No submissions found</p>
                    <p className="text-xs text-[#A09D92] mt-1">
                      Try resetting your search query or channel/status filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setChannelFilter('ALL');
                        if (onStatusFilterChange) onStatusFilterChange(null);
                      }}
                      className="mt-3"
                    >
                      Reset Filters
                    </Button>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const isMenuOpen = activeMenuId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setPreviewItem(item)}
                      className={`group hover:bg-[#F9F7F2]/60 dark:hover:bg-[#262520] transition-colors cursor-pointer ${
                        isChecked ? 'bg-[#F4F1EA]/40 dark:bg-[#2A2924]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-3.5 h-3.5 rounded border-[#E5E1D8] text-[#68745D] accent-[#68745D] cursor-pointer"
                        />
                      </td>

                      {/* Content (File icon + Title + Excerpt) */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-[#F1EFE8] dark:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] flex items-center justify-center text-[#25251F] dark:text-[#F7F5F0] shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs sm:text-sm text-[#25251F] dark:text-[#F7F5F0] group-hover:text-[#68745D] dark:group-hover:text-[#8A987D] transition-colors truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#77766E] dark:text-[#A09D92] truncate mt-0.5 max-w-[280px] sm:max-w-md">
                              {item.excerpt}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#25251F] dark:text-[#F7F5F0]">
                          {getChannelIcon(item.channel)}
                          <span className="font-normal">{item.channel}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Submitted Time */}
                      <td className="py-3.5 px-4 text-[#77766E] dark:text-[#A09D92] text-xs font-normal">
                        {item.submittedAt}
                      </td>

                      {/* Latest Review Time */}
                      <td className="py-3.5 px-4 text-[#77766E] dark:text-[#A09D92] text-xs font-normal">
                        {item.latestReview}
                      </td>

                      {/* Actions Menu */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* Direct 1-Click Delete Button (No scrolling or dropdown needed!) */}
                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            title="Delete Submission"
                            className="w-7 h-7 rounded-md text-[#A09D92] hover:text-[#B56E63] hover:bg-[#FBEBE8] inline-flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Delete Submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* More Options Dropdown Button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(item.id, e)}
                            className={`w-7 h-7 rounded-md transition-colors cursor-pointer inline-flex items-center justify-center ${
                              isMenuOpen
                                ? 'bg-[#25251F] text-white'
                                : 'text-[#77766E] hover:text-[#25251F] hover:bg-[#E5E1D8]/60'
                            }`}
                            aria-label="More Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Floating Unclipped Dropdown Menu */}
                        {isMenuOpen && menuCoords && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => {
                                setActiveMenuId(null);
                                setMenuCoords(null);
                              }}
                            />
                            <div
                              style={{
                                position: 'fixed',
                                top: `${menuCoords.top}px`,
                                right: `${menuCoords.right}px`,
                              }}
                              className="z-50 w-48 bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl shadow-xl p-1.5 text-left animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setMenuCoords(null);
                                  router.push(`/reviews?id=${item.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#25251F] hover:bg-[#F1EFE8] rounded-lg transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-[#68745D]" />
                                <span>Review Workspace</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setMenuCoords(null);
                                  setPreviewItem(item);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#25251F] hover:bg-[#F1EFE8] rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#77766E]" />
                                <span>Quick Preview</span>
                              </button>

                              <div className="my-1 border-t border-[#E5E1D8]/60" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  setMenuCoords(null);
                                  handleDelete(item.id, e);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#B56E63] hover:bg-[#FBEBE8] rounded-lg transition-colors cursor-pointer font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Submission</span>
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

        {/* Bottom Pagination Bar */}
        <div className="p-3.5 px-4 bg-[#FAF8F5]/50 dark:bg-[#1E1D19] border-t border-[#E5E1D8] dark:border-[#2C2B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#77766E] dark:text-[#A09D92]">
          {/* Summary Label: "Showing 1-5 of 12 submissions" */}
          <p>
            Showing{' '}
            <strong className="text-[#25251F] dark:text-[#F7F5F0] font-medium">
              {displayedTotal === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, displayedTotal)}
            </strong>{' '}
            of{' '}
            <strong className="text-[#25251F] dark:text-[#F7F5F0] font-medium">
              {displayedTotal}
            </strong>{' '}
            submissions
          </p>

          {/* Dynamic Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto select-none">
              {/* Prev Button */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-[#E5E1D8] dark:border-[#2C2B26] bg-[#FFFEFA] dark:bg-[#262520] text-[#25251F] dark:text-[#F7F5F0] flex items-center justify-center hover:bg-[#F1EFE8] dark:hover:bg-[#33322C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Dynamic Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                    currentPage === pageNum
                      ? 'bg-[#25251F] dark:bg-[#F7F5F0] text-white dark:text-[#141412] shadow-xs'
                      : 'bg-[#FFFEFA] dark:bg-[#262520] border border-[#E5E1D8] dark:border-[#2C2B26] text-[#25251F] dark:text-[#F7F5F0] hover:bg-[#F1EFE8] dark:hover:bg-[#33322C]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next Button */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg border border-[#E5E1D8] bg-[#FFFEFA] text-[#25251F] flex items-center justify-center hover:bg-[#F1EFE8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Quick Preview Modal */}
      <SubmissionPreviewModal
        submission={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
