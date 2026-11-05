'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  XCircle,
  Linkedin,
  Globe,
  Mail,
  BookOpen,
  Instagram,
} from 'lucide-react';
import { Select } from '../../../components/ui/select';

export interface TimelineDecision {
  id: string;
  title: string;
  channel: 'LinkedIn' | 'Website' | 'Email' | 'Blog' | 'Instagram' | string;
  decision: 'Approved' | 'Changes Requested' | 'Rejected';
  reviewerName: string;
  timeAgo: string;
  submissionId: string;
  content: string;
  decisionNote: string;
  findingsCount: number;
  timelineSteps: Array<{
    title: string;
    description: string;
    timeAgo: string;
    completed: boolean;
  }>;
}

export interface DecisionHistoryTimelineProps {
  items: TimelineDecision[];
  selectedId: string;
  onSelect: (item: TimelineDecision) => void;
  statusFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export function DecisionHistoryTimeline({
  items,
  selectedId,
  onSelect,
  statusFilter,
  onFilterChange,
}: DecisionHistoryTimelineProps) {
  const [localFilter, setLocalFilter] = useState('ALL');

  const activeFilter = statusFilter || (localFilter === 'ALL' ? null : localFilter);

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

  const filteredItems = items.filter((item) => {
    if (!activeFilter || activeFilter === 'ALL') return true;
    return item.decision.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* Header with Title and Filter Dropdown */}
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#25251F] tracking-tight">
          Decision Timeline
        </h2>

        <Select
          value={activeFilter || 'ALL'}
          onChange={(e) => {
            const val = e.target.value === 'ALL' ? null : e.target.value;
            setLocalFilter(e.target.value);
            if (onFilterChange) onFilterChange(val);
          }}
          className="h-8 text-xs font-normal"
        >
          <option value="ALL">All Decisions</option>
          <option value="Approved">Approved</option>
          <option value="Changes Requested">Changes Requested</option>
          <option value="Rejected">Rejected</option>
        </Select>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[1.5px] before:bg-[#E5E1D8]">
        {filteredItems.map((item) => {
          const isSelected = item.id === selectedId;

          // Determine color & icons based on decision
          let nodeColor = 'bg-[#64816A]';
          let iconBg = 'bg-[#EEF4EE] text-[#4E6B54]';
          let IconComponent = CheckCircle2;
          let actionText = `Approved by ${item.reviewerName}`;

          if (item.decision === 'Changes Requested') {
            nodeColor = 'bg-[#B78A4A]';
            iconBg = 'bg-[#FEF7EC] text-[#B78A4A]';
            IconComponent = Edit3;
            actionText = `Changes requested by ${item.reviewerName}`;
          } else if (item.decision === 'Rejected') {
            nodeColor = 'bg-[#B56E63]';
            iconBg = 'bg-[#FDEAEA] text-[#B56E63]';
            IconComponent = XCircle;
            actionText = `Rejected by ${item.reviewerName}`;
          }

          return (
            <div key={item.id} className="relative group">
              {/* Timeline Node Bullet on the vertical line */}
              <div
                className={`absolute -left-[19px] top-4 w-2 h-2 rounded-full ring-4 ring-[#FFFEFA] transition-transform ${nodeColor} ${
                  isSelected ? 'scale-125' : ''
                }`}
              />

              {/* Card Container */}
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#FDFBF7] border-[#68745D] ring-1 ring-[#68745D]/20 shadow-2xs'
                    : 'bg-[#FFFEFA] border-[#E5E1D8] hover:border-[#68745D]/40 hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium text-xs sm:text-sm text-[#25251F] group-hover:text-[#68745D] transition-colors truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#77766E] truncate mt-0.5">
                      <span className="shrink-0">{getChannelIcon(item.channel)}</span>
                      <span className="font-normal text-[#25251F]">{item.channel}</span>
                      <span>•</span>
                      <span className="truncate">{actionText}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-[#77766E] whitespace-nowrap shrink-0 font-normal">
                  {item.timeAgo}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

