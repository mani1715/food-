import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Percent, Calendar, Check, Trash2 } from 'lucide-react';

export const DiscountsManagementTab: React.FC = () => {
  const { products, updateProductDiscount, removeProductDiscount } = useApp();

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [expiryDate, setExpiryDate] = useState('2026-10-31');

  const discountedProducts = products.filter((p) => (p.discountPercentage || 0) > 0);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && discountPercent > 0) {
      updateProductDiscount(selectedProductId, discountPercent, expiryDate);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Discounts & Offer Management</h2>
        <p className="text-xs text-neutral-500">Apply custom percentage discounts and set campaign expiration dates for products.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleApplyDiscount} className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-subtle text-xs font-bold">
          <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
            <Percent className="w-4 h-4 text-black" />
            <span>Apply Promotional Discount</span>
          </h3>

          <div>
            <label className="block text-neutral-500 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
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
            <label className="block text-neutral-500 mb-1">Discount Percentage (%)</label>
            <input
              type="number"
              min="1"
              max="70"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full p-3 rounded-2xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-neutral-500 mb-1">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
            />
          </div>

          <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle">
            Apply Discount to Product
          </button>
        </form>

        {/* Active Discounts List */}
        <div className="lg:col-span-7 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Active Product Discounts ({discountedProducts.length})</span>

          {discountedProducts.length === 0 ? (
            <div className="p-8 border border-neutral-200 rounded-3xl bg-white text-center text-xs text-neutral-500">
              No active discounts applied yet. Use the form to add a discount.
            </div>
          ) : (
            <div className="space-y-3">
              {discountedProducts.map((p) => (
                <div key={p.id} className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="text-xs font-bold text-black">{p.name}</h4>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Discount: <strong className="text-black">{p.discountPercentage}% OFF</strong> • Expires: {p.discountExpiryDate}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeProductDiscount(p.id)}
                    className="p-2 border border-neutral-200 hover:border-rose-600 text-neutral-400 hover:text-rose-600 rounded-xl"
                    title="Remove Discount"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
