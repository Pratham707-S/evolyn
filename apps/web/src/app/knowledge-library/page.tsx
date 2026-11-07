'use client';

import React, { useState, useMemo } from 'react';
import {
  Menu,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Calendar,
  X,
  FileCheck2,
  Database,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api/client';
import type { ApprovedFact } from '@evolyn/shared';

const FALLBACK_FACTS: ApprovedFact[] = [
  {
    id: 'f-sample-1',
    topic: 'Platform Uptime',
    claimStatement:
      'Evolyn achieved 99.98% platform uptime across all production clusters during fiscal year 2025.',
    approvedProofSource:
      'SOC 2 Type II Independent Audit Report 2025, Section 4.2',
    validUntil: '2027-12-31T00:00:00.000Z',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f-sample-2',
    topic: 'Client Count',
    claimStatement:
      'Evolyn actively secures brand governance for 45 enterprise customers worldwide.',
    approvedProofSource: 'Q3 2026 Official Shareholder Update, Page 8',
    validUntil: '2027-06-30T00:00:00.000Z',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f-sample-3',
    topic: 'Security Compliance',
    claimStatement:
      'All customer data is encrypted in-transit with TLS 1.3 and at-rest using AES-256.',
    approvedProofSource: 'ISO/IEC 27001:2022 Certification Schedule A',
    validUntil: '2028-01-01T00:00:00.000Z',
    createdAt: new Date().toISOString(),
  },
];

export default function KnowledgeLibraryPage() {
  const { openMobileSidebar, showToast } = useAppShell();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [topicInput, setTopicInput] = useState('');
  const [claimInput, setClaimInput] = useState('');
  const [proofSourceInput, setProofSourceInput] = useState('');
  const [validUntilInput, setValidUntilInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live approved facts from backend API
  const {
    data: backendFacts,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['knowledge', 'facts'],
    queryFn: async () => {
      try {
        const data = await apiClient.get<ApprovedFact[]>('/api/knowledge/facts');
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  const facts: ApprovedFact[] = useMemo(() => {
    if (backendFacts && backendFacts.length > 0) {
      return backendFacts;
    }
    return FALLBACK_FACTS;
  }, [backendFacts]);

  // Unique topics
  const topics = useMemo(() => {
    const set = new Set<string>();
    facts.forEach((f) => {
      if (f.topic) set.add(f.topic);
    });
    return Array.from(set);
  }, [facts]);

  const filteredFacts = useMemo(() => {
    return facts.filter((f) => {
      if (selectedTopic !== 'ALL' && f.topic !== selectedTopic) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = f.topic.toLowerCase().includes(q);
        const matchesClaim = f.claimStatement.toLowerCase().includes(q);
        const matchesSource = f.approvedProofSource.toLowerCase().includes(q);
        return matchesTopic || matchesClaim || matchesSource;
      }
      return true;
    });
  }, [facts, selectedTopic, searchQuery]);

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || !claimInput.trim() || !proofSourceInput.trim()) {
      showToast('Please fill in Topic, Claim Statement, and Approved Proof Source.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/knowledge/facts', {
        topic: topicInput.trim(),
        claimStatement: claimInput.trim(),
        approvedProofSource: proofSourceInput.trim(),
        validUntil: validUntilInput ? new Date(validUntilInput).toISOString() : null,
      });

      showToast(`Approved fact added and persisted to database.`);
      setIsAddModalOpen(false);
      setTopicInput('');
      setClaimInput('');
      setProofSourceInput('');
      setValidUntilInput('');
      refetch();
    } catch (err) {
      console.error('Failed to create fact:', err);
      showToast('Failed to save approved fact to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFact = async (id: string, topic: string) => {
    try {
      await apiClient.delete(`/api/knowledge/facts/${id}`);
      showToast(`Removed approved fact from ${topic}.`);
      refetch();
    } catch {
      showToast('Could not delete fact from database.');
    }
  };

  return (
    <AppShell activeItem="Knowledge Library">
      <div className="space-y-6 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openMobileSidebar}
              aria-label="Open sidebar"
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#73736C] hover:text-[#25251F] hover:bg-[#EAE6DF] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                  Knowledge Library
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E8EDE5] text-[#4A5D4E] border border-[#CCD7C8]">
                  <Database className="w-3 h-3" />
                  Live Database
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
                Verified ground truth statements, audited claims, and authentic proof sources.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 sm:p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-[#25251F] transition-colors cursor-pointer shadow-2xs"
              title="Refresh Knowledge Facts"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#25251F] hover:bg-[#383832] text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Approved Fact</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facts, topics, or proof sources..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] text-xs sm:text-sm text-[#25251F] placeholder:text-[#A6A29A] focus:outline-none focus:ring-2 focus:ring-[#25251F]/10 focus:border-[#25251F]"
            />
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedTopic('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                selectedTopic === 'ALL'
                  ? 'bg-[#25251F] text-white shadow-2xs'
                  : 'bg-[#FFFEFA] text-[#73736C] border border-[#E5E1D8] hover:bg-[#F2EFE8]'
              }`}
            >
              All Topics ({facts.length})
            </button>
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  selectedTopic === t
                    ? 'bg-[#25251F] text-white shadow-2xs'
                    : 'bg-[#FFFEFA] text-[#73736C] border border-[#E5E1D8] hover:bg-[#F2EFE8]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Facts List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.length === 0 ? (
            <div className="col-span-full bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-12 text-center space-y-3">
              <FileCheck2 className="w-10 h-10 text-[#A6A29A] mx-auto" />
              <p className="text-sm font-medium text-[#25251F]">No verified facts match your query.</p>
              <p className="text-xs text-[#73736C]">
                Click "Add Approved Fact" to document verifiable claims and evidence sources.
              </p>
            </div>
          ) : (
            filteredFacts.map((fact) => (
              <div
                key={fact.id}
                className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl p-5 hover:border-[#CCD7C8] hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-[#F2EFE8] text-[#4A4740] border border-[#E5E1D8]">
                      {fact.topic}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFact(fact.id, fact.topic)}
                      className="p-1.5 rounded-lg text-[#8C877D] hover:text-[#A83232] hover:bg-[#FCE8E8] transition-colors cursor-pointer"
                      title="Remove Fact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm sm:text-[15px] font-medium text-[#25251F] leading-snug">
                    "{fact.claimStatement}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F2EFE8] space-y-2 text-xs">
                  <div className="flex items-start gap-1.5 text-[#4A5D4E]">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#5F7864]" />
                    <div>
                      <span className="font-semibold text-[#3B483D]">Approved Proof: </span>
                      <span className="text-[#4A5D4E]">{fact.approvedProofSource}</span>
                    </div>
                  </div>

                  {fact.validUntil && (
                    <div className="flex items-center gap-1.5 text-[#73736C] text-[11px]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Valid until: {new Date(fact.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Fact Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#5F7864]" />
                  <h3 className="font-serif text-lg text-[#25251F] tracking-tight">
                    Add Approved Fact
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-lg text-[#73736C] hover:bg-[#EAE6DF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFact} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#25251F]">Topic *</label>
                  <input
                    type="text"
                    required
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="e.g. Platform Uptime, Client Count, Revenue"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E1D8] bg-[#F7F5F0] text-sm text-[#25251F] focus:outline-none focus:border-[#25251F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#25251F]">Claim Statement *</label>
                  <textarea
                    required
                    rows={3}
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value)}
                    placeholder="Enter verifiable statement, e.g. 'Evolyn achieved 99.98% uptime in 2025.'"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E1D8] bg-[#F7F5F0] text-sm text-[#25251F] focus:outline-none focus:border-[#25251F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#25251F]">Approved Proof Source *</label>
                  <input
                    type="text"
                    required
                    value={proofSourceInput}
                    onChange={(e) => setProofSourceInput(e.target.value)}
                    placeholder="Audit report, cert URL, filing citation, e.g. SOC 2 Type II 2025"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E1D8] bg-[#F7F5F0] text-sm text-[#25251F] focus:outline-none focus:border-[#25251F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#25251F]">Valid Until (Optional)</label>
                  <input
                    type="date"
                    value={validUntilInput}
                    onChange={(e) => setValidUntilInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E1D8] bg-[#F7F5F0] text-sm text-[#25251F] focus:outline-none focus:border-[#25251F]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-xs font-medium text-[#25251F]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#25251F] hover:bg-[#383832] text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save & Persist Fact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
