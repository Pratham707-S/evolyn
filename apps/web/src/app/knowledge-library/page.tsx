'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Download, Plus, Layers, Eye } from 'lucide-react';
import { AppShell, useAppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared/page-header';
import { SetupStepperBanner } from '@/components/shared/setup-stepper-banner';
import { Button } from '@/components/ui/button';
import {
  KnowledgeCategoryId,
  KnowledgeCategoryMetric,
  KnowledgeItem,
  INITIAL_KNOWLEDGE_CATEGORIES,
  KnowledgeMetrics,
  KnowledgeTable,
  KnowledgeInspector,
  AddKnowledgeModal,
  ImportKnowledgeModal,
} from '@/features/knowledge';
import { apiClient } from '@/lib/api/client';

interface ApiFact {
  id: string;
  topic: string;
  claimStatement: string;
  approvedProofSource: string;
  validUntil: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

function mapFact(fact: ApiFact): KnowledgeItem {
  const metadata = fact.metadata || {};
  const allowedTypes = ['Product Facts', 'Evidence & Studies', 'Approved Claims', 'Terminology', 'Reference Docs'] as const;
  const type = allowedTypes.includes(metadata.type as typeof allowedTypes[number]) ? metadata.type as KnowledgeItem['type'] : 'Product Facts';
  const categoryMap: Record<KnowledgeItem['type'], KnowledgeItem['categoryId']> = {
    'Product Facts': 'product-facts', 'Evidence & Studies': 'evidence-studies', 'Approved Claims': 'approved-claims', Terminology: 'terminology', 'Reference Docs': 'reference-docs',
  };
  const keyFacts = Array.isArray(metadata.keyFacts) ? metadata.keyFacts.filter((fact): fact is string => typeof fact === 'string') : [fact.claimStatement];
  return {
    id: fact.id,
    title: fact.topic,
    subtitle: typeof metadata.subtitle === 'string' ? metadata.subtitle : fact.claimStatement,
    type,
    categoryId: categoryMap[type],
    product: typeof metadata.product === 'string' ? metadata.product : 'Not specified',
    status: 'Approved',
    lastUpdated: new Date(fact.createdAt).toLocaleDateString(),
    updatedAtDate: fact.createdAt,
    ownedBy: typeof metadata.ownedBy === 'string' ? metadata.ownedBy : 'Not specified',
    version: typeof metadata.version === 'string' ? metadata.version : 'Current',
    summary: fact.claimStatement,
    keyFacts,
    content: typeof metadata.content === 'string' ? metadata.content : fact.claimStatement,
    proofSource: fact.approvedProofSource,
    usageStats: { linkedSubmissions: 0, activeRulesCount: 0, lastUsedReview: 'Not recorded' },
    versionHistory: [{ version: typeof metadata.version === 'string' ? metadata.version : 'Current', date: new Date(fact.createdAt).toLocaleDateString(), author: typeof metadata.ownedBy === 'string' ? metadata.ownedBy : 'Not specified', notes: 'Saved approved fact' }],
  };
}

export default function KnowledgeLibraryPage() {
  const { showToast } = useAppShell();

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

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

  const loadFacts = async () => {
    setIsLoading(true);
    try {
      const facts = await apiClient.get<ApiFact[]>('/api/knowledge/facts');
      const mapped = facts.map(mapFact);
      setItems(mapped);
      setLoadError(false);
      setSelectedItemId((current) => mapped.some((item) => item.id === current) ? current : mapped[0]?.id || '');
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadFacts(); }, []);

  // Compute live category counts based on current items list
  const categoriesWithCounts: KnowledgeCategoryMetric[] = useMemo(() => {
    return INITIAL_KNOWLEDGE_CATEGORIES.map((cat) => {
      if (cat.id === 'all') {
        // Base count + any newly added items beyond initial dataset
        return {
          ...cat,
          count: items.length,
        };
      }
      const matchCount = items.filter((i) => i.categoryId === cat.id).length;
      return {
        ...cat,
        count: matchCount,
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

  const handleAddItem = async (newItem: KnowledgeItem) => {
    const fact = await apiClient.post<ApiFact>('/api/knowledge/facts', {
      topic: newItem.title,
      claimStatement: [newItem.summary, ...newItem.keyFacts].filter(Boolean).join('\n'),
      approvedProofSource: newItem.proofSource,
      metadata: { subtitle: newItem.subtitle, type: newItem.type, product: newItem.product, ownedBy: newItem.ownedBy, version: newItem.version, keyFacts: newItem.keyFacts, content: newItem.content },
    });
    const savedItem = mapFact(fact);
    setItems((prev) => [savedItem, ...prev]);
    setSelectedItemId(savedItem.id);
    setMobileView('inspector');
    showToast('Approved fact saved to the knowledge library.');
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await apiClient.delete(`/api/knowledge/facts/${id}`);
      setItems((prev) => {
        const remaining = prev.filter((i) => i.id !== id);
        if (selectedItemId === id) setSelectedItemId(remaining[0]?.id || '');
        return remaining;
      });
      showToast('Approved fact deleted.');
    } catch {
      showToast('Could not delete this fact. Please retry.');
    }
  };

  const handleImportFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) throw new Error('JSON file exceeds the 5 MB limit.');
    const parsed: unknown = JSON.parse(await file.text());
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 50) {
      throw new Error('Choose a JSON array containing 1 to 50 approved facts.');
    }
    const factsToImport: Record<string, unknown>[] = [];
    for (const [index, row] of parsed.entries()) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`Fact ${index + 1} must be a JSON object.`);
      }
      const fact = row as Record<string, unknown>;
      if (typeof fact.topic !== 'string' || !fact.topic.trim() || fact.topic.length > 100 ||
          typeof fact.claimStatement !== 'string' || fact.claimStatement.trim().length < 5 ||
          typeof fact.approvedProofSource !== 'string' || fact.approvedProofSource.trim().length < 5 ||
          (fact.validUntil !== undefined && fact.validUntil !== null && typeof fact.validUntil !== 'string') ||
          (fact.metadata !== undefined && (!fact.metadata || typeof fact.metadata !== 'object' || Array.isArray(fact.metadata)))) {
        throw new Error(`Fact ${index + 1} is invalid. Check topic, claimStatement, and approvedProofSource.`);
      }
      factsToImport.push(fact);
    }

    let saved = 0;
    try {
      for (const fact of factsToImport) {
        await apiClient.post('/api/knowledge/facts', fact);
        saved += 1;
      }
    } catch (error) {
      await loadFacts();
      const reason = error instanceof Error ? ` ${error.message}` : '';
      throw new Error(`Import stopped after saving ${saved} of ${factsToImport.length} facts. Refresh the library before retrying.${reason}`);
    }
    await loadFacts();
    return saved;
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
              <Button variant="secondary" size="md" onClick={() => setIsImportModalOpen(true)} className="bg-white">
                <Download className="w-4 h-4 mr-1 text-[#25251F]" />
                Import JSON
              </Button>
              <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)} className="bg-[#18181B] text-white hover:bg-[#27272A]">
                <Plus className="w-4 h-4 mr-1" />
                Add Knowledge
              </Button>
            </>
          }
        />

        {/* Governance Setup Stepper Banner */}
        <SetupStepperBanner currentModule="knowledge-library" />

        {/* Top Metric & Category Cards Bar */}
        <div className="shrink-0">
          <KnowledgeMetrics
            categories={categoriesWithCounts}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
          />
        </div>
        {(isLoading || loadError || items.length === 0) && (
          <div role={loadError ? 'alert' : undefined} className="shrink-0 text-sm text-[#52524E]">
            {isLoading ? 'Loading approved facts…' : loadError ? 'Could not load approved facts. Check the API connection and refresh.' : 'No approved facts saved yet. Add one to get started.'}
          </div>
        )}

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
          onImportComplete={handleImportFile}
          showToast={showToast}
        />
      </div>
    </AppShell>
  );
}
