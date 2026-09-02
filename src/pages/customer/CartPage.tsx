import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ShoppingBag, Heart } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const CartPage: React.FC = () => {
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, dishes, addToCart, toggleFavoriteDish, promotions, addToast } = useApp();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  const subtotal = cartItems.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);
  const deliveryFee = subtotal > 0 ? 3.50 : 0;
  const packagingFee = subtotal > 0 ? 1.50 : 0;
  const taxes = Number((subtotal * 0.05).toFixed(2));
  const total = Math.max(0, subtotal + deliveryFee + packagingFee + taxes - appliedDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const promo = promotions.find((p) => p.code.toLowerCase() === couponCode.trim().toLowerCase() && p.status === 'Active');
    if (promo) {
      const discountVal = Number(((subtotal * promo.discountPercent) / 100).toFixed(2));
      const finalDiscount = Math.min(discountVal, promo.maxDiscount);
      setAppliedDiscount(finalDiscount);
      addToast('Coupon Applied!', `Saved $${finalDiscount.toFixed(2)} with code ${promo.code}`);
    } else {
      addToast('Invalid Coupon', 'Coupon code not found or expired. Try "AURAFIRST"', 'error');
    }
  };

  const suggestedDishes = dishes.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Basket</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Shopping Cart</h1>
        </div>
        {cartItems.length > 0 && (
          <button onClick={clearCart} className="text-xs text-neutral-400 hover:text-black font-semibold underline">
            Clear All Items
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <EmptyState
          type="cart"
          title="Your Shopping Cart is Empty"
          description="Explore authentic home meals prepared by top verified neighborhood chefs."
          onAction={() => navigate('/explore')}
          actionLabel="Explore Home Menu"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-7 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.dish.id}
                className="p-4 sm:p-5 rounded-3xl border border-neutral-200 bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-subtle hover:border-black transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.dish.image}
                    alt={item.dish.name}
                    className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-black truncate">{item.dish.name}</h3>
                    <p className="text-xs text-neutral-500 font-medium">Prepared by {item.dish.chefName}</p>
                    <p className="text-base font-extrabold font-mono text-black mt-1">
                      ${(item.dish.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-300 rounded-xl px-2 py-1 shadow-subtle">
                    <button
                      onClick={() => updateCartQuantity(item.dish.id, -1)}
                      className="p-1 hover:bg-neutral-200 rounded text-black font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold font-mono text-black min-w-[16px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.dish.id, 1)}
                      className="p-1 hover:bg-neutral-200 rounded text-black font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      toggleFavoriteDish(item.dish.id);
                      removeFromCart(item.dish.id);
                    }}
                    className="p-2 text-neutral-400 hover:text-black"
                    title="Save for later"
                  >
                    <Heart className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.dish.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Suggested Dishes Section */}
            <div className="pt-8 border-t border-neutral-200 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">People Also Ordered</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {suggestedDishes.map((sd) => (
                  <div key={sd.id} className="p-3 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center gap-3">
                    <img src={sd.image} alt={sd.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-black truncate">{sd.name}</p>
                      <p className="text-xs font-mono font-bold text-black">${sd.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => addToCart(sd)} className="p-1.5 bg-black text-white rounded-lg">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-modal space-y-6">
              <h3 className="text-lg font-extrabold text-black border-b border-neutral-200 pb-3">
                Order Summary
              </h3>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code (e.g. AURAFIRST)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold uppercase focus:outline-none focus:border-black bg-white"
                  />
                </div>
                <button type="submit" className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl shadow-subtle">
                  Apply
                </button>
              </form>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs text-neutral-600 border-t border-b border-neutral-200 py-4">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-bold text-black font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eco Thermal Packaging</span>
                  <span className="font-bold text-black font-mono">${packagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Thermal Delivery</span>
                  <span className="font-bold text-black font-mono">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Taxes (5%)</span>
                  <span className="font-bold text-black font-mono">${taxes.toFixed(2)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Coupon Discount</span>
                    <span>-${appliedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-black pt-3 border-t border-neutral-200">
                  <span>Grand Total</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Shield */}
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-semibold bg-white p-3 rounded-xl border border-neutral-200">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>Verified Home Kitchen Hygiene Guaranteed</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-black text-white text-sm font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-subtle active:scale-95"
              >
                <span>Proceed To Checkout (${total.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
