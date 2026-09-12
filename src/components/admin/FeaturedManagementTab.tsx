import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlights, HighlightItem, HomeSection } from '../../types';
import {
  Star,
  Tag,
  Flame,
  Save,
  Plus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Layers,
  Sparkles,
  Hand,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Crosshair,
  Link as LinkIcon,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
  Edit3,
  X,
} from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';

// Per-section draft editor with category dropdown, reordering and batch selection
const SectionEditor: React.FC<{
  sec: HomeSection;
  secIdx: number;
  totalSections: number;
  products: ReturnType<typeof useApp>['products'];
  categories: ReturnType<typeof useApp>['categories'];
  onToggleProduct: (secId: string, prodId: string) => void;
  onSelectAllInCat: (secId: string, catName: string) => void;
  onDeselectAllInCat: (secId: string, catName: string) => void;
  onToggleVisible: (secId: string, enabled: boolean) => void;
  onSave: (secId: string, updates: Partial<HomeSection>) => void;
  onDelete: (secId: string) => void;
  onMoveUp: (secId: string) => void;
  onMoveDown: (secId: string) => void;
}> = ({
  sec,
  secIdx,
  totalSections,
  products,
  categories,
  onToggleProduct,
  onSelectAllInCat,
  onDeselectAllInCat,
  onToggleVisible,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [draftBadge, setDraftBadge] = useState(sec.badge || '');
  const [draftTitle, setDraftTitle] = useState(sec.title);
  const [draftSubtitle, setDraftSubtitle] = useState(sec.subtitle || '');
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  // Category Filter & Dropdown State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDraftBadge(sec.badge || '');
    setDraftTitle(sec.title);
    setDraftSubtitle(sec.subtitle || '');
    setIsDirty(false);
  }, [sec.id]);

  const handleSave = () => {
    onSave(sec.id, {
      badge: draftBadge.trim(),
      title: draftTitle.trim() || sec.title,
      subtitle: draftSubtitle.trim(),
    });
    setIsDirty(false);
  };

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={`bg-neutral-50 border rounded-3xl p-6 space-y-6 shadow-subtle transition-all ${isDirty ? 'border-black ring-2 ring-black/10' : 'border-neutral-200 hover:border-neutral-400'}`}>
      {/* Sticky Save Bar — appears at top when changes are pending */}
      {isDirty && (
        <div className="sticky top-2 z-20 -mx-6 -mt-6 mb-2 px-6 py-3 bg-black rounded-t-3xl flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <ChevronUp className="w-3.5 h-3.5" />
            Unsaved changes in "{draftTitle || sec.title}"
          </span>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-white text-black text-xs font-extrabold rounded-xl hover:bg-neutral-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      )}

      {/* Section Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-2xl bg-black text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
            {secIdx + 1}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-black font-sans">{sec.title}</h3>
              {sec.badge && (
                <span className="px-2.5 py-0.5 bg-neutral-200 text-black text-[10px] font-extrabold rounded-full">
                  {sec.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              <strong className="text-black font-bold">{sec.productIds.length}</strong> products assigned to homepage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Reorder Buttons */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-0.5">
            <button
              type="button"
              disabled={secIdx === 0}
              onClick={() => onMoveUp(sec.id)}
              className="p-1.5 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-black transition-colors cursor-pointer"
              title="Move Section Up on Homepage"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={secIdx === totalSections - 1}
              onClick={() => onMoveDown(sec.id)}
              className="p-1.5 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-black transition-colors cursor-pointer"
              title="Move Section Down on Homepage"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {isDirty && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl border bg-black text-white border-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          )}
          <button
            onClick={() => onToggleVisible(sec.id, !sec.enabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              sec.enabled ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{sec.enabled ? 'Visible on Homepage' : 'Hidden'}</span>
          </button>
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            title="Delete Section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Confirm */}
      {showConfirmDelete && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <p className="text-xs font-bold text-rose-800">Delete "{sec.title}" section from homepage?</p>
          <div className="flex gap-2">
            <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-2 border border-neutral-200 rounded-xl text-xs font-bold cursor-pointer bg-white">Cancel</button>
            <button onClick={() => onDelete(sec.id)} className="flex-1 py-2 bg-rose-600 text-white rounded-xl text-xs font-extrabold cursor-pointer">Yes, Delete Section</button>
          </div>
        </div>
      )}

      {/* Title & Subtitle Edit Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
        <div>
          <label className="block text-neutral-500 mb-1">Badge / Tagline</label>
          <input
            type="text"
            value={draftBadge}
            onChange={(e) => { setDraftBadge(e.target.value); setIsDirty(true); }}
            placeholder="e.g. Pure Ghee Delights"
            className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block text-neutral-500 mb-1">Section Heading Title *</label>
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => { setDraftTitle(e.target.value); setIsDirty(true); }}
            placeholder="e.g. Authentic Traditional Sweets"
            className="w-full p-3 rounded-2xl border border-neutral-300 bg-white text-sm font-extrabold"
          />
        </div>
        <div>
          <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
          <input
            type="text"
            value={draftSubtitle}
            onChange={(e) => { setDraftSubtitle(e.target.value); setIsDirty(true); }}
            placeholder="Brief description of this section"
            className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
          />
        </div>
      </div>

      {/* Product Assignment Picker with Category Dropdown & Filter */}
      <div className="space-y-4 pt-2 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-neutral-600" />
              <span>Select Products for "{sec.title}"</span>
            </span>
            <p className="text-[11px] text-neutral-500">Filter by category or search to choose products for this homepage section.</p>
          </div>
          <span className="text-[11px] font-mono text-black font-bold bg-neutral-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
            {sec.productIds.length} Total Selected
          </span>
        </div>

        {/* Category Selector Controls: Dropdown + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Category Dropdown with Arrow */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className="w-full sm:w-auto px-4 py-2.5 bg-white border border-neutral-300 hover:border-black rounded-2xl text-xs font-extrabold text-black flex items-center justify-between gap-2 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-neutral-500" />
                <span>Category: <strong className="underline">{selectedCategory}</strong></span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  ({selectedCategory === 'All' ? products.length : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase()).length})
                </span>
              </div>
              {isCategoryDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-black shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-black shrink-0" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-neutral-200 shadow-xl z-30 py-2 space-y-0.5 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setIsCategoryDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-neutral-100 cursor-pointer ${
                    selectedCategory === 'All' ? 'bg-black text-white hover:bg-neutral-800' : 'text-black'
                  }`}
                >
                  <span>All Categories</span>
                  <span className="text-[10px] font-mono opacity-70">({products.length} products)</span>
                </button>
                {categories.map((cat) => {
                  const catCount = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                  const selectedInCat = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase() && sec.productIds.includes(p.id)).length;
                  const isCatSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-neutral-100 cursor-pointer ${
                        isCatSelected ? 'bg-black text-white hover:bg-neutral-800' : 'text-black'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] font-mono opacity-70">
                        {selectedInCat > 0 ? `(${selectedInCat}/${catCount})` : `(${catCount})`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Category Pills Scrollable Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === 'All'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((c) => {
              const count = products.filter((p) => p.category.toLowerCase() === c.name.toLowerCase()).length;
              const isSelected = selectedCategory.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border whitespace-nowrap cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Search */}
          <div className="relative sm:ml-auto w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Showing Filter Info & Batch Select Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500 font-medium bg-neutral-100/60 p-2.5 rounded-2xl border border-neutral-200">
          <span>
            Showing <strong className="text-black">{filteredProducts.length}</strong> product(s) {selectedCategory !== 'All' && <span>in <strong className="text-black">{selectedCategory}</strong></span>}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectAllInCat(sec.id, selectedCategory)}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-black text-black font-extrabold rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
            >
              + Select All {selectedCategory === 'All' ? 'Catalog' : selectedCategory}
            </button>
            <button
              type="button"
              onClick={() => onDeselectAllInCat(sec.id, selectedCategory)}
              className="px-2.5 py-1 bg-white border border-neutral-300 hover:border-rose-400 text-rose-600 font-extrabold rounded-lg text-[10px] transition-all cursor-pointer shadow-xs"
            >
              - Deselect All {selectedCategory === 'All' ? 'Catalog' : selectedCategory}
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-black font-bold hover:underline cursor-pointer ml-1"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
        
        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredProducts.map((prod) => {
            const isSelected = sec.productIds.includes(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onToggleProduct(sec.id, prod.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-white border-black shadow-subtle ring-2 ring-black/10'
                    : 'bg-white/60 border-neutral-200 hover:border-black opacity-70'
                }`}
              >
                <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-black truncate">{prod.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">{prod.category} • ₹{prod.price}</p>
                </div>
                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-neutral-100'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
            {searchQuery
              ? `No products found matching "${searchQuery}" in ${selectedCategory}.`
              : `No products in the "${selectedCategory}" category yet.`}
          </div>
        )}
      </div>

      {/* Bottom Save Button for title/badge/subtitle */}
      <div className="flex justify-end pt-2 border-t border-neutral-200">
        <button
          onClick={handleSave}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
            isDirty ? 'bg-black text-white hover:bg-neutral-800 shadow-subtle' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {isDirty ? 'Save Section Changes' : 'Section Saved ✓'}
        </button>
      </div>
    </div>
  );
};

