import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Smartphone, DollarSign, ShieldCheck, ArrowRight, Navigation, User, Phone, Mail, FileText, Home, Briefcase } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cartItems, userProfile, locations, currentLocation, setCurrentLocation, createOrder, addToast } = useApp();
  const navigate = useNavigate();

  // Form State for Customer & Delivery Details
  const [customerName, setCustomerName] = useState(userProfile.name || 'Lakshmi Narayana');
  const [customerPhone, setCustomerPhone] = useState(userProfile.phone || '+91 98765 43210');
  const [customerEmail, setCustomerEmail] = useState(userProfile.email || 'lakshmi.n@example.com');
  
  const [address, setAddress] = useState(currentLocation.address || 'Plot 42, Road No 12, Jubilee Hills');
  const [city, setCity] = useState(currentLocation.city || 'Hyderabad');
  const [pincode, setPincode] = useState(currentLocation.pincode || '500033');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const deliveryFee = subtotal > 499 ? 0 : 49;
  const grandTotal = subtotal + deliveryFee;

  // Auto-Detect GPS Location directly into Checkout Fields
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

          setAddress(detectedStreet);
          setCity(detectedCity);
          setPincode(detectedPincode);

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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('Cart Empty', 'Add products before checking out.', 'error');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      addToast('Missing Details', 'Please fill in all required customer & delivery fields.', 'error');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const orderLocation = {
        id: `loc-${Date.now()}`,
        label: 'Order Address',
        address,
        city,
        pincode,
      };
      setCurrentLocation(orderLocation);

      const order = createOrder(paymentMethod, orderLocation);
      setIsProcessing(false);
      navigate(`/order-success/${order.id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-8">
      
      {/* Header Banner */}
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Checkout Process</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Customer & Delivery Details</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Customer & Delivery Details Form + Payment Options */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SECTION 1: CUSTOMER & DELIVERY INFORMATION */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-5 shadow-subtle">
            
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                <User className="w-5 h-5 text-black" />
                <span>1. Customer & Delivery Information</span>
              </h3>

              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetecting}
                className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer shrink-0"
              >
                <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Detecting...' : '🎯 Auto-Detect GPS Location'}</span>
              </button>
            </div>

            {/* Saved Locations Quick Selector */}
            {locations.length > 0 && (
              <div className="space-y-1.5 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                  Quick Auto-Fill From Saved Addresses
                </span>
                <div className="flex flex-wrap gap-2">
                  {locations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setAddress(loc.address);
                        setCity(loc.city);
                        setPincode(loc.pincode);
                        addToast('Address Filled', `Selected ${loc.label} address.`, 'info');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:border-black text-xs font-extrabold text-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {loc.label === 'Home' ? <Home className="w-3 h-3 text-black" /> : <Briefcase className="w-3 h-3 text-black" />}
                      <span>{loc.label} ({loc.city})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full Form Fields */}
            <div className="space-y-4 text-xs font-bold">
              
              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-black" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-black" />
                    <span>Mobile / WhatsApp Number *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-black" />
                  <span>Email Address (For Order Receipt)</span>
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                />
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-black" />
                  <span>Flat / House No. / Street Address *</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Royal Palms, Road No 12"
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, Vijayawada"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Pincode / Zip *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="500033"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Special Delivery Instructions */}
              <div>
                <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-black" />
                  <span>Special Delivery Notes (Optional)</span>
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Leave package with security guard / Call before delivery"
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: PAYMENT METHOD OPTIONS */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-black" />
              <span>2. Payment Option</span>
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
              <div className="space-y-1 pt-2 text-xs font-bold text-left">
                <label className="block uppercase text-neutral-500">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@okicici"
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-mono"
                />
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Order Items Summary & Submit Button */}
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
                  <span className="font-mono font-bold text-black">₹{item.unitPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-neutral-600 font-mono pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
              <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                <span>Total Amount</span>
                <span className="font-mono">₹{grandTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              {isProcessing ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <span>Place Order • ₹{grandTotal}</span>
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

    </div>
  );
};
