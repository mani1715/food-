import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, CreditCard, Smartphone, DollarSign, ShieldCheck, ArrowRight, Navigation, User, Phone, Mail, FileText, Home, Briefcase, Tag, Gift } from 'lucide-react';

import { validateEmail, validateIndianPhone, validatePincode } from '../../utils/security';

export const CheckoutPage: React.FC = () => {
  const { cartItems, userProfile, locations, currentLocation, setCurrentLocation, createOrder, addToast, getBestCartOffer } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const passedState = location.state as {
    couponCode?: string;
    couponDiscount?: number;
    cartOfferDiscount?: number;
    appliedOfferTitle?: string;
  } | undefined;

  // Form State for Customer & Delivery Details
  const [customerName, setCustomerName] = useState(userProfile.name || 'Lakshmi Narayana');
  const [customerPhone, setCustomerPhone] = useState(userProfile.phone || '9876543210');
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

  // Dynamic Cart Offer & Coupon Evaluation
  const { bestOffer, discountAmount: autoCartDiscount, freeGift, isFreeShipping } = getBestCartOffer(cartItems, subtotal);
  const cartOfferDiscount = passedState?.cartOfferDiscount !== undefined ? passedState.cartOfferDiscount : autoCartDiscount;
  const couponDiscount = passedState?.couponDiscount || 0;
  const totalDiscount = cartOfferDiscount + couponDiscount;

  const isFreeDeliveryQualified = subtotal > 499 || isFreeShipping || (bestOffer?.offerType === 'free_shipping');
  const deliveryFee = isFreeDeliveryQualified || subtotal === 0 ? 0 : 49;
  const grandTotal = Math.max(0, subtotal + deliveryFee - totalDiscount);



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

  const [idempotencyKey] = useState<string>(
    () => `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addToast('Cart Empty', 'Add products before checking out.', 'error');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      addToast('Missing Details', 'Please fill in all required customer & delivery fields.', 'error');
      return;
    }

    if (customerEmail.trim() && !validateEmail(customerEmail.trim())) {
      addToast('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    if (!validateIndianPhone(customerPhone.trim())) {
      addToast('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (!validatePincode(pincode.trim())) {
      addToast('Invalid PIN Code', 'Please enter a valid 6-digit postal PIN code.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const orderLocation = {
        id: `loc-${Date.now()}`,
        label: 'Order Address',
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      };
      const appliedTitle =
        passedState?.appliedOfferTitle || bestOffer?.title;
      const couponCode = passedState?.couponCode;

      // 1. Create Authoritative Local Order in Database (Status: placed, Payment: pending/cod_pending)
      const order = await createOrder(paymentMethod, orderLocation, {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail.trim(),
        discount: totalDiscount,
        appliedOfferTitle: appliedTitle,
        couponCode: couponCode,
        idempotencyKey: idempotencyKey,
      });

      // 2. If COD, order is placed immediately
      if (paymentMethod === 'COD') {
        setIsProcessing(false);
        navigate(`/order-success/${order.id}`);
        return;
      }

      // 3. Online Payment (Razorpay Test Mode Integration)
      try {
        const { initiateRazorpayOrder, verifyRazorpayPaymentOnServer } = await import('../../lib/razorpay/api');
        const { openRazorpayModal } = await import('../../lib/razorpay/checkout');

        const rzpOrderData = await initiateRazorpayOrder(order.id, order.paymentSessionToken, deliveryNotes);

        await openRazorpayModal({
          key: rzpOrderData.keyId || (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '',
          amount: rzpOrderData.amount,
          currency: rzpOrderData.currency || 'INR',
          name: 'Aishu Home Foods',
          description: `Payment for Order #${order.orderNumber}`,
          order_id: rzpOrderData.razorpayOrderId,
          prefill: {
            name: customerName.trim(),
            contact: customerPhone.trim(),
            email: customerEmail.trim(),
          },
          theme: {
            color: '#000000',
          },
          handler: async (response) => {
            try {
              addToast('Verifying Payment ⏳', 'Verifying transaction signature with server...', 'info');
              await verifyRazorpayPaymentOnServer(
                order.id,
                order.paymentSessionToken,
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              setIsProcessing(false);
              navigate(`/order-success/${order.id}`);
            } catch (verifErr: any) {
              setIsProcessing(false);
              addToast(
                'Payment Verification Notice',
                verifErr.message || 'Payment received. Server is reconciling your order.',
                'info'
              );
              navigate(`/order-success/${order.id}`);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              addToast(
                'Payment Incomplete',
                'You closed the payment window. Your order is saved and can be paid from the Track Order page.',
                'info'
              );
              navigate(`/track-order?id=${order.orderNumber}`);
            },
          },
        });
      } catch (rzpErr: any) {
        setIsProcessing(false);
        console.warn('Razorpay Gateway Notice:', rzpErr.message);
        addToast(
          'Order Recorded (Payment Gateway Notice)',
          'Order recorded in system. If Razorpay Test Mode keys are pending configuration, please complete payment on delivery or retry.',
          'info'
        );
        navigate(`/order-success/${order.id}`);
      }
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Order placement failed:', err);
      addToast(
        'Order Placement Notice ⚠️',
        err.message || 'Could not complete order. Please check item stock and details.',
        'error'
      );
    }
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
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                <User className="w-5 h-5 text-black" />
                <span>1. Customer & Delivery Information</span>
              </h3>

              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetecting}
                className="w-full sm:w-auto px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer shrink-0"
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
                    autoComplete="name"
                    autoCapitalize="words"
                    inputMode="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-black" />
                    <span>Mobile / WhatsApp Number *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold font-mono bg-white focus:outline-none focus:border-black"
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
                  autoComplete="email"
                  inputMode="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
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
                  autoComplete="street-address"
                  inputMode="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 302, Royal Palms, Road No 12"
                  className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
                />
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-500 mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    autoComplete="address-level2"
                    inputMode="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, Vijayawada"
                    className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">PIN Code (6 digits) *</label>
                  <input
                    type="text"
                    required
                    autoComplete="postal-code"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="500033"
                    className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-mono font-bold bg-white focus:outline-none focus:border-black"
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
                  className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: PAYMENT METHOD OPTIONS */}
          <div className="p-4 sm:p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-black" />
              <span>2. Payment Option</span>
            </h3>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { id: 'UPI', label: 'UPI / GPay', icon: <Smartphone className="w-4 h-4" /> },
                { id: 'Card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'COD', label: 'Cash on Del.', icon: <DollarSign className="w-4 h-4" /> },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`p-3 sm:p-3.5 min-h-[52px] rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                    paymentMethod === pm.id ? 'bg-black text-white border-black shadow-subtle' : 'bg-neutral-50 text-black border-neutral-200 hover:border-black'
                  }`}
                >
                  {pm.icon}
                  <span className="text-[11px] leading-none">{pm.label}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'UPI' && (
              <div className="space-y-1 pt-2 text-xs font-bold text-left">
                <label className="block uppercase text-neutral-500">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  autoComplete="off"
                  inputMode="email"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@okaxis"
                  className="w-full p-3 min-h-[44px] rounded-2xl border border-neutral-300 font-mono text-base sm:text-xs font-bold bg-white focus:outline-none focus:border-black"
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
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-black">{item.product.name}</p>
                      <p className="text-[10px] text-neutral-500">Qty: {item.quantity} • Weight: {item.selectedWeight}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-black">₹{item.unitPrice * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 text-xs text-neutral-600 font-mono pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={deliveryFee === 0 ? 'text-emerald-700 font-bold' : ''}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {cartOfferDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Cart Offer ({passedState?.appliedOfferTitle || bestOffer?.title})</span>
                  <span>-₹{cartOfferDiscount}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Coupon Code ({passedState?.couponCode || 'APPLIED'})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              {freeGift && (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Free Gift Included</span>
                  <span>{freeGift}</span>
                </div>
              )}

              <div className="flex justify-between text-black font-extrabold text-base pt-3 border-t border-neutral-200 font-sans">
                <span>Total Amount</span>
                <span className="font-mono">₹{grandTotal}</span>
              </div>
            </div>


            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 sm:py-4 min-h-[48px] bg-black text-white text-sm sm:text-xs font-black rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-modal cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Order...</span>
                </div>
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
