import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Gift,
  Truck,
  Percent,
  Tag,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { CartOffer } from '../../types';

export const CartPage: React.FC = () => {
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    validateAndApplyCoupon,
    addToast,
    cartOffers,
    getBestCartOffer,
  } = useApp();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [manuallySelectedOfferId, setManuallySelectedOfferId] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

  // Dynamic Cart Offer Evaluation
  const cartOfferEvaluation = getBestCartOffer(cartItems, subtotal);
  const { bestOffer, discountAmount: autoCartDiscount, freeGift, isFreeShipping, nextOffer } = cartOfferEvaluation;

  // Selected or best auto-applied cart offer
  const activeCartOffer = manuallySelectedOfferId
    ? cartOffers.find((o) => o.id === manuallySelectedOfferId && o.enabled) || bestOffer
    : bestOffer;

  let cartOfferDiscount = 0;
  if (activeCartOffer) {
    if (activeCartOffer.offerType === 'percentage') {
      const raw = Math.round((subtotal * activeCartOffer.discountValue) / 100);
      cartOfferDiscount = activeCartOffer.maxDiscount ? Math.min(raw, activeCartOffer.maxDiscount) : raw;
    } else if (activeCartOffer.offerType === 'flat') {
      cartOfferDiscount = Math.min(subtotal, activeCartOffer.discountValue);
    }
  }

  // Delivery fee logic (Standard free over 499 or free shipping offer)
  const isFreeDeliveryQualified = subtotal > 499 || isFreeShipping || (activeCartOffer?.offerType === 'free_shipping');
  const deliveryFee = isFreeDeliveryQualified || subtotal === 0 ? 0 : 49;

  // Coupon discount
  const couponDiscount = appliedCouponInfo ? appliedCouponInfo.discountAmount : 0;

  // Total discount combined
  const totalDiscount = cartOfferDiscount + couponDiscount;
  const grandTotal = Math.max(0, subtotal + deliveryFee - totalDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateAndApplyCoupon(couponCode, cartItems, subtotal);
    if (result.success && result.coupon) {
      setAppliedCouponInfo({
        code: result.coupon.code,
        discountAmount: result.discountAmount,
      });
      addToast('Coupon Activated! 🎉', result.message, 'success');
    } else {
      setAppliedCouponInfo(null);
      addToast('Coupon Warning ⚠️', result.message, 'error');
    }
  };

  const handleSelectCartOffer = (offer: CartOffer) => {
    if (subtotal < offer.minCartValue) {
      addToast('Cart Offer Locked 🔒', `Add ₹${offer.minCartValue - subtotal} more to activate "${offer.title}".`, 'info');
      return;
    }
    setManuallySelectedOfferId(offer.id);
    addToast('Cart Offer Selected 🛒', `"${offer.title}" applied to your order!`, 'success');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Shopping Cart</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Your Food Basket</h1>
        </div>

        {cartItems.length > 0 && (
          <button onClick={clearCart} className="text-xs text-neutral-400 hover:text-black font-semibold underline cursor-pointer">
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <EmptyState
          type="cart"
          title="Your Cart is Empty"
          description="Explore our authentic homemade pickles, sweets, and snacks to add items to your cart."
          onAction={() => navigate('/products')}
          actionLabel="Start Shopping"
        />
      ) : (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* DYNAMIC CART OFFER & MILESTONE PROGRESSION BAR */}
          {/* ========================================================================= */}
          {activeCartOffer && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-black text-white shadow-md border border-emerald-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-black uppercase rounded-md">
                      {activeCartOffer.badgeText || 'CART OFFER UNLOCKED'}
                    </span>
                    <h3 className="text-sm font-black text-white">{activeCartOffer.title}</h3>
                  </div>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    {activeCartOffer.offerType === 'percentage' && `You save ${activeCartOffer.discountValue}% (₹${cartOfferDiscount}) on this cart!`}
                    {activeCartOffer.offerType === 'flat' && `Instant ₹${cartOfferDiscount} discount applied directly in your basket!`}
                    {activeCartOffer.offerType === 'free_shipping' && `100% Free Doorstep Express Delivery unlocked!`}
                    {activeCartOffer.offerType === 'free_gift' && `Free Gift Unlocked: ${activeCartOffer.freeGiftItemName || 'Special Box'}`}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700/50 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Offer Applied</span>
                </span>
              </div>
            </div>
          )}

          {/* NEXT UNLOCKABLE TIER PROGRESS BAR */}
          {nextOffer && (
            <div className="p-4 rounded-3xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-neutral-800">
                    Add <strong className="text-black font-mono font-extrabold">₹{nextOffer.missingAmount}</strong> more to unlock:
                  </span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg uppercase">
                    {nextOffer.offer.title}
                  </span>
                </div>
                <span className="font-mono text-neutral-500 font-bold">{nextOffer.progressPercentage}%</span>
              </div>

              {/* Progress Track */}
              <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-black h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${nextOffer.progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-3 sm:space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.selectedWeight}`}
                    className="p-3 sm:p-4 rounded-2xl border border-neutral-200 bg-white shadow-subtle flex flex-row items-center justify-between gap-2 sm:gap-4 text-left"
                  >
                    {/* Item Number, Image & Details */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-neutral-900 text-white text-[11px] sm:text-xs font-mono font-bold flex items-center justify-center shrink-0 shadow-sm">
                        #{index + 1}
                      </span>

                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4
                          onClick={() => navigate(`/product/${item.product.id}`)}
                          className="text-xs sm:text-sm font-bold text-black cursor-pointer hover:underline truncate"
                        >
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block text-[10px] bg-neutral-100 font-bold text-black px-1.5 py-0.5 rounded border border-neutral-200 shrink-0">
                            {item.selectedWeight}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-neutral-600 shrink-0">
                            ₹{item.unitPrice} each
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Subtotal */}
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="flex items-center border border-neutral-300 rounded-xl p-0.5 sm:p-1 bg-neutral-50">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.selectedWeight, item.quantity - 1)}
                          className="p-1 text-black hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
                          title="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 sm:w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.selectedWeight, item.quantity + 1)}
                          className="p-1 text-black hover:bg-neutral-200 rounded-lg cursor-pointer transition-colors"
                          title="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs sm:text-sm font-extrabold font-mono text-black min-w-[50px] sm:min-w-[65px] text-right">
                        ₹{item.unitPrice * item.quantity}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedWeight)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free Gift Notification in Basket */}
              {freeGift && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-950">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">Free Complimentary Item Added!</span>
                      <span className="text-xs font-medium">{freeGift}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-200 text-amber-900 text-xs font-black rounded-xl">FREE (₹0)</span>
                </div>
              )}

              {/* AVAILABLE STORE CART OFFERS SELECTOR */}
              {cartOffers.filter((o) => o.enabled).length > 0 && (
                <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-black" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-black">Available Cart Deals & Offers</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cartOffers
                      .filter((o) => o.enabled)
                      .map((offer) => {
                        const isQualified = subtotal >= offer.minCartValue;
                        const isSelected = activeCartOffer?.id === offer.id;

                        return (
                          <div
                            key={offer.id}
                            onClick={() => handleSelectCartOffer(offer)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                              isSelected
                                ? 'bg-black text-white border-black shadow-md'
                                : isQualified
                                ? 'bg-white text-neutral-900 border-neutral-300 hover:border-black'
                                : 'bg-white/60 text-neutral-500 border-neutral-200 opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-700'
                                }`}>
                                  {offer.badgeText || 'CART OFFER'}
                                </span>
                                <h4 className="text-xs font-extrabold mt-1 leading-snug">{offer.title}</h4>
                              </div>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-400 text-black'
                                  : isQualified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-neutral-200 text-neutral-600'
                              }`}>
                                {isSelected ? 'Applied ✅' : isQualified ? 'Qualified' : `Needs ₹${offer.minCartValue}`}
                              </span>
                            </div>

                            <p className={`text-[11px] leading-relaxed ${isSelected ? 'text-neutral-200' : 'text-neutral-600'}`}>
                              {offer.description}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4 shadow-subtle">
                <h3 className="text-base font-extrabold text-black border-b border-neutral-200 pb-3">Order Summary</h3>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon (e.g. AF05, FESTIVE1500)"
                    className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold uppercase font-mono"
                  />
                  <button type="submit" className="px-3.5 py-2 bg-black text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-neutral-800 transition-all">
                    Apply
                  </button>
                </form>

                {appliedCouponInfo && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between">
                    <span>Coupon "{appliedCouponInfo.code}" Activated!</span>
                    <span>-₹{appliedCouponInfo.discountAmount}</span>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-xs text-neutral-600 font-mono pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                    <span>₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Doorstep Shipping</span>
                    <span className={deliveryFee === 0 ? 'text-emerald-700 font-bold' : ''}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>

                  {cartOfferDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Cart Offer Savings</span>
                      <span>-₹{cartOfferDiscount}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount</span>
                      <span>-₹{couponDiscount}</span>
                    </div>
                  )}

                  {freeGift && (
                    <div className="flex justify-between text-amber-700 font-bold">
                      <span>Complimentary Gift</span>
                      <span>FREE</span>
                    </div>
                  )}

                  <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                    <span>Grand Total</span>
                    <span className="font-mono text-lg">₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate('/checkout', {
                      state: {
                        couponCode: appliedCouponInfo?.code,
                        couponDiscount,
                        cartOfferDiscount,
                        appliedOfferTitle: activeCartOffer?.title,
                      },
                    })
                  }
                  className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
                >
                  <span>Proceed To Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-semibold">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Secure SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
