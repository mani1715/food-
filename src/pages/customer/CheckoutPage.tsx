import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CreditCard, ShieldCheck, ArrowRight, Check, Plus, AlertCircle } from 'lucide-react';
import { UserLocation } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { cartItems, locations, currentLocation, setCurrentLocation, createOrder, addToast } = useApp();
  const navigate = useNavigate();

  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'scheduled'>('standard');
  const [scheduledSlot, setScheduledSlot] = useState('Today, 01:30 PM - 02:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Credit/Debit Card' | 'Cash on Delivery'>('UPI');
  const [upiId, setUpiId] = useState('vikram@upi');
  const [orderNotes, setOrderNotes] = useState('');

  const subtotal = cartItems.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);
  const deliveryFee = 3.50;
  const packagingFee = 1.50;
  const taxes = Number((subtotal * 0.05).toFixed(2));
  const total = subtotal + deliveryFee + packagingFee + taxes;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('Cart is Empty', 'Please add dishes to your cart before checking out.', 'error');
      navigate('/explore');
      return;
    }

    const newOrder = createOrder({
      paymentMethod,
      deliveryAddress: currentLocation,
    });

    navigate(`/order-success/${newOrder.id}`);
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      {/* Header */}
      <div className="mb-8 border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Step 3 of 3</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Order Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Sections */}
        <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-8">
          
          {/* Section 1: Delivery Address Selection */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                <MapPin className="w-5 h-5 text-black" />
                <span>1. Delivery Address</span>
              </h3>
            </div>

            <div className="space-y-3">
              {locations.map((loc) => {
                const isSelected = loc.id === currentLocation.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setCurrentLocation(loc)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-black bg-white shadow-subtle'
                        : 'border-neutral-200 bg-neutral-100 hover:border-neutral-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black">{loc.label}</span>
                        {loc.isDefault && (
                          <span className="text-[10px] bg-neutral-200 text-black font-semibold px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 font-medium">{loc.address}</p>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Delivery Options */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2 border-b border-neutral-200 pb-3">
              <Clock className="w-5 h-5 text-black" />
              <span>2. Delivery Speed & Schedule</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setDeliveryOption('standard')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryOption === 'standard' ? 'border-black bg-white shadow-subtle' : 'border-neutral-200 bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-black">Express Thermal</span>
                  <span className="text-xs font-mono font-bold text-black">25-30 Mins</span>
                </div>
                <p className="text-xs text-neutral-500">Delivered immediately after clay pot cooking.</p>
              </div>

              <div
                onClick={() => setDeliveryOption('scheduled')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  deliveryOption === 'scheduled' ? 'border-black bg-white shadow-subtle' : 'border-neutral-200 bg-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-black">Scheduled Pre-order</span>
                  <span className="text-xs font-mono font-bold text-black">Select Slot</span>
                </div>
                <p className="text-xs text-neutral-500">Reserve lunch or dinner for later today.</p>
              </div>
            </div>

            {deliveryOption === 'scheduled' && (
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Select Delivery Time Slot</label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
                >
                  <option value="Today, 01:30 PM - 02:00 PM">Today, 01:30 PM - 02:00 PM (Lunch)</option>
                  <option value="Today, 07:30 PM - 08:00 PM">Today, 07:30 PM - 08:00 PM (Dinner)</option>
                  <option value="Tomorrow, 12:30 PM - 01:00 PM">Tomorrow, 12:30 PM - 01:00 PM (Lunch)</option>
                </select>
              </div>
            )}
          </div>

          {/* Section 3: Mock Payment Method UI */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-black" />
                <span>3. Payment Method (Mock UI)</span>
              </h3>
              <span className="text-[10px] bg-neutral-200 text-black font-semibold px-2 py-0.5 rounded">
                Simulated Sandbox
              </span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'UPI', label: 'Instant UPI (Google Pay / PhonePe)', sub: 'Fastest payment mode' },
                { id: 'Credit/Debit Card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
                { id: 'Cash on Delivery', label: 'Cash on Delivery (COD)', sub: 'Pay cash to delivery partner' },
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? 'border-black bg-white shadow-subtle' : 'border-neutral-200 bg-neutral-100'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-black">{method.label}</h4>
                      <p className="text-xs text-neutral-500">{method.sub}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Enter Virtual UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
                  placeholder="yourname@upi"
                />
              </div>
            )}
          </div>

          {/* Section 4: Kitchen Cooking Notes */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-black">Chef Cooking Instructions</label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Please make the curry less spicy, extra curry leaves..."
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black bg-white"
            />
          </div>

          {/* Submit Order Button (Desktop) */}
          <button
            type="submit"
            className="w-full py-4 bg-black text-white text-base font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-modal active:scale-95"
          >
            <span>Place Order Now (${total.toFixed(2)})</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Right Column: Order Summary Review */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-950 text-white rounded-3xl p-6 shadow-modal space-y-6 border border-neutral-800">
            <h3 className="text-lg font-extrabold text-white border-b border-neutral-800 pb-3">
              Order Items ({cartItems.length})
            </h3>

            {/* Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
              {cartItems.map((item) => (
                <div key={item.dish.id} className="flex items-center justify-between text-xs pb-2 border-b border-neutral-850">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-neutral-400">{item.quantity}x</span>
                    <span className="font-bold text-white truncate max-w-[160px]">{item.dish.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">${(item.dish.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Summary Breakdown */}
            <div className="space-y-2 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Packaging & Thermal Container</span>
                <span className="text-white font-mono">${packagingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Delivery</span>
                <span className="text-white font-mono">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Service</span>
                <span className="text-white font-mono">${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-3 border-t border-neutral-800">
                <span>Total Amount</span>
                <span className="font-mono">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl text-[11px] text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span>Direct Payment To Certified Home Chef</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
