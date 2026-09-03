import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlights, HighlightItem } from '../../types';
import { Sparkles, Star, Tag, Flame, Save, Check } from 'lucide-react';

export const FeaturedManagementTab: React.FC = () => {
  const { products, weeklyHighlights, updateWeeklyHighlights, toggleProductBestSeller, toggleProductFestival } = useApp();

  const [formHighlights, setFormHighlights] = useState<WeeklyHighlights>(weeklyHighlights);

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

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Weekly Highlights & Offers Configurator</h2>
        <p className="text-xs text-neutral-500">Configure which products appear as Special of the Day, Special of the Week, and Festival Specials on the homepage banner.</p>
      </div>

      {/* Highlights Editor Form */}
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
                    {p.name} (${p.price.toFixed(2)})
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
                placeholder="TODAY'S HOT SPECIAL"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Headline Title</label>
              <input
                type="text"
                value={formHighlights.specialOfDay.title}
                onChange={(e) => handleItemChange('specialOfDay', 'title', e.target.value)}
                placeholder="Today's Special Headline"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Subtitle Description</label>
              <textarea
                rows={2}
                value={formHighlights.specialOfDay.subtitle}
                onChange={(e) => handleItemChange('specialOfDay', 'subtitle', e.target.value)}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Discount %</label>
              <input
                type="number"
                min="0"
                max="70"
                value={formHighlights.specialOfDay.discountPercentage || 0}
                onChange={(e) => handleItemChange('specialOfDay', 'discountPercentage', Number(e.target.value))}
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
                    {p.name} (${p.price.toFixed(2)})
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
                placeholder="WEEKLY FEATURED SPECIAL"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Headline Title</label>
              <input
                type="text"
                value={formHighlights.specialOfWeek.title}
                onChange={(e) => handleItemChange('specialOfWeek', 'title', e.target.value)}
                placeholder="Weekly Highlight Headline"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Subtitle Description</label>
              <textarea
                rows={2}
                value={formHighlights.specialOfWeek.subtitle}
                onChange={(e) => handleItemChange('specialOfWeek', 'subtitle', e.target.value)}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Discount %</label>
              <input
                type="number"
                min="0"
                max="70"
                value={formHighlights.specialOfWeek.discountPercentage || 0}
                onChange={(e) => handleItemChange('specialOfWeek', 'discountPercentage', Number(e.target.value))}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
              />
            </div>
          </div>

          {/* Card 3: Festival Special */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 space-y-4 shadow-subtle text-xs font-bold">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Tag className="w-4 h-4 text-black" />
              <h3 className="text-sm font-extrabold text-black">3. Festival / Seasonal Special</h3>
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
                    {p.name} (${p.price.toFixed(2)})
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
                placeholder="FESTIVAL SPECIAL HAMPER"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Headline Title</label>
              <input
                type="text"
                value={formHighlights.festivalSpecial.title}
                onChange={(e) => handleItemChange('festivalSpecial', 'title', e.target.value)}
                placeholder="Festival Offer Headline"
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Subtitle Description</label>
              <textarea
                rows={2}
                value={formHighlights.festivalSpecial.subtitle}
                onChange={(e) => handleItemChange('festivalSpecial', 'subtitle', e.target.value)}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-sans"
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1">Discount %</label>
              <input
                type="number"
                min="0"
                max="70"
                value={formHighlights.festivalSpecial.discountPercentage || 0}
                onChange={(e) => handleItemChange('festivalSpecial', 'discountPercentage', Number(e.target.value))}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
              />
            </div>
          </div>

        </div>

        <button
          type="submit"
          className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
        >
          <Save className="w-4 h-4" />
          <span>Save & Publish Weekly Highlights to Homepage</span>
        </button>
      </form>

      {/* Catalog Best Seller & Festival Toggles */}
      <div className="pt-6 border-t border-neutral-200 space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Quick Toggle Best Seller & Festival Catalog Items</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-black truncate">{prod.name}</h4>
                  <p className="text-[10px] text-neutral-400 font-mono">{prod.category} • ${prod.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleProductBestSeller(prod.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 ${
                    prod.isBestSeller ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  <span>Best Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleProductFestival(prod.id)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 ${
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

    </div>
  );
};
