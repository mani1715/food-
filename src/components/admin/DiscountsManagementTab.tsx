import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Coupon, CartOffer } from '../../types';
import {
  Percent,
  Plus,
  Trash2,
  Edit3,
  Tag,
  Check,
  X,
  ShieldAlert,
  ShoppingBag,
  Clock,
  Sparkles,
  Gift,
  Truck,
  Layers,
  ArrowRight,
  TrendingUp,
  Zap,
} from 'lucide-react';

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
    cartOffers,
    addCartOffer,
    updateCartOffer,
    deleteCartOffer,
    toggleCartOfferStatus,
  } = useApp();

  // Active view filter
  const [activeSection, setActiveSection] = useState<'all' | 'cart-offers' | 'coupons' | 'products'>('all');

  // ===================== CART OFFERS STATE =====================
  const [showCartOfferModal, setShowCartOfferModal] = useState(false);
  const [editingCartOfferId, setEditingCartOfferId] = useState<string | null>(null);
  const [cartOfferForm, setCartOfferForm] = useState<Omit<CartOffer, 'id' | 'usageCount'>>({
    title: '',
    description: '',
    offerType: 'flat',
    discountValue: 100,
    minCartValue: 999,
    minCartQuantity: 1,
    maxDiscount: undefined,
    freeGiftItemName: '',
    badgeText: 'HOT OFFER',
    expiryDate: '2026-12-31',
    enabled: true,
    autoApply: true,
  });

  // ===================== COUPON MODAL STATE =====================
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

  // ===================== PRODUCT DIRECT DISCOUNT STATE =====================
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [discountPercent, setDiscountPercent] = useState(15);
  const [productExpiryDate, setProductExpiryDate] = useState('2026-10-31');

  const discountedProducts = products.filter((p) => (p.discountPercentage || 0) > 0);

  // Quick Preset Templates for Cart Offers
  const applyCartOfferPreset = (preset: 'flat100' | 'percent15' | 'free_shipping' | 'free_gift') => {
    if (preset === 'flat100') {
      setCartOfferForm({
        title: 'Flat ₹100 Cart Discount',
        description: 'Instant Flat ₹100 OFF automatically applied on cart subtotal ₹999 or higher.',
        offerType: 'flat',
        discountValue: 100,
        minCartValue: 999,
        minCartQuantity: 1,
        badgeText: 'POPULAR CART OFFER',
        expiryDate: '2026-12-31',
        enabled: true,
        autoApply: true,
      });
    } else if (preset === 'percent15') {
      setCartOfferForm({
        title: '15% Mega Cart Savings',
        description: 'Get 15% OFF across your total cart on orders above ₹1,499 (Capped at ₹350).',
        offerType: 'percentage',
        discountValue: 15,
        minCartValue: 1499,
        minCartQuantity: 1,
        maxDiscount: 350,
        badgeText: 'MEGA SAVER',
        expiryDate: '2026-12-31',
        enabled: true,
        autoApply: true,
      });
    } else if (preset === 'free_shipping') {
      setCartOfferForm({
        title: 'Free Shipping on ₹499+',
        description: 'Unlock 100% Free Doorstep Delivery on all carts reaching ₹499.',
        offerType: 'free_shipping',
        discountValue: 49,
        minCartValue: 499,
        minCartQuantity: 1,
        badgeText: 'FREE SHIPPING',
        expiryDate: '2026-12-31',
        enabled: true,
        autoApply: true,
      });
    } else if (preset === 'free_gift') {
      setCartOfferForm({
        title: 'Free Authentic Sweet Box Sample',
        description: 'Complimentary 200g Authentic A2 Ghee Sweet Box included on orders over ₹1,999.',
        offerType: 'free_gift',
        discountValue: 0,
        minCartValue: 1999,
        minCartQuantity: 1,
        freeGiftItemName: 'Complimentary Pure Ghee Mysore Pak (200g)',
        badgeText: 'FREE GIFT',
        expiryDate: '2026-12-31',
        enabled: true,
        autoApply: true,
      });
    }
  };

  // Open Create Cart Offer Modal
  const handleOpenAddCartOffer = () => {
    setEditingCartOfferId(null);
    setCartOfferForm({
      title: 'Flat ₹150 Cart Discount',
      description: 'Instant Flat ₹150 OFF applied on carts reaching ₹1,299 or more.',
      offerType: 'flat',
      discountValue: 150,
      minCartValue: 1299,
      minCartQuantity: 1,
      badgeText: 'EXCLUSIVE CART DEAL',
      expiryDate: '2026-12-31',
      enabled: true,
      autoApply: true,
    });
    setShowCartOfferModal(true);
  };

  // Open Edit Cart Offer Modal
  const handleOpenEditCartOffer = (offer: CartOffer) => {
    setEditingCartOfferId(offer.id);
    setCartOfferForm({
      title: offer.title,
      description: offer.description,
      offerType: offer.offerType,
      discountValue: offer.discountValue,
      minCartValue: offer.minCartValue,
      minCartQuantity: offer.minCartQuantity || 1,
      maxDiscount: offer.maxDiscount,
      freeGiftItemName: offer.freeGiftItemName || '',
      badgeText: offer.badgeText || 'SPECIAL OFFER',
      expiryDate: offer.expiryDate || '',
      enabled: offer.enabled,
      autoApply: offer.autoApply,
    });
    setShowCartOfferModal(true);
  };

  // Submit Cart Offer Form
  const handleSaveCartOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartOfferForm.title.trim()) return;

    if (editingCartOfferId) {
      updateCartOffer(editingCartOfferId, cartOfferForm);
    } else {
      addCartOffer(cartOfferForm);
    }

    setShowCartOfferModal(false);
    setEditingCartOfferId(null);
  };

  // Open Create Coupon Modal
  const handleOpenAddCoupon = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      description: 'Special discount offer for our valued customers.',
      discountType: 'flat',
      discountValue: 200,
      minOrderAmount: 1500,
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
    <div className="space-y-10 text-left">
      {/* TOP STATS & QUICK FILTER BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveSection('cart-offers')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSection === 'cart-offers' || activeSection === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
              : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Cart Offers</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{cartOffers.filter((o) => o.enabled).length} Active</p>
          <p className="text-[11px] opacity-70 mt-0.5">Tiered promotions applied directly in basket</p>
        </div>

        <div
          onClick={() => setActiveSection('coupons')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSection === 'coupons'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
              : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Coupon Codes</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{coupons.filter((c) => c.enabled).length} Active</p>
          <p className="text-[11px] opacity-70 mt-0.5">Promo codes with minimum cart / category rules</p>
        </div>

        <div
          onClick={() => setActiveSection('products')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeSection === 'products'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
              : 'bg-white text-neutral-800 border-neutral-200 hover:border-black'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Product Discounts</span>
            <Percent className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black mt-2 font-mono">{discountedProducts.length} Items</p>
          <p className="text-[11px] opacity-70 mt-0.5">Direct catalog price cuts & flash deals</p>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'All Promotions & Discounts' },
          { id: 'cart-offers', label: `🛒 Cart Offers (${cartOffers.length})` },
          { id: 'coupons', label: `🎟️ Coupon Codes (${coupons.length})` },
          { id: 'products', label: `🏷️ Product Discounts (${discountedProducts.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeSection === tab.id
                ? 'bg-black text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: CART OFFERS (AUTO / TIER PROMOTIONS IN BASKET) */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'cart-offers') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Cart Offers & Tiered Promotions</h2>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                  Cart Level
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Configure instant rewards (Flat ₹ OFF, Percentage OFF, Free Delivery, or Free Gift Sample) that unlock automatically in the customer basket as cart value increases.
              </p>
            </div>

            <button
              onClick={handleOpenAddCartOffer}
              className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Cart Offer</span>
            </button>
          </div>

          {/* Cart Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cartOffers.map((offer) => (
              <div
                key={offer.id}
                className={`bg-white border rounded-3xl p-5 shadow-subtle transition-all flex flex-col justify-between space-y-4 ${
                  offer.enabled ? 'border-neutral-200 hover:border-black' : 'border-neutral-200 opacity-60 bg-neutral-50'
                }`}
              >
                <div>
                  {/* Card Header with Badges */}
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div className="space-y-1">
                      {offer.badgeText && (
                        <span className="px-2.5 py-0.5 bg-neutral-100 text-neutral-800 text-[10px] font-mono font-bold rounded-lg uppercase tracking-wider inline-block">
                          {offer.badgeText}
                        </span>
                      )}
                      <h3 className="text-sm font-extrabold text-black leading-snug">{offer.title}</h3>
                    </div>

                    <button
                      onClick={() => toggleCartOfferStatus(offer.id)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                        offer.enabled
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {offer.enabled ? 'Active ✅' : 'Disabled ❌'}
                    </button>
                  </div>

                  {/* Offer Reward Highlight */}
                  <div className="p-3 my-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      {offer.offerType === 'percentage' && <Percent className="w-4 h-4" />}
                      {offer.offerType === 'flat' && <Tag className="w-4 h-4" />}
                      {offer.offerType === 'free_shipping' && <Truck className="w-4 h-4" />}
                      {offer.offerType === 'free_gift' && <Gift className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-black block">
                        {offer.offerType === 'percentage' && `${offer.discountValue}% OFF Total Cart`}
                        {offer.offerType === 'flat' && `Flat ₹${offer.discountValue} Instant OFF`}
                        {offer.offerType === 'free_shipping' && `Free Doorstep Shipping`}
                        {offer.offerType === 'free_gift' && `Free Gift: ${offer.freeGiftItemName || 'Special Item'}`}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium">
                        {offer.autoApply ? '⚡ Auto-applied when qualified' : '👆 1-Click activate button in Cart'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">{offer.description}</p>
                </div>

                {/* Offer Rules Breakdown */}
                <div className="space-y-2 pt-3 border-t border-neutral-100 text-[11px] font-bold text-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-normal">Min. Cart Subtotal:</span>
                    <span className="font-mono text-black font-extrabold">₹{offer.minCartValue}</span>
                  </div>

                  {offer.minCartQuantity && offer.minCartQuantity > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-normal">Min. Items in Cart:</span>
                      <span className="font-mono text-neutral-800">{offer.minCartQuantity} items</span>
                    </div>
                  )}

                  {offer.maxDiscount && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-normal">Max Discount Cap:</span>
                      <span className="font-mono text-neutral-800">₹{offer.maxDiscount}</span>
                    </div>
                  )}

                  {offer.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 font-normal">Valid Until:</span>
                      <span className="font-mono text-neutral-800">{offer.expiryDate}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 font-normal">Total Cart Uses:</span>
                    <span className="font-mono text-neutral-800">{offer.usageCount || 0} orders</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => handleOpenEditCartOffer(offer)}
                      className="px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Offer</span>
                    </button>
                    <button
                      onClick={() => deleteCartOffer(offer.id)}
                      className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Delete Cart Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: STORE COUPONS & ACTIVATION RULES */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'coupons') && (
        <div className="space-y-6 border-t border-neutral-200 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Coupon Codes & Rule-Based Discounts</h2>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full uppercase">
                  Promo Codes
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Create shareable coupon codes with rules: minimum cart subtotal thresholds (e.g., ≥ ₹1500), category restrictions, or product-specific activation.
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
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: DIRECT PRODUCT PERCENTAGE DISCOUNTS */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'products') && (
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
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT CART OFFER MODAL */}
      {/* ========================================================================= */}
      {showCartOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-black">
                  {editingCartOfferId ? 'Edit Cart Offer' : 'Create New Cart Offer'}
                </h3>
                <p className="text-xs text-neutral-500">Offer will be automatically evaluated in customer cart</p>
              </div>
              <button
                onClick={() => setShowCartOfferModal(false)}
                className="p-1.5 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            {!editingCartOfferId && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Quick Fill Presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyCartOfferPreset('flat100')}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    ⚡ ₹100 OFF on ₹999+
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCartOfferPreset('percent15')}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    ⚡ 15% OFF on ₹1,499+
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCartOfferPreset('free_shipping')}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    ⚡ Free Delivery on ₹499+
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCartOfferPreset('free_gift')}
                    className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    ⚡ Free Sweet Box on ₹1,999+
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveCartOffer} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-700 mb-1">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat ₹150 OFF Mega Cart Deal"
                  value={cartOfferForm.title}
                  onChange={(e) => setCartOfferForm({ ...cartOfferForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">Offer Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Instant Flat ₹150 OFF applied automatically when your basket reaches ₹1,299."
                  value={cartOfferForm.description}
                  onChange={(e) => setCartOfferForm({ ...cartOfferForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-neutral-300 rounded-2xl font-normal focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Offer Reward Type *</label>
                  <select
                    value={cartOfferForm.offerType}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, offerType: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="flat">Flat Cash Discount (₹ OFF)</option>
                    <option value="percentage">Percentage Discount (% OFF)</option>
                    <option value="free_shipping">Free Doorstep Shipping</option>
                    <option value="free_gift">Free Complimentary Gift Sample</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">
                    Reward Value ({cartOfferForm.offerType === 'percentage' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    disabled={cartOfferForm.offerType === 'free_gift' || cartOfferForm.offerType === 'free_shipping'}
                    min="0"
                    placeholder={cartOfferForm.offerType === 'percentage' ? '15' : '150'}
                    value={cartOfferForm.discountValue}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, discountValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {cartOfferForm.offerType === 'free_gift' && (
                <div>
                  <label className="block text-neutral-700 mb-1">Free Complimentary Gift Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complimentary Pure A2 Ghee Mysore Pak Sample Box (200g)"
                    value={cartOfferForm.freeGiftItemName || ''}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, freeGiftItemName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Min. Cart Subtotal Required (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="999"
                    value={cartOfferForm.minCartValue}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, minCartValue: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono text-black font-extrabold focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">Min. Item Count in Basket (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={cartOfferForm.minCartQuantity || 1}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, minCartQuantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              {cartOfferForm.offerType === 'percentage' && (
                <div>
                  <label className="block text-neutral-700 mb-1">Max Discount Limit (₹) (Optional Cap)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={cartOfferForm.maxDiscount || ''}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, maxDiscount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Badge / Tag Text</label>
                  <input
                    type="text"
                    placeholder="e.g. LIMITED DEAL, CART BONUS"
                    value={cartOfferForm.badgeText || ''}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, badgeText: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl uppercase focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={cartOfferForm.expiryDate || ''}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl font-mono focus:ring-2 focus:ring-black focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 mb-1">Application Mode</label>
                  <select
                    value={cartOfferForm.autoApply ? 'true' : 'false'}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, autoApply: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="true">⚡ Auto-Apply in Cart</option>
                    <option value="false">👆 1-Click Apply Button</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 mb-1">Status</label>
                  <select
                    value={cartOfferForm.enabled ? 'true' : 'false'}
                    onChange={(e) => setCartOfferForm({ ...cartOfferForm, enabled: e.target.value === 'true' })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl focus:ring-2 focus:ring-black focus:outline-none"
                  >
                    <option value="true">Active (Enabled)</option>
                    <option value="false">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCartOfferModal(false)}
                  className="px-5 py-2.5 bg-neutral-100 text-neutral-700 text-xs font-extrabold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  {editingCartOfferId ? 'Save Cart Offer' : 'Create Cart Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE / EDIT COUPON MODAL */}
      {/* ========================================================================= */}
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
