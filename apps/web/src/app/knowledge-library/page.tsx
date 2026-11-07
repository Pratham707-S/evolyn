'use client';

import React, { useState, useMemo } from 'react';
import { Download, Plus, Layers, Eye } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  KnowledgeCategoryId,
  KnowledgeCategoryMetric,
  KnowledgeItem,
  INITIAL_KNOWLEDGE_CATEGORIES,
  INITIAL_KNOWLEDGE_ITEMS,
  KnowledgeMetrics,
  KnowledgeTable,
  KnowledgeInspector,
  AddKnowledgeModal,
  ImportKnowledgeModal,
} from '@/features/knowledge';

export default function KnowledgeLibraryPage() {
  const { showToast } = useAppShell();

  // Primary dataset & selection
  const [items, setItems] = useState<KnowledgeItem[]>(INITIAL_KNOWLEDGE_ITEMS);
  const [selectedItemId, setSelectedItemId] = useState<string>(INITIAL_KNOWLEDGE_ITEMS[0]?.id || '');

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<KnowledgeCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Mobile view toggle (between list and detail inspector)
  const [mobileView, setMobileView] = useState<'list' | 'inspector'>('list');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Compute live category counts based on current items list
  const categoriesWithCounts: KnowledgeCategoryMetric[] = useMemo(() => {
    return INITIAL_KNOWLEDGE_CATEGORIES.map((cat) => {
      if (cat.id === 'all') {
        // Base count + any newly added items beyond initial dataset
        return {
          ...cat,
          count: Math.max(cat.count, items.length),
        };
      }
      const matchCount = items.filter((i) => i.categoryId === cat.id).length;
      return {
        ...cat,
        count: Math.max(cat.count, matchCount),
      };
    });
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category card filter
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }

      // Type dropdown filter
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }

      // Product dropdown filter
      if (selectedProduct !== 'ALL' && item.product !== selectedProduct) {
        return false;
      }

      // Status dropdown filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      // Search input filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchProduct = item.product.toLowerCase().includes(q);
        const matchSummary = item.summary.toLowerCase().includes(q);
        return matchTitle || matchSubtitle || matchProduct || matchSummary;
      }

      return true;
    });
  }, [items, selectedCategoryId, selectedType, selectedProduct, selectedStatus, searchQuery]);

  // Selected item object
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || filteredItems[0] || null;
  }, [items, selectedItemId, filteredItems]);

  // Handlers
  const handleSelectCategory = (catId: KnowledgeCategoryId) => {
    setSelectedCategoryId(catId);
    // If a specific category is selected, align the type dropdown or reset
    if (catId === 'all') {
      setSelectedType('ALL');
    }
  };

  const handleSelectItem = (item: KnowledgeItem) => {
    setSelectedItemId(item.id);
    // On small screens, switch to inspector view automatically when tapping a row
    setMobileView('inspector');
  };

  const handleAddItem = (newItem: KnowledgeItem) => {
    setItems((prev) => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
    setMobileView('inspector');
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Resource deleted successfully');
    if (selectedItemId === id) {
      const remaining = items.filter((i) => i.id !== id);
      if (remaining.length > 0) {
        setSelectedItemId(remaining[0].id);
      }
    }
  };

  const handleImportComplete = (count: number) => {
    showToast(`Ingested ${count} verified facts from documentation`);
  };

  return (
    <AppShell activeItem="Knowledge Library" noScroll={true}>
      <div className="h-full flex flex-col gap-2.5 sm:gap-3 min-h-0">
        {/* Page Header (Compact & clean) */}
        <PageHeader
          title="Knowledge Library"
          description="Manage your brand's approved facts, evidence, sources, and reference materials for accurate reviews."
          showNotificationBell={true}
          unreadNotificationsCount={1}
          compact={true}
          actions={
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white"
              >
                <Download className="w-4 h-4 mr-1 text-[#25251F]" />
                Import
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#18181B] text-white hover:bg-[#27272A]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Knowledge
              </Button>
            </>
          }
        />

        {/* Top Metric & Category Cards Bar */}
        <div className="shrink-0">
          <KnowledgeMetrics
            categories={categoriesWithCounts}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Mobile View Toggle Switch (visible on < lg screens) */}
        <div className="lg:hidden shrink-0 flex items-center bg-[#ECE9E0] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'list'
                ? 'bg-white text-[#25251F] shadow-xs'
                : 'text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Resources List ({filteredItems.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileView('inspector')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              mobileView === 'inspector'
                ? 'bg-white text-[#25251F] shadow-xs'
                : 'text-[#77766E] hover:text-[#25251F]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Resource Details
          </button>
        </div>

        {/* Main Workstation Layout - Fits screen height on desktop with internal scrolling */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:overflow-hidden items-stretch">
          {/* Left Column: Knowledge Table (lg:col-span-7 xl:col-span-7) */}
          <div
            className={`lg:col-span-7 xl:col-span-7 h-full min-h-0 ${
              mobileView === 'list' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
            }`}
          >
            <KnowledgeTable
              items={filteredItems}
              selectedItem={selectedItem}
              onSelectItem={handleSelectItem}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedProduct={selectedProduct}
              onProductChange={setSelectedProduct}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              onDeleteItem={handleDeleteItem}
              showToast={showToast}
            />
          </div>

          {/* Right Column: Knowledge Inspector (lg:col-span-5 xl:col-span-5) */}
          <div
            className={`lg:col-span-5 xl:col-span-5 h-full min-h-0 ${
              mobileView === 'inspector' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
            }`}
          >
            <KnowledgeInspector
              item={selectedItem}
              onBackToList={() => setMobileView('list')}
              showToast={showToast}
            />
          </div>
        </div>

        {/* Modals */}
        <AddKnowledgeModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddItem}
          showToast={showToast}
        />

        <ImportKnowledgeModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={handleImportComplete}
          showToast={showToast}
        />
      </div>
    </AppShell>
  );
}
