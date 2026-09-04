import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlights, HighlightItem, HomeSection } from '../../types';
import { Star, Tag, Flame, Save, Plus, Trash2, Edit3, Check, Eye, EyeOff, LayoutGrid } from 'lucide-react';

export const FeaturedManagementTab: React.FC = () => {
  const {
    products,
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

  // New Section Modal State
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
    setFormHighlights((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
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

    setNewTitle('');
    setNewSubtitle('');
    setNewBadge('');
    setNewCategoryFilter('all');
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
              Edit the names, subtitles, and assigned products for sections like "Best Selling Homemade Products", "Homestyle Pickles Collection", "Authentic Traditional Sweets", or add new custom sections.
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

        {/* List of Showcase Sections */}
        <div className="space-y-6">
          {homeSections.map((sec, secIdx) => (
            <div
              key={sec.id}
              className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-subtle hover:border-black transition-all"
            >
              {/* Section Header Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-2xl bg-black text-white font-mono text-xs font-bold flex items-center justify-center">
                    {secIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-black font-sans">{sec.title}</h3>
                    <p className="text-xs text-neutral-400 font-mono">Section ID: {sec.id} • {sec.productIds.length} Products Assigned</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateHomeSection(sec.id, { enabled: !sec.enabled })}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      sec.enabled ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'
                    }`}
                  >
                    {sec.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{sec.enabled ? 'Visible on Homepage' : 'Hidden'}</span>
                  </button>

                  <button
                    onClick={() => deleteHomeSection(sec.id)}
                    className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Subtitle Edit Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-neutral-500 mb-1">Badge / Tagline</label>
                  <input
                    type="text"
                    value={sec.badge || ''}
                    onChange={(e) => updateHomeSection(sec.id, { badge: e.target.value })}
                    placeholder="e.g. Pure Ghee Delights"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Section Heading Title *</label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => updateHomeSection(sec.id, { title: e.target.value })}
                    placeholder="e.g. Authentic Traditional Sweets"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white text-sm font-extrabold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
                  <input
                    type="text"
                    value={sec.subtitle || ''}
                    onChange={(e) => updateHomeSection(sec.id, { subtitle: e.target.value })}
                    placeholder="Brief description of this section"
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
                  />
                </div>
              </div>

              {/* Product Assignment Picker */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400 block">
                  Select Products to Include in "{sec.title}"
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {products.map((prod) => {
                    const isSelected = sec.productIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProductInHomeSection(sec.id, prod.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-white border-black shadow-subtle ring-2 ring-black/10'
                            : 'bg-white/60 border-neutral-200 hover:border-black opacity-70'
                        }`}
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-black truncate">{prod.name}</h4>
                          <p className="text-[10px] text-neutral-400 font-mono">{prod.category} • ₹{prod.price}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-black border-black text-white' : 'border-neutral-300 bg-neutral-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>


      {/* SECTION 2: WEEKLY HIGHLIGHTS & OFFERS CONFIGURATOR */}
      <div className="space-y-6 pt-6 border-t border-neutral-200">
        <div className="border-b border-neutral-200 pb-4">
          <h2 className="text-xl font-extrabold text-black tracking-tight">Weekly Banner Highlights & Festive Offers</h2>
          <p className="text-xs text-neutral-500">Configure Special of the Day, Special of the Week, and Festive Hampers on the top banner.</p>
        </div>

        <form onSubmit={handleSaveHighlights} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Card 1: Special of the Day */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-subtle text-xs font-bold">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Flame className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black">1. Special of the Day</h3>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Select Product</label>
                <select
                  value={formHighlights.specialOfDay.productId}
                  onChange={(e) => handleItemChange('specialOfDay', 'productId', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={formHighlights.specialOfDay.badgeText}
                  onChange={(e) => handleItemChange('specialOfDay', 'badgeText', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={formHighlights.specialOfDay.title}
                  onChange={(e) => handleItemChange('specialOfDay', 'title', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                />
              </div>
            </div>

            {/* Card 2: Special of the Week */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-subtle text-xs font-bold">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Star className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black">2. Special of the Week</h3>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Select Product</label>
                <select
                  value={formHighlights.specialOfWeek.productId}
                  onChange={(e) => handleItemChange('specialOfWeek', 'productId', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={formHighlights.specialOfWeek.badgeText}
                  onChange={(e) => handleItemChange('specialOfWeek', 'badgeText', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={formHighlights.specialOfWeek.title}
                  onChange={(e) => handleItemChange('specialOfWeek', 'title', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                />
              </div>
            </div>

            {/* Card 3: Festival Special */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-subtle text-xs font-bold">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Tag className="w-4 h-4 text-black" />
                <h3 className="text-sm font-extrabold text-black">3. Festival Special</h3>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Select Product</label>
                <select
                  value={formHighlights.festivalSpecial.productId}
                  onChange={(e) => handleItemChange('festivalSpecial', 'productId', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={formHighlights.festivalSpecial.badgeText}
                  onChange={(e) => handleItemChange('festivalSpecial', 'badgeText', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={formHighlights.festivalSpecial.title}
                  onChange={(e) => handleItemChange('festivalSpecial', 'title', e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Publish Banner Highlights</span>
          </button>
        </form>
      </div>


      {/* SECTION 3: CATALOG BEST SELLER & FESTIVAL TOGGLES */}
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
                <button
                  type="button"
                  onClick={() => toggleProductBestSeller(prod.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    prod.isBestSeller ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Best Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleProductFestival(prod.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    prod.isFestival ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>Festival</span>
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
              <button type="button" onClick={() => setShowAddSectionModal(false)} className="text-neutral-400 hover:text-black">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Section Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grandmother's Podi & Powders"
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-extrabold"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Subtitle / Description</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Hand-ground traditional spice powders & podi mixes."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Badge Tagline</label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="e.g. Aromatic Stone-Ground"
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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
                Create Section
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
