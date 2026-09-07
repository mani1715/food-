import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Coupon } from '../../types';
import { Percent, Plus, Trash2, Edit3, Tag, Check, X, ShieldAlert, ShoppingBag, Clock, Sparkles } from 'lucide-react';

export const DiscountsManagementTab: React.FC = () => {
  const {
    products,
    categories,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    updateProductDiscount,
    removeProductDiscount,
  } = useApp();

  // Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id' | 'usageCount'>>({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    appliesTo: 'all',
    targetCategory: categories[0]?.name || 'Sweets',
    targetProductId: products[0]?.id || '',
    expiryDate: '2026-12-31',
    enabled: true,
  });

  // Product Direct Discount Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [productExpiryDate, setProductExpiryDate] = useState('2026-10-31');

  const discountedProducts = products.filter((p) => (p.discountPercentage || 0) > 0);

  // Open Create Coupon Modal
  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      description: 'Special discount offer for our valued customers.',
      discountType: 'flat',
      discountValue: 200,
      minOrderAmount: 1500, // Default to user's 1500 threshold requirement!
      appliesTo: 'all',
      targetCategory: categories[0]?.name || 'Sweets',
      targetProductId: products[0]?.id || '',
      expiryDate: '2026-12-31',
      enabled: true,
    });
    setShowCouponModal(true);
  };

  // Open Edit Coupon Modal
  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      appliesTo: coupon.appliesTo,
      targetCategory: coupon.targetCategory || categories[0]?.name || 'Sweets',
      targetProductId: coupon.targetProductId || products[0]?.id || '',
      expiryDate: coupon.expiryDate || '',
      enabled: coupon.enabled,
    });
    setShowCouponModal(true);
  };

  // Submit Coupon Form
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) return;

    if (editingCouponId) {
      updateCoupon(editingCouponId, couponForm);
    } else {
      addCoupon(couponForm);
    }

    setShowCouponModal(false);
    setEditingCouponId(null);
  };

  // Apply Direct Product Discount
  const handleApplyProductDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && discountPercent > 0) {
      updateProductDiscount(selectedProductId, discountPercent, productExpiryDate);
    }
  };

  return (
    <div className="space-y-12 text-left">
      {/* SECTION 1: STORE COUPONS & ACTIVATION RULES */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-black" />
              <h2 className="text-xl font-extrabold text-black tracking-tight">Coupon Codes & Rule-Based Discounts</h2>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Create coupon codes with rules: minimum cart subtotal thresholds (e.g., ≥ ₹1500), category restrictions, or product-specific activation.
            </p>
          </div>

          <button
            onClick={handleOpenAddCoupon}
            className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon Code</span>
          </button>
        </div>

        {/* Coupons List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white border rounded-3xl p-6 shadow-subtle transition-all space-y-4 ${
                coupon.enabled ? 'border-neutral-200 hover:border-black' : 'border-neutral-200 opacity-60 bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-black text-white text-xs font-mono font-black rounded-xl tracking-wider uppercase">
                    {coupon.code}
                  </span>
                  <span className="text-xs font-bold text-neutral-900">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `Flat ₹${coupon.discountValue} OFF`}
                  </span>
                </div>

                <button
                  onClick={() => updateCoupon(coupon.id, { enabled: !coupon.enabled })}
                  className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                    coupon.enabled ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {coupon.enabled ? 'Active ✅' : 'Disabled ❌'}
                </button>
              </div>

              <p className="text-xs text-neutral-600 font-medium leading-relaxed">{coupon.description}</p>

              {/* Rules & Activation Badges */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 text-[11px] font-bold text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-normal">Min. Cart Requirement:</span>
                  <span className="font-mono text-black font-extrabold">
                    {coupon.minOrderAmount > 0 ? `Subtotal ≥ ₹${coupon.minOrderAmount}` : 'No minimum order required'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-normal">Item Condition:</span>
                  <span className="text-black font-bold">
                    {coupon.appliesTo === 'all'
                      ? 'All Catalog Products'
                      : coupon.appliesTo === 'category'
                      ? `Only "${coupon.targetCategory}" Items`
                      : `Only Specified Target Product`}
                  </span>
                </div>

                {coupon.expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-normal">Expires On:</span>
                    <span className="font-mono text-neutral-800">{coupon.expiryDate}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-normal">Total Redemptions:</span>
                  <span className="font-mono text-neutral-800">{coupon.usageCount || 0} times</span>
                </div>
              </div>

              {/* Card Action Controls */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  onClick={() => handleOpenEditCoupon(coupon)}
                  className="px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Rules</span>
                </button>
                <button
                  onClick={() => deleteCoupon(coupon.id)}
                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: DIRECT PRODUCT PERCENTAGE DISCOUNTS */}
      <div className="space-y-6 border-t border-neutral-200 pt-8">
        <div>
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-black" />
            <h2 className="text-xl font-extrabold text-black tracking-tight">Direct Product Discount Campaigns</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Apply direct percentage discounts to specific items in the catalog (e.g. 15% OFF on Avakaya Pickle for 3 days).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Apply Form */}
          <form
            onSubmit={handleApplyProductDiscount}
            className="lg:col-span-5 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-subtle text-xs font-bold"
          >
            <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-black" />
              <span>Apply Product Direct Discount</span>
            </h3>

            <div>
              <label className="block text-neutral-500 mb-1">Select Product *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-3 rounded-2xl border border-neutral-300 bg-white text-xs font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price}) — {p.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-500 mb-1">Discount % *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="70"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={productExpiryDate}
                  onChange={(e) => setProductExpiryDate(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle hover:bg-neutral-800 transition-all cursor-pointer"
            >
              Apply Discount to Product
            </button>
          </form>

          {/* Active Product Discounts List */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
              Active Product Direct Discounts ({discountedProducts.length})
            </span>

            {discountedProducts.length === 0 ? (
              <div className="p-8 border border-neutral-200 rounded-3xl bg-white text-center text-xs text-neutral-500">
                No direct percentage discounts applied to individual products.
              </div>
            ) : (
              <div className="space-y-3">
                {discountedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3"
                  >
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
                      className="p-2 border border-neutral-200 hover:border-rose-600 text-neutral-400 hover:text-rose-600 rounded-xl cursor-pointer"
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

      {/* CREATE / EDIT COUPON MODAL */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <h3 className="text-lg font-extrabold text-black">
                {editingCouponId ? 'Edit Coupon Rules' : 'Create New Coupon Code'}
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="p-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Coupon Code (Uppercase) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE1500"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono uppercase focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="flat">Flat ₹ Amount OFF</option>
                    <option value="percentage">Percentage (%) OFF</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">Coupon Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat ₹200 OFF on orders above ₹1500"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">
                    Discount Value ({couponForm.discountType === 'percentage' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={couponForm.discountType === 'percentage' ? '15' : '200'}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                {/* MINIMUM ORDER AMOUNT THRESHOLD (e.g. 1500) */}
                <div>
                  <label className="block text-neutral-700 mb-1">Min. Cart Subtotal Threshold (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1500"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono text-black font-extrabold focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              {/* APPLIES TO CATEGORY / PRODUCT CONDITIONS */}
              <div className="space-y-2 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <label className="block text-neutral-700">Applies To Condition *</label>
                <select
                  value={couponForm.appliesTo}
                  onChange={(e) => setCouponForm({ ...couponForm, appliesTo: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                >
                  <option value="all">All Products in Store</option>
                  <option value="category">Specific Product Category Only</option>
                  <option value="product">Specific Single Product Only</option>
                </select>

                {couponForm.appliesTo === 'category' && (
                  <div>
                    <label className="block text-neutral-500 mb-1">Target Category</label>
                    <select
                      value={couponForm.targetCategory}
                      onChange={(e) => setCouponForm({ ...couponForm, targetCategory: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {couponForm.appliesTo === 'product' && (
                  <div>
                    <label className="block text-neutral-500 mb-1">Target Product</label>
                    <select
                      value={couponForm.targetProductId}
                      onChange={(e) => setCouponForm({ ...couponForm, targetProductId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">Status</label>
                  <select
                    value={couponForm.enabled ? 'true' : 'false'}
                    onChange={(e) => setCouponForm({ ...couponForm, enabled: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="true">Enabled (Active)</option>
                    <option value="false">Disabled (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 text-xs font-extrabold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  {editingCouponId ? 'Save Coupon Rules' : 'Create Coupon Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
