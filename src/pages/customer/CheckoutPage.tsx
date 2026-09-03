import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Smartphone, DollarSign, Check, ShieldCheck, ArrowRight, Navigation, Plus, X, Home, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CheckoutPage: React.FC = () => {
  const { cartItems, locations, addLocation, currentLocation, setCurrentLocation, createOrder, addToast } = useApp();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Address Modal in Checkout
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newPincode, setNewPincode] = useState('500033');
  const [isDetecting, setIsDetecting] = useState(false);

  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const deliveryFee = subtotal > 35 ? 0 : 3.50;
  const grandTotal = subtotal + deliveryFee;

  // Auto-Detect GPS Location for Checkout Form
  const handleAutoDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      addToast('GPS Error', 'Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};

          const detectedCity =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.suburb ||
            addr.district ||
            'Hyderabad';

          const detectedPincode = addr.postcode || '500001';

          const detectedStreet = [
            addr.road,
            addr.suburb,
            addr.neighbourhood,
            addr.residential,
          ]
            .filter(Boolean)
            .join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || 'Current Location';

          setNewAddress(detectedStreet);
          setNewCity(detectedCity);
          setNewPincode(detectedPincode);

          addToast('Location Detected!', `Auto-filled details for ${detectedCity}, ${detectedPincode}.`, 'success');
        } catch (err) {
          addToast('Detection Failed', 'Please enter your address details manually.', 'error');
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
        addToast('Permission Denied', 'Please allow GPS location or enter details manually.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !newCity.trim() || !newPincode.trim()) return;

    addLocation({
      label: newLabel,
      address: newAddress,
      city: newCity,
      pincode: newPincode,
    });

    setShowAddAddressModal(false);
    setNewAddress('');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('Cart Empty', 'Add products before checking out.', 'error');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const order = createOrder(paymentMethod, currentLocation);
      setIsProcessing(false);
      navigate(`/order-success/${order.id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Placement</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Express Checkout</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Address Selector */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                <MapPin className="w-5 h-5 text-black" />
                <span>1. Delivery Address</span>
              </h3>

              <button
                type="button"
                onClick={() => setShowAddAddressModal(true)}
                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-subtle cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Detect Address</span>
              </button>
            </div>

            <div className="space-y-3">
              {locations.map((loc) => {
                const isSelected = loc.id === currentLocation.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setCurrentLocation(loc)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected ? 'border-black bg-neutral-50 shadow-subtle' : 'border-neutral-200 hover:border-black'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-black">{loc.label}</span>
                        {isSelected && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-bold">Selected</span>}
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">{loc.address}, {loc.city} - {loc.pincode}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-black border-black text-white' : 'border-neutral-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Payment Method UI */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-black" />
              <span>2. Payment Options (Mock UI)</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'UPI', label: 'UPI / GPay', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'Card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'COD', label: 'Cash on Delivery', icon: <DollarSign className="w-4 h-4" /> },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                    paymentMethod === pm.id ? 'bg-black text-white border-black shadow-subtle' : 'bg-neutral-50 text-black border-neutral-200 hover:border-black'
                  }`}
                >
                  {pm.icon}
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="space-y-1 pt-2">
                <label className="block text-xs font-bold uppercase text-neutral-500">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@okicici"
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold font-mono"
                />
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Items Summary & Submit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4 shadow-subtle">
            <h3 className="text-base font-extrabold text-black border-b border-neutral-200 pb-3">Items in Order</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium pb-2 border-b border-neutral-200">
                  <div>
                    <p className="font-bold text-black">{item.product.name}</p>
                    <p className="text-[10px] text-neutral-500">Qty: {item.quantity} • Weight: {item.selectedWeight}</p>
                  </div>
                  <span className="font-mono font-bold text-black">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-neutral-600 font-mono pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span></div>
              <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                <span>Total Amount</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              {isProcessing ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>Place Order • ${grandTotal.toFixed(2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Guaranteed Fresh Packaging Delivery</span>
          </div>
        </div>

      </form>

      {/* Add New Address Modal with GPS Detect Option */}
      <AnimatePresence>
        {showAddAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-extrabold text-black">Add Delivery Address</h3>
                <button onClick={() => setShowAddAddressModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detect Location Trigger Bar */}
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-extrabold text-black block">📍 Auto-Fill via GPS</span>
                  <span className="text-[11px] text-neutral-500">Detect current location & fill fields automatically</span>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isDetecting}
                  className="px-3 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer shrink-0"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>{isDetecting ? 'Detecting...' : 'Detect Location'}</span>
                </button>
              </div>

              <form onSubmit={handleAddAddressSubmit} className="space-y-4 text-xs font-bold">
                
                {/* Address Label Pills */}
                <div>
                  <label className="block text-neutral-500 mb-1">Address Label</label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setNewLabel(lbl)}
                        className={`flex-1 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          newLabel === lbl ? 'bg-black text-white border-black shadow-subtle' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {lbl === 'Home' ? <Home className="w-3.5 h-3.5" /> : lbl === 'Work' ? <Briefcase className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        <span>{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Street Address / Flat / Door No.</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Flat 302, Royal Palms, Road No 10"
                    className="w-full p-3 rounded-2xl border border-neutral-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full p-3 rounded-2xl border border-neutral-300"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      placeholder="500033"
                      className="w-full p-3 rounded-2xl border border-neutral-300 font-mono"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle cursor-pointer">
                  Save Delivery Address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
