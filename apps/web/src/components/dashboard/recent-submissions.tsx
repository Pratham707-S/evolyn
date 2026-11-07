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
  isLive?: boolean;
  isLoading?: boolean;
  onViewAll?: () => void;
  onSelectSubmission?: (submission: SubmissionItem) => void;
}

export function RecentSubmissions({
  submissions,
  isLive = false,
  isLoading = false,
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

  const items = submissions !== undefined ? submissions : defaultSubmissions;

  return (
    <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-4 sm:p-5 flex flex-col justify-between h-full min-h-[340px]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <h2 className="font-serif text-base sm:text-lg font-normal text-[#25251F] tracking-tight">
            Recent Submissions
          </h2>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isLive
              ? 'text-[#4E6B54] bg-[#E8EBE1] border border-[#68745D]/20'
              : 'text-[#A09D92] bg-[#F1EFE8]'
          }`}>
            {isLive ? 'Live Database' : 'Demo Preview'}
          </span>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-[#77766E] hover:text-[#25251F] flex items-center gap-1 transition-colors shrink-0"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Submissions list */}
      {items.length === 0 ? (
        <div className="py-10 text-center my-auto">
          <p className="text-xs font-medium text-[#25251F]">No submissions in database</p>
          <p className="text-[11px] text-[#A09D92] mt-1">
            Upload or submit marketing content to start brand governance reviews.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E5E1D8]/50">
          {items.map((sub) => {
            const isApproved = sub.status === 'Approved';

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubmission?.(sub)}
                className="py-2.5 flex items-center justify-between gap-2 sm:gap-3 group hover:bg-[#F7F5F0]/60 -mx-1 sm:-mx-2 px-1 sm:px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#77766E] shrink-0 group-hover:text-[#25251F] transition-colors" />
                  <span className="text-xs font-medium text-[#25251F] truncate">
                    {sub.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <span className="text-[10px] sm:text-xs text-[#A09D92] whitespace-nowrap">
                    {sub.timestamp}
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium px-2 sm:px-2.5 py-0.5 rounded-full inline-block shrink-0 ${
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
      )}
    </div>
  );
}

