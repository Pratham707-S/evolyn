'use client';

import React from 'react';
import {
  FileText,
  Clock,
  User,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { ContentSubmission } from '@evolyn/shared';
import { DecisionBadge } from './decision-badge';

interface ApprovalQueueProps {
  submissions: ContentSubmission[];
  selectedId: string | null;
  onSelect: (submission: ContentSubmission) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export function ApprovalQueue({
  submissions,
  selectedId,
  onSelect,
  isLoading,
  onRefresh,
}: ApprovalQueueProps) {
  const [search, setSearch] = React.useState('');
  const [channelFilter, setChannelFilter] = React.useState<string>('ALL');

  const filtered = submissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(search.toLowerCase()) ||
      sub.submittedBy.toLowerCase().includes(search.toLowerCase());
    const matchesChannel =
      channelFilter === 'ALL' || sub.channel === channelFilter;
    return matchesSearch && matchesChannel;
  });

  const channels = ['ALL', ...Array.from(new Set(submissions.map((s) => s.channel)))];

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-4 flex flex-col h-full space-y-3">
      {/* Queue Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-lg text-[#25251F] tracking-tight">
            Approval Queue
          </h2>
          <span className="text-xs font-mono bg-[#EBF0F5] text-[#4A6478] px-2 py-0.5 rounded-full font-semibold">
            {submissions.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh Queue"
          className="p-1.5 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter and Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#A09D92] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E1D8] bg-[#F7F5F0]/60 text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:ring-1 focus:ring-[#68745D]"
          />
        </div>

        {channels.length > 2 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
            {channels.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                  channelFilter === ch
                    ? 'bg-[#25251F] text-white font-medium'
                    : 'bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F]'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Queue Items */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {isLoading && submissions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#77766E] space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#68745D]" />
            <p>Loading approval queue from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#77766E] space-y-2 px-4">
            <CheckCircle2 className="w-6 h-6 text-[#64816A] mx-auto" />
            <p className="font-medium text-[#25251F]">Queue is Clear</p>
            <p className="text-[11px] text-[#A09D92]">
              {submissions.length === 0
                ? 'No submissions are currently awaiting human review.'
                : 'No submissions match your active filter.'}
            </p>
          </div>
        ) : (
          filtered.map((sub) => {
            const isSelected = selectedId === sub.id;
            return (
              <div
                key={sub.id}
                onClick={() => onSelect(sub)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(sub);
                  }
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2 ${
                  isSelected
                    ? 'border-[#68745D] bg-[#FFFEFA] shadow-xs ring-1 ring-[#68745D]'
                    : 'border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F7F5F0]/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-[#77766E] mt-0.5 flex-shrink-0" />
                    <h3 className="text-xs font-semibold text-[#25251F] line-clamp-1">
                      {sub.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#F1EFE8] text-[#77766E] px-1.5 py-0.5 rounded flex-shrink-0">
                    {sub.channel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#A09D92] pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{sub.submittedBy}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-0.5">
                  <DecisionBadge decision={sub.status} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
