'use client';

import React, { useState, useMemo } from 'react';
import { Bell, Download, Plus, Menu } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import {
  INITIAL_CATEGORIES,
  INITIAL_GUIDELINES,
  GuidelineCategoryItem,
  GuidelineItem,
  GuidelineItemStatus,
  CategoryPills,
  CategorySidebar,
  GuidelinesList,
  NewGuidelineModal,
  ImportGuidelineModal,
  EditCategoryModal,
} from '@/features/guidelines';

function GuidelinesContent() {
  const { openMobileSidebar, showToast } = useAppShell();

  // Categories & Guidelines state
  const [categories, setCategories] = useState<GuidelineCategoryItem[]>(INITIAL_CATEGORIES);
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>(INITIAL_GUIDELINES);

  // Active navigation & filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('tone-voice');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GuidelineItemStatus>('ALL');

  // Mobile view toggle (between Categories list and Guidelines items on mobile screens)
  const [mobileTab, setMobileTab] = useState<'categories' | 'guidelines'>('guidelines');

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<GuidelineItem | null>(null);

  // Compute dynamic category counts based on current guidelines array
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of categories) {
      counts[cat.id] = guidelines.filter((g) => g.categoryId === cat.id).length;
    }
    return counts;
  }, [categories, guidelines]);

  // Selected category object
  const currentCategory = useMemo(() => {
    if (selectedCategoryId === 'all') return undefined;
    return categories.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Filtered guidelines
  const filteredGuidelines = useMemo(() => {
    return guidelines.filter((item) => {
      // Category match
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }

      // Status match
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.categoryName.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesCat;
      }

      return true;
    });
  }, [guidelines, selectedCategoryId, statusFilter, searchQuery]);

  // Handlers
  const handleSelectCategory = (catId: string | 'all') => {
    setSelectedCategoryId(catId);
    setMobileTab('guidelines');
  };

  const handleSaveGuideline = (
    data: Omit<GuidelineItem, 'id' | 'updatedAt'> & { id?: string }
  ) => {
    if (data.id) {
      // Edit existing
      setGuidelines((prev) =>
        prev.map((item) =>
          item.id === data.id
            ? {
                ...item,
                ...data,
                updatedAt: 'Just now',
              }
            : item
        )
      );
      showToast(`Updated guideline: "${data.title}"`);
    } else {
      // Add new
      const newItem: GuidelineItem = {
        id: `g-${Date.now()}`,
        ...data,
        updatedAt: 'Just now',
      };
      setGuidelines((prev) => [newItem, ...prev]);
      showToast(`Created new guideline: "${data.title}"`);
    }
  };

  const handleDeleteGuideline = (guidelineId: string) => {
    const target = guidelines.find((g) => g.id === guidelineId);
    setGuidelines((prev) => prev.filter((g) => g.id !== guidelineId));
    showToast(`Deleted guideline: "${target?.title || guidelineId}"`);
  };

  const handleStatusChange = (guidelineId: string, newStatus: GuidelineItemStatus) => {
    setGuidelines((prev) =>
      prev.map((g) => (g.id === guidelineId ? { ...g, status: newStatus } : g))
    );
  };

  const handleSaveCategory = (updatedCategory: GuidelineCategoryItem) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
    showToast(`Updated category "${updatedCategory.name}"`);
  };

  const handleImportSuccess = (importedCount: number, catId: string) => {
    const targetCat = categories.find((c) => c.id === catId);
    showToast(
      `✓ Successfully imported ${importedCount} rules into "${targetCat?.name || 'Category'}"!`
    );
  };

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E1D8]/60 shrink-0">
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
            <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
              Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Define, manage, and keep your brand guidelines up to date for accurate AI reviews.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => showToast('All notifications are up to date.')}
            className="p-2 sm:p-2.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-[#25251F] transition-colors cursor-pointer shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F2EFE8] text-xs sm:text-sm font-medium text-[#25251F] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#68745D]" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingGuideline(null);
              setIsNewModalOpen(true);
            }}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#25251F] hover:bg-[#383832] text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Guideline</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills Row (Top Horizontal Tabs) */}
      <div className="shrink-0">
        <CategoryPills
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          totalGuidelinesCount={guidelines.length}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* 3. Mobile View Switcher (Visible on < lg screens) */}
      <div className="lg:hidden shrink-0 flex items-center bg-[#FFFEFA] border border-[#E5E1D8] rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('categories')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mobileTab === 'categories'
              ? 'bg-[#25251F] text-white font-semibold shadow-xs'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('guidelines')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mobileTab === 'guidelines'
              ? 'bg-[#25251F] text-white font-semibold shadow-xs'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          Guidelines ({filteredGuidelines.length})
        </button>
      </div>

      {/* 4. Two-Column Workspace Grid: Parent cards hug content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Category Sidebar (4 cols on desktop) */}
        <div
          className={`lg:col-span-4 ${
            mobileTab === 'categories' ? 'block' : 'hidden lg:block'
          }`}
        >
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectCategory={handleSelectCategory}
            categoryFilterCounts={categoryCounts}
            onOpenFilterMenu={() => {
              const nextStatus =
                statusFilter === 'ALL'
                  ? 'Active'
                  : statusFilter === 'Active'
                  ? 'Needs Review'
                  : 'ALL';
              setStatusFilter(nextStatus);
              showToast(
                nextStatus === 'ALL'
                  ? 'Showing all statuses'
                  : `Filtered by status: ${nextStatus}`
              );
            }}
          />
        </div>

        {/* Right Column: Guidelines List & Category Detail (8 cols on desktop) */}
        <div
          className={`lg:col-span-8 ${
            mobileTab === 'guidelines' ? 'block' : 'hidden lg:block'
          }`}
        >
          <GuidelinesList
            currentCategory={currentCategory}
            guidelines={filteredGuidelines}
            totalCount={guidelines.length}
            onEditCategory={() => {
              if (currentCategory) {
                setIsEditCategoryModalOpen(true);
              } else {
                showToast('Select a specific category to edit its details.');
              }
            }}
            onEditGuideline={(guideline) => {
              setEditingGuideline(guideline);
              setIsNewModalOpen(true);
            }}
            onDeleteGuideline={handleDeleteGuideline}
            onStatusChange={handleStatusChange}
            showToast={showToast}
          />
        </div>
      </div>

      {/* Modals */}
      <NewGuidelineModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setEditingGuideline(null);
        }}
        categories={categories}
        defaultCategoryId={
          selectedCategoryId === 'all' ? categories[0]?.id : selectedCategoryId
        }
        initialData={editingGuideline}
        onSave={handleSaveGuideline}
      />

      <ImportGuidelineModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onImportSuccess={handleImportSuccess}
      />

      <EditCategoryModal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        category={currentCategory}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

export default function GuidelinesPage() {
  return (
    <AppShell activeItem="Guidelines">
      <GuidelinesContent />
    </AppShell>
  );
}
