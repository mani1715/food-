import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const CartPage: React.FC = () => {
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, validateAndApplyCoupon, addToast } = useApp();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<{ code: string; discountAmount: number } | null>(null);

  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 49;
  const discount = appliedCouponInfo ? appliedCouponInfo.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-3 sm:space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={`${item.product.id}-${item.selectedWeight}`}
                className="p-3 sm:p-4 rounded-2xl border border-neutral-200 bg-white shadow-subtle flex flex-row items-center justify-between gap-2 sm:gap-4 text-left"
              >
                {/* Item Number, Image & Details */}
                <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                  {/* Product Serial Number Badge */}
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

                {/* Right Side: Quantity Controller, Subtotal & Delete */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  {/* Quantity Controller */}
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

                  {/* Subtotal */}
                  <span className="text-xs sm:text-sm font-extrabold font-mono text-black min-w-[50px] sm:min-w-[65px] text-right">
                    ₹{item.unitPrice * item.quantity}
                  </span>

                  {/* Remove Button */}
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

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4 shadow-subtle">
              <h3 className="text-base font-extrabold text-black border-b border-neutral-200 pb-3">Order Summary</h3>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon (e.g. AURAFIRST)"
                  className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold uppercase font-mono"
                />
                <button type="submit" className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl cursor-pointer">
                  Apply
                </button>
              </form>

              {appliedCouponInfo && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between">
                  <span>Coupon {appliedCouponInfo.code} Activated!</span>
                  <span>-₹{appliedCouponInfo.discountAmount}</span>
                </div>
              )}

              <div className="space-y-2 text-xs text-neutral-600 font-mono pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-black font-bold"><span>Discount</span><span>-₹{discount}</span></div>
                )}
                <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                  <span>Grand Total</span>
                  <span className="font-mono">₹{grandTotal}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
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
      )}

    </div>
  );
};
