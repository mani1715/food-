import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const CartPage: React.FC = () => {
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, addToast } = useApp();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const deliveryFee = subtotal > 35 || subtotal === 0 ? 0 : 3.50;
  const discount = appliedCoupon ? 5.00 : 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'AURAFIRST') {
      setAppliedCoupon('AURAFIRST');
      addToast('Coupon Applied!', '$5.00 discount applied to your order.');
    } else {
      addToast('Invalid Coupon', 'Try coupon code AURAFIRST', 'error');
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
          <button onClick={clearCart} className="text-xs text-neutral-400 hover:text-black font-semibold underline">
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
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedWeight}`}
                className="p-4 sm:p-5 rounded-3xl border border-neutral-200 bg-white shadow-subtle flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-neutral-200 shrink-0"
                  />
                  <div className="space-y-1">
                    <h4
                      onClick={() => navigate(`/product/${item.product.id}`)}
                      className="text-sm sm:text-base font-bold text-black cursor-pointer hover:underline"
                    >
                      {item.product.name}
                    </h4>
                    <span className="inline-block text-[10px] bg-neutral-100 font-bold text-black px-2 py-0.5 rounded border border-neutral-200">
                      Weight: {item.selectedWeight}
                    </span>
                    <p className="text-xs font-mono font-bold text-neutral-600">${item.unitPrice.toFixed(2)} each</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity Controller */}
                  <div className="flex items-center border border-neutral-300 rounded-xl p-1 bg-neutral-50">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.selectedWeight, item.quantity - 1)}
                      className="p-1 text-black hover:bg-neutral-200 rounded-lg"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, item.selectedWeight, item.quantity + 1)}
                      className="p-1 text-black hover:bg-neutral-200 rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="text-sm font-extrabold font-mono text-black min-w-[60px] text-right">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedWeight)}
                    className="p-2 text-neutral-400 hover:text-rose-600"
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
                <button type="submit" className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl">
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center justify-between">
                  <span>Code {appliedCoupon} Applied!</span>
                  <span>-$5.00</span>
                </div>
              )}

              <div className="space-y-2 text-xs text-neutral-600 font-mono pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-black font-bold"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                  <span>Grand Total</span>
                  <span className="font-mono">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
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
