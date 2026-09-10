import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlights, HighlightItem, HomeSection } from '../../types';
import { Star, Tag, Flame, Save, Plus, Trash2, Check, Eye, EyeOff, LayoutGrid, ChevronUp, ChevronDown, Search, Filter, Layers } from 'lucide-react';

// Per-section draft editor with category dropdown and filter
const SectionEditor: React.FC<{
  sec: HomeSection;
  secIdx: number;
  products: ReturnType<typeof useApp>['products'];
  categories: ReturnType<typeof useApp>['categories'];
  onToggleProduct: (secId: string, prodId: string) => void;
  onToggleVisible: (secId: string, enabled: boolean) => void;
  onSave: (secId: string, updates: Partial<HomeSection>) => void;
  onDelete: (secId: string) => void;
}> = ({ sec, secIdx, products, categories, onToggleProduct, onToggleVisible, onSave, onDelete }) => {
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
          <span className="w-8 h-8 rounded-2xl bg-black text-white font-mono text-xs font-bold flex items-center justify-center">
            {secIdx + 1}
          </span>
          <div>
            <h3 className="text-base font-extrabold text-black font-sans">{sec.title}</h3>
            <p className="text-xs text-neutral-400 font-mono">{sec.productIds.length} Products Assigned to Homepage</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Showing Filter Info */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
          <span>
            Showing <strong>{filteredProducts.length}</strong> product(s) {selectedCategory !== 'All' && <span>in <strong className="text-black">{selectedCategory}</strong></span>}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-black font-bold hover:underline cursor-pointer"
            >
              Clear search
            </button>
          )}
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
  } = useApp();

  const [formHighlights, setFormHighlights] = useState<WeeklyHighlights>(weeklyHighlights);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newCategoryFilter, setNewCategoryFilter] = useState('all');

  const handleItemChange = (
    key: 'specialOfDay' | 'specialOfWeek' | 'festivalSpecial',
    field: keyof HighlightItem,
    value: any
  ) => {
    setFormHighlights((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSaveHighlights = (e: React.FormEvent) => {
    e.preventDefault();
    updateWeeklyHighlights(formHighlights);
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
              products={products}
              categories={categories}
              onToggleProduct={(secId, prodId) => toggleProductInHomeSection(secId, prodId)}
              onToggleVisible={(secId, enabled) => updateHomeSection(secId, { enabled })}
              onSave={(secId, updates) => updateHomeSection(secId, updates)}
              onDelete={(secId) => deleteHomeSection(secId)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 2: WEEKLY HIGHLIGHTS & OFFERS */}
      <div className="space-y-6 pt-6 border-t border-neutral-200">
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="text-xl font-extrabold text-black tracking-tight">Weekly Banner Highlights & Festive Offers</h2>
          <p className="text-xs text-neutral-500">Configure Special of the Day, Special of the Week, and Festive Hampers.</p>
        </div>
        <form onSubmit={handleSaveHighlights} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['specialOfDay', 'specialOfWeek', 'festivalSpecial'] as const).map((key, i) => {
              const icons = [<Flame key="f" className="w-4 h-4 text-black" />, <Star key="s" className="w-4 h-4 text-black" />, <Tag key="t" className="w-4 h-4 text-black" />];
              const labels = ['1. Special of the Day', '2. Special of the Week', '3. Festival Special'];
              const item = formHighlights[key];
              return (
                <div key={key} className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-subtle text-xs font-bold">
                  <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                    {icons[i]}
                    <h3 className="text-sm font-extrabold text-black">{labels[i]}</h3>
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Select Product</label>
                    <select value={item.productId} onChange={(e) => handleItemChange(key, 'productId', e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300 bg-white">
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Badge Text</label>
                    <input type="text" value={item.badgeText} onChange={(e) => handleItemChange(key, 'badgeText', e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-neutral-500 mb-1">Headline Title</label>
                    <input type="text" value={item.title} onChange={(e) => handleItemChange(key, 'title', e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300 bg-white" />
                  </div>
                </div>
              );
            })}
          </div>
          <button type="submit" className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer">
            <Save className="w-4 h-4" />
            <span>Save & Publish Banner Highlights</span>
          </button>
        </form>
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

      {/* ADD NEW SECTION MODAL */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateSection} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Create New Showcase Section</h3>
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="text-neutral-400 hover:text-black">✕</button>
            </div>
            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Section Title *</label>
                <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Grandmother's Podi & Powders" className="w-full p-3 rounded-2xl border border-neutral-300 font-extrabold" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
                <input type="text" value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} placeholder="e.g. Hand-ground traditional spice powders & podi mixes." className="w-full p-3 rounded-2xl border border-neutral-300 font-sans" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Badge Tagline</label>
                <input type="text" value={newBadge} onChange={(e) => setNewBadge(e.target.value)} placeholder="e.g. Aromatic Stone-Ground" className="w-full p-3 rounded-2xl border border-neutral-300 font-mono" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle">Create Section</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