export const FeaturedManagementTab: React.FC = () => {
  const {
    products,
    categories,
    weeklyHighlights,
    updateWeeklyHighlights,
    toggleProductBestSeller,
    toggleProductFestival,
    homeSections,
    addHomeSection,
    updateHomeSection,
    deleteHomeSection,
    toggleProductInHomeSection,
    moveHomeSection,
    setSectionProducts,
  } = useApp();

  const [formHighlights, setFormHighlights] = useState<WeeklyHighlights>(weeklyHighlights);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newCategoryFilter, setNewCategoryFilter] = useState('all');

  // Modal / Adjuster State for Highlights
  const [editingHighlightKey, setEditingHighlightKey] = useState<'specialOfDay' | 'specialOfWeek' | 'festivalSpecial' | null>(null);
  const [highlightLinkMode, setHighlightLinkMode] = useState<'product' | 'category' | 'custom'>('product');
  const [selectedHighlightCat, setSelectedHighlightCat] = useState<string>('');
  const [selectedHighlightProdId, setSelectedHighlightProdId] = useState<string>('');
  const [customHighlightLink, setCustomHighlightLink] = useState<string>('/products');

  // Direct Hand Drag & Touch Pan State
  const [isInteracting, setIsInteracting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number } | null>(null);

  useEffect(() => {
    setFormHighlights(weeklyHighlights);
  }, [weeklyHighlights]);

  const handleOpenHighlightEditor = (key: 'specialOfDay' | 'specialOfWeek' | 'festivalSpecial') => {
    setEditingHighlightKey(key);
    const item = formHighlights[key];
    const link = item.redirectLink || `/product/${item.productId}`;

    if (link.startsWith('/product/')) {
      setHighlightLinkMode('product');
      const pId = link.replace('/product/', '').split('?')[0];
      setSelectedHighlightProdId(pId || item.productId);
      setSelectedHighlightCat(categories[0]?.name || '');
      setCustomHighlightLink(link);
    } else if (link.includes('category=')) {
      setHighlightLinkMode('category');
      try {
        const cat = decodeURIComponent(link.split('category=')[1].split('&')[0]);
        setSelectedHighlightCat(cat);
      } catch {
        setSelectedHighlightCat(categories[0]?.name || '');
      }
      setSelectedHighlightProdId(item.productId);
      setCustomHighlightLink(link);
    } else {
      setHighlightLinkMode('custom');
      setCustomHighlightLink(link);
      setSelectedHighlightCat(categories[0]?.name || '');
      setSelectedHighlightProdId(item.productId);
    }
  };

  const handleItemChange = (
    key: 'specialOfDay' | 'specialOfWeek' | 'festivalSpecial',
    field: keyof HighlightItem,
    value: any
  ) => {
    setFormHighlights((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleProductSelect = (key: 'specialOfDay' | 'specialOfWeek' | 'festivalSpecial', prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setFormHighlights((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          ...current,
          productId: prodId,
          title: current.title || prod.name,
          subtitle: current.subtitle || prod.description,
          image: current.image || prod.image,
          redirectLink: highlightLinkMode === 'product' ? `/product/${prodId}` : current.redirectLink,
        },
      };
    });
    if (highlightLinkMode === 'product') {
      setSelectedHighlightProdId(prodId);
    }
  };

  const handleLinkModeChange = (key: 'specialOfDay' | 'specialOfWeek' | 'festivalSpecial', mode: 'product' | 'category' | 'custom') => {
    setHighlightLinkMode(mode);
    const item = formHighlights[key];
    if (mode === 'product') {
      const pId = selectedHighlightProdId || item.productId || products[0]?.id || '';
      handleItemChange(key, 'redirectLink', `/product/${pId}`);
    } else if (mode === 'category') {
      const cat = selectedHighlightCat || categories[0]?.name || '';
      handleItemChange(key, 'redirectLink', `/products?category=${encodeURIComponent(cat)}`);
    } else {
      handleItemChange(key, 'redirectLink', customHighlightLink || '/products');
    }
  };

  // Canvas Hand Gestures
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!editingHighlightKey) return;
    e.preventDefault();
    setIsInteracting(true);
    const item = formHighlights[editingHighlightKey];
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: item.panOffsetX ?? 0,
      initialPanY: item.panOffsetY ?? 0,
    };
  };

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current || !editingHighlightKey) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    handleItemChange(editingHighlightKey, 'panOffsetX', Math.round(dragStartRef.current.initialPanX + deltaX));
    handleItemChange(editingHighlightKey, 'panOffsetY', Math.round(dragStartRef.current.initialPanY + deltaY));
  }, [editingHighlightKey]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsInteracting(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  // Touch Hand Gestures
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (!editingHighlightKey) return;
    if (e.touches.length === 1) {
      setIsInteracting(true);
      const touch = e.touches[0];
      const item = formHighlights[editingHighlightKey];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        initialPanX: item.panOffsetX ?? 0,
        initialPanY: item.panOffsetY ?? 0,
      };
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current || !editingHighlightKey || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const deltaY = touch.clientY - dragStartRef.current.y;
    handleItemChange(editingHighlightKey, 'panOffsetX', Math.round(dragStartRef.current.initialPanX + deltaX));
    handleItemChange(editingHighlightKey, 'panOffsetY', Math.round(dragStartRef.current.initialPanY + deltaY));
  };

  const handleCanvasTouchEnd = () => {
    setIsInteracting(false);
    dragStartRef.current = null;
  };

  // Scroll Wheel Zoom
  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!editingHighlightKey) return;
    e.preventDefault();
    const item = formHighlights[editingHighlightKey];
    const currentScale = item.imageScale ?? 1;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newScale = Math.min(3.0, Math.max(0.5, parseFloat((currentScale + delta).toFixed(2))));
    handleItemChange(editingHighlightKey, 'imageScale', newScale);
  };

  const handleAdjustZoomStep = (step: number) => {
    if (!editingHighlightKey) return;
    const item = formHighlights[editingHighlightKey];
    const currentScale = item.imageScale ?? 1;
    const newScale = Math.min(3.0, Math.max(0.5, parseFloat((currentScale + step).toFixed(2))));
    handleItemChange(editingHighlightKey, 'imageScale', newScale);
  };

  const handleResetPositionAndZoom = () => {
    if (!editingHighlightKey) return;
    handleItemChange(editingHighlightKey, 'imageScale', 1);
    handleItemChange(editingHighlightKey, 'panOffsetX', 0);
    handleItemChange(editingHighlightKey, 'panOffsetY', 0);
  };

  const handleSaveHighlights = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateWeeklyHighlights(formHighlights);
    setEditingHighlightKey(null);
  };

  const handleSelectAllInCat = (secId: string, catName: string) => {
    const sec = homeSections.find((s) => s.id === secId);
    if (!sec) return;
    const catProds = products.filter((p) => catName === 'All' || p.category.toLowerCase() === catName.toLowerCase()).map((p) => p.id);
    const combined = Array.from(new Set([...sec.productIds, ...catProds]));
    setSectionProducts(secId, combined);
  };

  const handleDeselectAllInCat = (secId: string, catName: string) => {
    const sec = homeSections.find((s) => s.id === secId);
    if (!sec) return;
    const catProds = new Set(products.filter((p) => catName === 'All' || p.category.toLowerCase() === catName.toLowerCase()).map((p) => p.id));
    const remaining = sec.productIds.filter((pId) => !catProds.has(pId));
    setSectionProducts(secId, remaining);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHomeSection({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Handcrafted homemade authentic delicacies.',
      badge: newBadge.trim() || 'Curated Collection',
      productIds: products.slice(0, 4).map((p) => p.id),
      categoryFilter: newCategoryFilter,
      enabled: true,
    });
    setNewTitle(''); setNewSubtitle(''); setNewBadge(''); setNewCategoryFilter('all');
    setShowAddSectionModal(false);
  };

  return (
    <div className="space-y-12 text-left">
      
      {/* SECTION 1: HOMEPAGE SHOWCASE COLLECTIONS & NAMES EDITOR */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-black" />
              <h2 className="text-xl font-extrabold text-black tracking-tight">Homepage Showcase Collections & Titles</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Click any product to instantly add/remove it from a homepage section. Edit titles then click Save.
            </p>
          </div>
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Showcase Section</span>
          </button>
        </div>

        <div className="space-y-6">
          {homeSections.map((sec, secIdx) => (
            <SectionEditor
              key={sec.id}
              sec={sec}
              secIdx={secIdx}
              totalSections={homeSections.length}
              products={products}
              categories={categories}
              onToggleProduct={(secId, prodId) => toggleProductInHomeSection(secId, prodId)}
              onSelectAllInCat={handleSelectAllInCat}
              onDeselectAllInCat={handleDeselectAllInCat}
              onToggleVisible={(secId, enabled) => updateHomeSection(secId, { enabled })}
              onSave={(secId, updates) => updateHomeSection(secId, updates)}
              onDelete={(secId) => deleteHomeSection(secId)}
              onMoveUp={(secId) => moveHomeSection(secId, 'up')}
              onMoveDown={(secId) => moveHomeSection(secId, 'down')}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: SPECIAL HIGHLIGHTS & OFFERS BANNERS */}
      <div className="space-y-6 pt-6 border-t border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-extrabold text-black tracking-tight">Special Highlights & Offers Carousel Banners</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Customize photos with hand drag & zoom alignment, readable vibrant overlays, and direct click redirections.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSaveHighlights()}
            className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save All Highlights</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['specialOfDay', 'specialOfWeek', 'festivalSpecial'] as const).map((key, i) => {
            const labels = ["1. Today's Special", "2. Weekly Highlight", "3. Festival Special"];
            const item = formHighlights[key];
            const prod = products.find((p) => p.id === item.productId) || products[0];
            const displayImg = item.image || prod?.image || '';
            const zoom = item.imageScale ?? 1;
            const panX = item.panOffsetX ?? 0;
            const panY = item.panOffsetY ?? 0;

            return (
              <div key={key} className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                
                {/* Banner Live Preview Card */}
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-950">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={item.title || prod?.name}
                      style={{
                        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">No image</div>
                  )}

                  {/* Readable gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-black text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                        {item.badgeText || labels[i]}
                      </span>
                      {item.discountPercentage && item.discountPercentage > 0 ? (
                        <span className="bg-amber-400 text-black text-[10px] font-black font-mono px-2 py-0.5 rounded-full shadow-sm">
                          {item.discountPercentage}% OFF
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h4 className="text-white text-base font-extrabold line-clamp-1">{item.title || prod?.name}</h4>
                      <p className="text-neutral-200 text-xs line-clamp-1 font-medium">{item.subtitle || prod?.description}</p>
                    </div>
                  </div>
                </div>

                {/* Card Info & Edit Controls */}
                <div className="p-4 space-y-3 bg-neutral-50 border-t border-neutral-100 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 font-bold">Product:</span>
                      <span className="font-extrabold text-black truncate max-w-[170px]">{prod?.name || 'Default'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-700 bg-white px-3 py-1.5 rounded-xl border border-neutral-200 truncate">
                      <LinkIcon className="w-3.5 h-3.5 text-black shrink-0" />
                      <span className="font-bold text-black shrink-0">Redirect:</span>
                      <span className="text-neutral-500 truncate font-mono">{item.redirectLink || `/product/${item.productId}`}</span>
                    </div>

                    {((zoom && zoom !== 1) || panX !== 0 || panY !== 0) && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Hand className="w-3 h-3 text-amber-600" />
                        <span>Zoom {Math.round(zoom * 100)}% (Pan X:{panX}px, Y:{panY}px)</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenHighlightEditor(key)}
                    className="w-full py-2.5 bg-black text-white hover:bg-neutral-800 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Adjust Photo & Redirect Logic</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: BEST SELLER & FESTIVAL TOGGLES */}
      <div className="pt-6 border-t border-neutral-200 space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Quick Toggle Best Seller & Festival Catalog Flags</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-black truncate">{prod.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">{prod.category} • ₹{prod.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button type="button" onClick={() => toggleProductBestSeller(prod.id)} className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${prod.isBestSeller ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'}`}>
                  <Star className="w-3 h-3" /><span>Best Seller</span>
                </button>
                <button type="button" onClick={() => toggleProductFestival(prod.id)} className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${prod.isFestival ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'}`}>
                  <Tag className="w-3 h-3" /><span>Festival</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIGHLIGHT PHOTO ADJUSTER & REDIRECTION MODAL */}
      {editingHighlightKey && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-modal text-left max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-black text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-black">
                    Adjust {editingHighlightKey === 'specialOfDay' ? "Today's Special" : editingHighlightKey === 'specialOfWeek' ? "Weekly Highlight" : "Festival Special"} Banner
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">
                    Touch & drag with hand, zoom in/out, and set banner click redirect destination.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingHighlightKey(null)}
                className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DIRECT HAND DRAG & ZOOM CANVAS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-black flex items-center gap-1.5 uppercase tracking-wider">
                  <Hand className="w-4 h-4 text-amber-500" />
                  <span>Direct Hand Gesture Canvas (Drag to Move • Scroll to Zoom)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-black text-white text-[11px] font-mono font-black rounded-lg">
                    {Math.round((formHighlights[editingHighlightKey].imageScale ?? 1) * 100)}%
                  </span>
                  {((formHighlights[editingHighlightKey].panOffsetX ?? 0) !== 0 || (formHighlights[editingHighlightKey].panOffsetY ?? 0) !== 0 || (formHighlights[editingHighlightKey].imageScale ?? 1) !== 1) && (
                    <button
                      type="button"
                      onClick={handleResetPositionAndZoom}
                      className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reset to center & 100% zoom"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Canvas Container */}
              <div
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onTouchStart={handleCanvasTouchStart}
                onTouchMove={handleCanvasTouchMove}
                onTouchEnd={handleCanvasTouchEnd}
                onWheel={handleCanvasWheel}
                className={`relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-neutral-950 border-2 transition-all select-none ${
                  isInteracting ? 'border-amber-400 cursor-grabbing shadow-lg' : 'border-neutral-700 cursor-grab shadow-md hover:border-neutral-500'
                }`}
              >
                {(() => {
                  const item = formHighlights[editingHighlightKey];
                  const prod = products.find((p) => p.id === item.productId) || products[0];
                  const imgUrl = item.image || prod?.image || '';
                  const zoom = item.imageScale ?? 1;
                  const panX = item.panOffsetX ?? 0;
                  const panY = item.panOffsetY ?? 0;

                  return (
                    <>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt="Canvas Preview"
                          draggable={false}
                          style={{
                            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                          }}
                          className="w-full h-full object-cover pointer-events-none transition-transform duration-75 ease-out opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                          <ImageIcon className="w-6 h-6 text-neutral-600" />
                          <span>No Image Available</span>
                        </div>
                      )}

                      {/* Visual Cropper Grid lines during interaction */}
                      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${isInteracting ? 'opacity-40' : 'opacity-15'}`}>
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/40">
                          <div className="border-r border-b border-white/30" />
                          <div className="border-r border-b border-white/30" />
                          <div className="border-b border-white/30" />
                          <div className="border-r border-b border-white/30" />
                          <div className="border-r border-b border-white/30" />
                          <div className="border-b border-white/30" />
                          <div className="border-r border-b border-white/30" />
                          <div className="border-r border-b border-white/30" />
                          <div />
                        </div>
                      </div>

                      {/* Live Typography and Redirection Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15 p-4 flex flex-col justify-between pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-white text-black text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                            {item.badgeText || "SPECIAL OFFER"}
                          </span>
                          <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-amber-300 text-[9px] font-bold rounded-lg border border-amber-300/30">
                            ✋ Touch & Drag with Hand
                          </span>
                        </div>

                        <div>
                          <h4 className="text-white text-lg font-extrabold line-clamp-1">{item.title || prod?.name}</h4>
                          <p className="text-neutral-200 text-xs line-clamp-1">{item.subtitle || prod?.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-3 py-1 bg-white text-black text-[10px] font-black rounded-full">
                              Add to Cart
                            </span>
                            <span className="text-[10px] text-emerald-300 font-mono bg-black/80 px-2.5 py-1 rounded-full border border-emerald-400/40 truncate max-w-[240px]">
                              👉 Direct Redirect: {item.redirectLink || `/product/${item.productId}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Floating Quick Hand Zoom Buttons on the Canvas */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustZoomStep(-0.15);
                          }}
                          className="p-2 bg-black/80 hover:bg-black text-white rounded-xl backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                          title="Zoom Out with Hand"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustZoomStep(0.15);
                          }}
                          className="p-2 bg-black/80 hover:bg-black text-white rounded-xl backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                          title="Zoom In with Hand"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetPositionAndZoom();
                          }}
                          className="p-2 bg-black/80 hover:bg-black text-white rounded-xl backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                          title="Center & Reset"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Hand Zoom Slider Fine-Tuner */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                  <span className="flex items-center gap-1 text-neutral-500">
                    <ZoomOut className="w-3.5 h-3.5" /> 50%
                  </span>
                  <span className="text-black font-extrabold flex items-center gap-1">
                    <Hand className="w-3.5 h-3.5 text-black" /> Zoom Scale: {Math.round((formHighlights[editingHighlightKey].imageScale ?? 1) * 100)}% (Pan X: {formHighlights[editingHighlightKey].panOffsetX ?? 0}px, Y: {formHighlights[editingHighlightKey].panOffsetY ?? 0}px)
                  </span>
                  <span className="flex items-center gap-1 text-neutral-500">
                    300% <ZoomIn className="w-3.5 h-3.5" />
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={formHighlights[editingHighlightKey].imageScale ?? 1}
                  onChange={(e) => handleItemChange(editingHighlightKey, 'imageScale', parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* FORM FIELDS */}
            <div className="space-y-4 text-xs font-bold">
              {/* Product Selector */}
              <div>
                <label className="block text-neutral-500 mb-1">Select Base Product *</label>
                <select
                  value={formHighlights[editingHighlightKey].productId}
                  onChange={(e) => handleProductSelect(editingHighlightKey, e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                  ))}
                </select>
              </div>

              {/* Title, Subtitle, Badge, Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">Badge Tagline</label>
                  <input
                    type="text"
                    value={formHighlights[editingHighlightKey].badgeText}
                    onChange={(e) => handleItemChange(editingHighlightKey, 'badgeText', e.target.value)}
                    placeholder="e.g. TODAY'S HOT SPECIAL"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Special Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formHighlights[editingHighlightKey].discountPercentage || ''}
                    onChange={(e) => handleItemChange(editingHighlightKey, 'discountPercentage', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="e.g. 15"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">Headline Title *</label>
                  <input
                    type="text"
                    value={formHighlights[editingHighlightKey].title}
                    onChange={(e) => handleItemChange(editingHighlightKey, 'title', e.target.value)}
                    placeholder="e.g. Gongura Mutton Pickle Special"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
                  <input
                    type="text"
                    value={formHighlights[editingHighlightKey].subtitle}
                    onChange={(e) => handleItemChange(editingHighlightKey, 'subtitle', e.target.value)}
                    placeholder="e.g. Traditional Andhra spicy relish made fresh."
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
                  />
                </div>
              </div>

              {/* Custom Banner Image Picker */}
              <div className="space-y-2 pt-2 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <label className="block text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
                    Banner Photo (Upload or Paste URL)
                  </label>
                  {(() => {
                    const prod = products.find((p) => p.id === formHighlights[editingHighlightKey].productId);
                    if (prod && prod.image) {
                      return (
                        <button
                          type="button"
                          onClick={() => handleItemChange(editingHighlightKey, 'image', prod.image)}
                          className="text-[11px] text-black font-extrabold hover:underline cursor-pointer"
                        >
                          Use Product Photo
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <DragDropImagePicker
                  value={formHighlights[editingHighlightKey].image || ''}
                  onChange={(url: string) => handleItemChange(editingHighlightKey, 'image', url)}
                  label="Upload or Drag Banner Image"
                />
              </div>

              {/* Click Redirection Mode Picker */}
              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <label className="block text-neutral-600 font-extrabold uppercase tracking-wider text-[11px]">
                  Click Redirection Destination (When Customer Taps Banner)
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLinkModeChange(editingHighlightKey, 'product')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      highlightLinkMode === 'product' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                    }`}
                  >
                    Specific Product
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLinkModeChange(editingHighlightKey, 'category')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      highlightLinkMode === 'category' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                    }`}
                  >
                    Category Page
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLinkModeChange(editingHighlightKey, 'custom')}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                      highlightLinkMode === 'custom' ? 'bg-black text-white border-black shadow-sm' : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
                    }`}
                  >
                    Custom URL / Link
                  </button>
                </div>

                {highlightLinkMode === 'product' && (
                  <div>
                    <select
                      value={selectedHighlightProdId || formHighlights[editingHighlightKey].productId}
                      onChange={(e) => {
                        setSelectedHighlightProdId(e.target.value);
                        handleItemChange(editingHighlightKey, 'redirectLink', `/product/${e.target.value}`);
                      }}
                      className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (Redirects to /product/{p.id})</option>
                      ))}
                    </select>
                  </div>
                )}

                {highlightLinkMode === 'category' && (
                  <div>
                    <select
                      value={selectedHighlightCat || categories[0]?.name || ''}
                      onChange={(e) => {
                        setSelectedHighlightCat(e.target.value);
                        handleItemChange(editingHighlightKey, 'redirectLink', `/products?category=${encodeURIComponent(e.target.value)}`);
                      }}
                      className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name} (Redirects to /products?category={c.name})</option>
                      ))}
                    </select>
                  </div>
                )}

                {highlightLinkMode === 'custom' && (
                  <div>
                    <input
                      type="text"
                      value={customHighlightLink}
                      onChange={(e) => {
                        setCustomHighlightLink(e.target.value);
                        handleItemChange(editingHighlightKey, 'redirectLink', e.target.value);
                      }}
                      placeholder="e.g. /products?filter=sweets or https://..."
                      className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex gap-3 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setEditingHighlightKey(null)}
                className="flex-1 py-3.5 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveHighlights()}
                className="flex-1 py-3.5 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Banner Adjustments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW SECTION MODAL WITH PRESETS & CATEGORY PICKER */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSection} className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black">Create New Showcase Section</h3>
                <p className="text-xs text-neutral-500 font-medium">Adds a new live section to your homepage catalog display.</p>
              </div>
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="text-neutral-400 hover:text-black text-sm p-1">✕</button>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="space-y-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500">Quick 1-Click Presets</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { title: 'Festival Specials & Hampers', badge: 'Festive Delights', subtitle: 'Handcrafted traditional sweets & festive gift packs.', cat: 'Sweets' },
                  { title: 'Best Selling Delicacies', badge: 'Customer Favorites', subtitle: 'Top rated authentic homemade items loved by families.', cat: 'all' },
                  { title: "Grandmother's Podi & Powders", badge: 'Stone-Ground', subtitle: 'Traditional fragrant spice powders and podi mixes.', cat: 'all' },
                  { title: 'Signature Homestyle Pickles', badge: 'Spicy & Tangy', subtitle: 'Prepared with cold-pressed sesame oil and stone-ground spices.', cat: 'Pickles' },
                  { title: 'Pure A2 Ghee Sweets', badge: 'Pure Cow Ghee', subtitle: 'Melt-in-your-mouth sweets made with fresh natural ingredients.', cat: 'Sweets' },
                  { title: 'Crunchy Evening Savories', badge: 'Fresh Daily Batch', subtitle: 'Crispy homemade snacks and savories for tea time.', cat: 'Snacks' },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewTitle(p.title);
                      setNewBadge(p.badge);
                      setNewSubtitle(p.subtitle);
                      setNewCategoryFilter(p.cat);
                    }}
                    className="p-2.5 text-left border border-neutral-200 hover:border-black rounded-2xl bg-neutral-50 hover:bg-white text-[11px] transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <span className="font-extrabold text-black line-clamp-1">{p.title}</span>
                    <span className="text-[10px] text-neutral-500 font-mono mt-0.5">{p.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-neutral-500 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Festival Specials & Hampers"
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-extrabold text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Badge Tagline</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="e.g. Festive Delights"
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Category Filter Link</label>
                  <select
                    value={newCategoryFilter}
                    onChange={(e) => setNewCategoryFilter(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                  >
                    <option value="all">All Categories (Curated)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted traditional delicacies prepared fresh with pure love."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-sans bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle"
              >
                Create Section on Homepage
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
