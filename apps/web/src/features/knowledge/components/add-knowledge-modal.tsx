'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  KnowledgeItem,
  KnowledgeTypeLabel,
  KnowledgeCategoryId,
} from '../data/knowledge-data';

interface AddKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: KnowledgeItem) => void;
  showToast: (msg: string) => void;
}

export function AddKnowledgeModal({
  isOpen,
  onClose,
  onAdd,
  showToast,
}: AddKnowledgeModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [type, setType] = useState<KnowledgeTypeLabel>('Product Facts');
  const [product, setProduct] = useState('Evolyn Platform');
  const [summary, setSummary] = useState('');
  const [ownedBy, setOwnedBy] = useState('Brand Team');
  const [proofSource, setProofSource] = useState('');
  const [keyFacts, setKeyFacts] = useState<string[]>([
    'Core verified product capability statement.',
    'Evidence-backed for AI automated compliance review.',
  ]);
  const [newFact, setNewFact] = useState('');

  if (!isOpen) return null;

  const handleAddFact = () => {
    if (newFact.trim()) {
      setKeyFacts([...keyFacts, newFact.trim()]);
      setNewFact('');
    }
  };

  const handleRemoveFact = (index: number) => {
    setKeyFacts(keyFacts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a title for this knowledge resource');
      return;
    }

    const categoryMap: Record<KnowledgeTypeLabel, KnowledgeCategoryId> = {
      'Product Facts': 'product-facts',
      'Evidence & Studies': 'evidence-studies',
      'Approved Claims': 'approved-claims',
      Terminology: 'terminology',
      'Reference Docs': 'reference-docs',
    };

    const newItem: KnowledgeItem = {
      id: `kn-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Approved brand knowledge asset...',
      type,
      categoryId: categoryMap[type] || 'product-facts',
      product,
      status: 'Approved',
      lastUpdated: 'Just now',
      updatedAtDate: new Date().toISOString(),
      ownedBy: ownedBy.trim() || 'Brand Team',
      version: 'v1.0',
      summary:
        summary.trim() ||
        `Authoritative documentation and verified brand proof for ${title}.`,
      keyFacts: keyFacts.length > 0 ? keyFacts : ['Verified for automated review.'],
      content: `## ${title}\n\nApproved baseline content and operational specifications for ${product}.`,
      proofSource: proofSource.trim() || 'Internal Brand Authority Spec 2026',
      proofSourceUrl: undefined,
      usageStats: {
        linkedSubmissions: 0,
        activeRulesCount: 1,
        lastUsedReview: 'Pending first review run',
      },
      versionHistory: [
        {
          version: 'v1.0',
          date: 'Just now',
          author: ownedBy,
          notes: 'Initial knowledge asset creation.',
        },
      ],
    };

    onAdd(newItem);
    showToast(`Added "${newItem.title}" to Knowledge Library`);
    onClose();

    // Reset form
    setTitle('');
    setSubtitle('');
    setSummary('');
    setProofSource('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FFFEFA] border border-[#E5E1D8] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E1D8] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F1EA] text-[#25251F] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-[#25251F] leading-tight">
                Add Knowledge Resource
              </h2>
              <p className="text-xs text-[#77766E] mt-0.5">
                Ingest verified claims, evidence, and terminology into the brand memory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#F1EFE8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Core Engine Accuracy Benchmark (2026)"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1">
              Brief Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Brief summary line shown in table list..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
            />
          </div>

          {/* Type & Product (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KnowledgeTypeLabel)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Product Facts">Product Facts</option>
                <option value="Evidence & Studies">Evidence & Studies</option>
                <option value="Approved Claims">Approved Claims</option>
                <option value="Terminology">Terminology</option>
                <option value="Reference Docs">Reference Docs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">
                Product / Domain
              </label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F]"
              >
                <option value="Evolyn Platform">Evolyn Platform</option>
                <option value="Brand">Brand</option>
                <option value="Enterprise Suite">Enterprise Suite</option>
                <option value="Mobile App">Mobile App</option>
                <option value="All Products">All Products</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1">
              Summary Description
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Authoritative overview of this resource for humans and AI review agents..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F] text-[#25251F] resize-none"
            />
          </div>

          {/* Key Facts list */}
          <div>
            <label className="block text-xs font-semibold text-[#25251F] mb-1">
              Key Facts (for AI Review)
            </label>
            <div className="space-y-1.5 mb-2">
              {keyFacts.map((fact, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#F9F8F5] px-2.5 py-1.5 rounded-lg border border-[#EFECE6] text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25251F] flex-shrink-0" />
                  <span className="flex-1 text-[#25251F]">{fact}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFact(idx)}
                    className="text-[#77766E] hover:text-[#B91C1C] transition-colors p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFact}
                onChange={(e) => setNewFact(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFact();
                  }
                }}
                placeholder="Add bullet fact and press Enter..."
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5E1D8] rounded-lg focus:outline-none focus:border-[#25251F]"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddFact}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Owned By & Proof Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">
                Owner Team
              </label>
              <input
                type="text"
                value={ownedBy}
                onChange={(e) => setOwnedBy(e.target.value)}
                placeholder="e.g. Brand Team, Legal"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#25251F] mb-1">
                Verified Proof Citation
              </label>
              <input
                type="text"
                value={proofSource}
                onChange={(e) => setProofSource(e.target.value)}
                placeholder="e.g., Memo LG-2026 or URL"
                className="w-full px-3 py-2 text-xs bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#25251F]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-end gap-2.5">
            <Button type="button" variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              Save Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

