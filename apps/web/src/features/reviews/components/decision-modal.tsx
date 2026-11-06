'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionTitle: string;
  decisionType: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
  onConfirm: (comments: string, reviewerName: string) => void;
}

export function DecisionModal({
  isOpen,
  onClose,
  submissionTitle,
  decisionType,
  onConfirm,
}: DecisionModalProps) {
  const [comments, setComments] = useState('');
  const [reviewerName, setReviewerName] = useState('Brand Guardian / Reviewer');

  if (!isOpen) return null;

  const isApproval = decisionType === 'APPROVED';
  const isChanges = decisionType === 'CHANGES_REQUESTED';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(comments || (isApproval ? 'All claims verified and tone approved.' : 'Please address the highlighted guideline findings.'), reviewerName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E1D8] flex items-start justify-between bg-[#FDFCF7]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isApproval
                  ? 'bg-[#EEF4EE] text-[#4E6B54]'
                  : isChanges
                  ? 'bg-[#FDF2EC] text-[#B56E63]'
                  : 'bg-[#FDF2EC] text-[#B56E63]'
              }`}
            >
              {isApproval ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-xl text-[#25251F]">
                {isApproval ? 'Confirm Brand Approval' : 'Request Copy Changes'}
              </h3>
              <p className="text-xs text-[#77766E] mt-0.5 line-clamp-1">
                {submissionTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#25251F] mb-1">
              Reviewer Name / Role
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full bg-[#F7F5F0] border border-[#E5E1D8] rounded-lg px-3 py-2 text-xs text-[#25251F] focus:outline-none focus:border-[#68745D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#25251F] mb-1">
              Reviewer Notes / Decision Rationale
            </label>
            <textarea
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={
                isApproval
                  ? 'e.g., Conforms with Q3 voice standards, claim citations verified against SOC 2 documentation.'
                  : 'e.g., Clarify performance metrics; remove unverified 100% guarantee from lead paragraph.'
              }
              className="w-full bg-[#F7F5F0] border border-[#E5E1D8] rounded-lg p-3 text-xs text-[#25251F] placeholder:text-[#A09D92] focus:outline-none focus:border-[#68745D]"
            />
          </div>

          <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#77766E]">
            <ShieldAlert className="w-4 h-4 text-[#B78A4A] shrink-0 mt-0.5" />
            <p>
              This decision will be cryptographically logged to the permanent audit trail with your reviewer identity and timestamp.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={isApproval ? 'primary' : 'danger'}
              size="sm"
              type="submit"
            >
              {isApproval ? 'Sign & Approve' : 'Submit Change Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
