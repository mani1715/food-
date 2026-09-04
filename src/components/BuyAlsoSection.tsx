import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ShoppingBag, Check, Sparkles, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BuyAlsoSectionProps {
  currentProduct: Product;
}

export const BuyAlsoSection: React.FC<BuyAlsoSectionProps> = ({ currentProduct }) => {
  const { products, addToCart, addToast } = useApp();
  const navigate = useNavigate();

  // Find 2 complementary products (different categories or highly rated items)
  const complementaryProducts = products
    .filter((p) => p.id !== currentProduct.id)
    .slice(0, 2);

  const bundleItems = [currentProduct, ...complementaryProducts];

  // Track selection state for each product in the bundle
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentProduct.id,
    ...complementaryProducts.map((p) => p.id),
  ]);

  const toggleSelection = (id: string) => {
    if (id === currentProduct.id) return; // Main product is always selected
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedProducts = bundleItems.filter((p) => selectedIds.includes(p.id));
  const bundleTotal = selectedProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  const bundleSavings = selectedProducts.length >= 3 ? bundleTotal * 0.1 : 0; // 10% bundle savings if all 3 selected!
  const finalPrice = bundleTotal - bundleSavings;

  const handleAddBundleToCart = () => {
    selectedProducts.forEach((prod) => {
      const defaultWeight = prod.defaultWeight || prod.weightOptions[0]?.weight || '500g';
      addToCart(prod, defaultWeight, 1);
    });
    addToast('Bundle Added!', `Added ${selectedProducts.length} items to your cart.`, 'success');
  };

  return (
    <section className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 text-left shadow-subtle my-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Frequently Bought Together</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-black tracking-tight">
            Buy These Products Also
          </h3>
        </div>

        {selectedProducts.length >= 3 && (
          <span className="inline-flex items-center gap-1 bg-black text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-subtle">
            <Tag className="w-3.5 h-3.5" />
            <span>Extra 10% Off Bundle Deal Applied</span>
          </span>
        )}
      </div>

      {/* Bundle Visual Combination Grid */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
        {bundleItems.map((prod, idx) => {
          const isSelected = selectedIds.includes(prod.id);
          const isMain = prod.id === currentProduct.id;

          return (
            <React.Fragment key={prod.id}>
              {idx > 0 && <span className="text-xl font-bold text-neutral-400 font-mono">+</span>}

              <div
                onClick={() => !isMain && toggleSelection(prod.id)}
                className={`relative group rounded-2xl border p-3 bg-white transition-all max-w-[180px] w-full text-center space-y-2 cursor-pointer shadow-subtle ${
                  isSelected ? 'border-black ring-2 ring-black/10' : 'border-neutral-200 opacity-60 hover:opacity-100'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2 z-10">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-black text-white border-black' : 'bg-white border-neutral-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Product Image */}
                <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>

                <div className="space-y-0.5">
                  {isMain && (
                    <span className="text-[9px] font-extrabold uppercase bg-neutral-200 text-black px-2 py-0.5 rounded-full inline-block mb-1">
                      This Item
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-black line-clamp-1">{prod.name}</h4>
                  <p className="text-xs font-mono font-extrabold text-neutral-800">₹{prod.price}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Checkbox Options & Bundle Summary CTA */}
      <div className="pt-4 border-t border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Item Checklist */}
        <div className="space-y-2 text-xs font-bold">
          {bundleItems.map((prod) => {
            const isSelected = selectedIds.includes(prod.id);
            const isMain = prod.id === currentProduct.id;

            return (
              <label key={prod.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isMain}
                  onChange={() => toggleSelection(prod.id)}
                  className="rounded text-black focus:ring-black accent-black cursor-pointer"
                />
                <span className={isSelected ? 'text-black font-extrabold' : 'text-neutral-400 font-normal line-through'}>
                  {isMain ? 'This Item: ' : ''}<strong>{prod.name}</strong> — ₹{prod.price} ({prod.defaultWeight || '500g'})
                </span>
              </label>
            );
          })}
        </div>

        {/* Total Price & Add Bundle Button */}
        <div className="bg-white border border-neutral-200 p-4 rounded-2xl shadow-subtle flex items-center justify-between gap-6 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase block">Bundle Price ({selectedProducts.length} Items)</span>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-black text-black">₹{Math.round(finalPrice)}</span>
              {bundleSavings > 0 && (
                <span className="text-xs text-neutral-400 line-through">₹{Math.round(bundleTotal)}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddBundleToCart}
            className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Selected To Cart</span>
          </button>
        </div>

      </div>

    </section>
  );
};
