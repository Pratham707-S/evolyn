'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Bell, Download, Plus, Menu, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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
  fetchAllGuidelines,
  createGuideline,
  updateGuideline,
  deleteGuideline,
  BackendGuidelineWithRules,
} from '@/features/guidelines';

function GuidelinesContent() {
  const { openMobileSidebar, showToast } = useAppShell();

  // Categories & Guidelines state
  const [categories, setCategories] = useState<GuidelineCategoryItem[]>(INITIAL_CATEGORIES);
  const [guidelines, setGuidelines] = useState<GuidelineItem[]>(INITIAL_GUIDELINES);

  // TanStack Query for live guidelines from Express backend
  const {
    data: backendGuidelines,
    isLoading: isGuidelinesLoading,
    refetch: refetchGuidelines,
  } = useQuery({
    queryKey: ['guidelines', 'list'],
    queryFn: () => fetchAllGuidelines(),
  });

  // Merge live backend guidelines when available
  useEffect(() => {
    if (backendGuidelines && backendGuidelines.length > 0) {
      const mappedBackendItems: GuidelineItem[] = backendGuidelines.map((bg: BackendGuidelineWithRules) => ({
        id: bg.id,
        categoryId: bg.category?.toLowerCase() || 'messaging',
        categoryName: bg.category || 'General',
        title: bg.title,
        description: bg.rawContent.slice(0, 160) + (bg.rawContent.length > 160 ? '...' : ''),
        status: (bg.status === 'ACTIVE' ? 'Active' : 'Draft') as GuidelineItemStatus,
        updatedAt: new Date(bg.updatedAt).toLocaleDateString(),
        severity: 'CRITICAL',
        ruleStatement: bg.rawContent,
      }));

      // Combine unique by ID with initial sample items
      const existingIds = new Set(mappedBackendItems.map((m) => m.id));
      const remainingInitial = INITIAL_GUIDELINES.filter((ig) => !existingIds.has(ig.id));
      setGuidelines([...mappedBackendItems, ...remainingInitial]);
    }
  }, [backendGuidelines]);

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

  const handleSaveGuideline = async (
    data: Omit<GuidelineItem, 'id' | 'updatedAt'> & { id?: string }
  ) => {
    if (data.id) {
      // Edit existing: Persist to backend PostgreSQL database
      try {
        await updateGuideline(data.id, {
          title: data.title,
          category: data.categoryName.toUpperCase().replace(/\s+/g, '_'),
          rawContent: data.description + (data.ruleStatement ? `\nRule: ${data.ruleStatement}` : ''),
        });
        refetchGuidelines();
        showToast(`Updated and persisted guideline: "${data.title}"`);
      } catch (err) {
        console.error('Failed to update guideline in database:', err);
        showToast(`Updated guideline: "${data.title}" (local state fallback).`);
      }

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
    } else {
      // Add new: Persist to backend PostgreSQL database
      try {
        const created = await createGuideline({
          title: data.title,
          category: data.categoryName.toUpperCase().replace(/\s+/g, '_'),
          rawContent: data.description + (data.ruleStatement ? `\nRule: ${data.ruleStatement}` : ''),
          version: '1.0',
        });

        const newItem: GuidelineItem = {
          id: created.id,
          ...data,
          updatedAt: 'Just now',
        };
        setGuidelines((prev) => [newItem, ...prev]);
        refetchGuidelines();
        showToast(`Persisted guideline "${data.title}" to database.`);
      } catch (err) {
        console.error('Failed to persist guideline to database:', err);
        // Optimistic fallback
        const newItem: GuidelineItem = {
          id: `g-${Date.now()}`,
          ...data,
          updatedAt: 'Just now',
        };
        setGuidelines((prev) => [newItem, ...prev]);
        showToast(`Created guideline "${data.title}" (local state fallback).`);
      }
    }
  };

  const handleDeleteGuideline = async (guidelineId: string) => {
    const target = guidelines.find((g) => g.id === guidelineId);
    setGuidelines((prev) => prev.filter((g) => g.id !== guidelineId));

    try {
      await deleteGuideline(guidelineId);
      refetchGuidelines();
      showToast(`Deleted guideline: "${target?.title || guidelineId}" from database.`);
    } catch {
      showToast(`Deleted guideline: "${target?.title || guidelineId}"`);
    }
  };

  const handleEditCategorySave = (updatedCat: GuidelineCategoryItem) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    showToast(`Category "${updatedCat.name}" updated successfully`);
  };

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Category,Title,Description,Status,Severity,Updated At']
        .concat(
          guidelines.map(
            (g) =>
              `"${g.categoryName}","${g.title}","${g.description.replace(/"/g, '""')}","${g.status}","${g.severity}","${g.updatedAt}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `evolyn-brand-guidelines-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Brand Guidelines exported to CSV successfully');
  };

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#E5E1D8]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openMobileSidebar}
            aria-label="Open sidebar"
            className="lg:hidden p-2 -ml-2 rounded-lg text-[#77766E] hover:text-[#25251F] hover:bg-[#EAE6DF] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#25251F] tracking-tight">
                Brand Guidelines
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8EBE1] text-[#4E6B54] border border-[#68745D]/20">
                {backendGuidelines && backendGuidelines.length > 0 ? 'Live Sync' : 'Seeded'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#77766E] mt-0.5">
              Atomic, verifiable rules governing brand voice, messaging, and claims.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              refetchGuidelines();
              showToast('Refreshed brand guidelines from backend.');
            }}
            title="Refresh guidelines"
            className="p-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F1EFE8] text-[#77766E] hover:text-[#25251F] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isGuidelinesLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F1EFE8] text-[#25251F] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#77766E]" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E1D8] bg-[#FFFEFA] hover:bg-[#F1EFE8] text-[#25251F] text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingGuideline(null);
              setIsNewModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25251F] hover:bg-[#383832] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Guideline</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Category Pills (Quick-filter) */}
      <CategoryPills
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        totalGuidelinesCount={guidelines.length}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Mobile View Switcher (Categories vs Guidelines List) */}
      <div className="lg:hidden flex items-center border-b border-[#E5E1D8] bg-[#FFFEFA] rounded-lg p-1 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab('categories')}
          className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors ${
            mobileTab === 'categories'
              ? 'bg-[#25251F] text-white shadow-2xs'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('guidelines')}
          className={`flex-1 py-1.5 text-center font-medium rounded-md transition-colors ${
            mobileTab === 'guidelines'
              ? 'bg-[#25251F] text-white shadow-2xs'
              : 'text-[#77766E] hover:text-[#25251F]'
          }`}
        >
          Rules ({filteredGuidelines.length})
        </button>
      </div>

      {/* 4. Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Category Sidebar (Hidden on mobile when rules tab active) */}
        <div
          className={`lg:col-span-4 xl:col-span-3 ${
            mobileTab === 'categories' ? 'block' : 'hidden lg:block'
          }`}
        >
          <CategorySidebar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectCategory={(catId) => handleSelectCategory(catId)}
            categoryFilterCounts={categoryCounts}
          />
        </div>

        {/* Right Column: Guidelines List (Hidden on mobile when categories tab active) */}
        <div
          className={`lg:col-span-8 xl:col-span-9 ${
            mobileTab === 'guidelines' ? 'block' : 'hidden lg:block'
          }`}
        >
          <GuidelinesList
            currentCategory={currentCategory}
            guidelines={filteredGuidelines}
            totalCount={filteredGuidelines.length}
            onEditCategory={() => setIsEditCategoryModalOpen(true)}
            onEditGuideline={(item) => {
              setEditingGuideline(item);
              setIsNewModalOpen(true);
            }}
            onDeleteGuideline={handleDeleteGuideline}
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
        onSave={handleSaveGuideline}
        categories={categories}
        defaultCategoryId={
          selectedCategoryId !== 'all' ? selectedCategoryId : 'tone-voice'
        }
        initialData={editingGuideline}
      />

      <ImportGuidelineModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onImportSuccess={(count) => {
          refetchGuidelines();
          showToast(`Imported ${count} guidelines successfully`);
        }}
      />

      <EditCategoryModal
        isOpen={isEditCategoryModalOpen}
        category={currentCategory || categories[0]}
        onClose={() => setIsEditCategoryModalOpen(false)}
        onSave={handleEditCategorySave}
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
