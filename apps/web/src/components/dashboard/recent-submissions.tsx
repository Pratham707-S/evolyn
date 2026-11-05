'use client';

import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';

export interface SubmissionItem {
  id: string;
  title: string;
  timestamp: string;
  status: 'Approved' | 'Needs changes' | 'Pending';
}

interface RecentSubmissionsProps {
  submissions?: SubmissionItem[];
  onViewAll?: () => void;
  onSelectSubmission?: (submission: SubmissionItem) => void;
}

export function RecentSubmissions({
  submissions,
  onViewAll,
  onSelectSubmission,
}: RecentSubmissionsProps) {
  const defaultSubmissions: SubmissionItem[] = [
    {
      id: 'sub-1',
      title: 'Q3 Product Campaign (LinkedIn)',
      timestamp: '2h ago',
      status: 'Needs changes',
    },
    {
      id: 'sub-2',
      title: 'Website Hero Update',
      timestamp: '4h ago',
      status: 'Approved',
    },
    {
      id: 'sub-3',
      title: 'Product Launch Email',
      timestamp: '6h ago',
      status: 'Approved',
    },
    {
      id: 'sub-4',
      title: 'Customer Case Study',
      timestamp: 'Yesterday',
      status: 'Needs changes',
    },
  ];

  const items = submissions || defaultSubmissions;

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-lg font-normal text-[#25251F] tracking-tight">
            Recent Submissions
          </h2>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#A09D92] bg-[#F1EFE8] px-1.5 py-0.5 rounded">
            Demo Preview
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-[#77766E] hover:text-[#25251F] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Submissions list */}
      <div className="divide-y divide-[#E5E1D8]/50">
        {items.map((sub) => {
          const isApproved = sub.status === 'Approved';

          return (
            <div
              key={sub.id}
              onClick={() => onSelectSubmission?.(sub)}
              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-[#F7F5F0]/60 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-[#77766E] flex-shrink-0 group-hover:text-[#25251F] transition-colors" />
                <span className="text-xs font-medium text-[#25251F] truncate">
                  {sub.title}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-[#A09D92] whitespace-nowrap">
                  {sub.timestamp}
                </span>
                <span
                  className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full inline-block ${
                    isApproved
                      ? 'bg-[#E8EBE1] text-[#4E6B54]'
                      : 'bg-[#F5EFE6] text-[#8A6B3D]'
                  }`}
                >
                  {sub.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

