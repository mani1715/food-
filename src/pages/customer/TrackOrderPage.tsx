import React, { useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  User,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';

export const TrackOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { orders, addToCart, cancelOrder, updatePaymentStatus, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Complete Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [paymentSubMethod, setPaymentSubMethod] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      addToast('Search Required', 'Please enter your Order ID, Tracking Code, Phone Number, or Email.', 'error');
      return;
    }

    setLoading(true);
    setSearched(true);

    setTimeout(() => {
      // Clean non-digits for phone search comparison
      const cleanQueryDigits = query.replace(/\D/g, '');

      const matches = orders.filter((o) => {
        const orderIdMatch = o.id.toLowerCase().includes(query);
        const orderNumMatch = o.orderNumber.toLowerCase().includes(query);
        const trackingMatch = o.trackingCode ? o.trackingCode.toLowerCase().includes(query) : false;
        
        // Customer details check
        const phoneMatch = o.customerPhone ? o.customerPhone.replace(/\D/g, '').includes(cleanQueryDigits) && cleanQueryDigits.length >= 4 : false;
        const emailMatch = o.customerEmail ? o.customerEmail.toLowerCase().includes(query) : false;
        const addressPhoneMatch = o.deliveryAddress?.pincode?.includes(query); // Pincode backup

        return orderIdMatch || orderNumMatch || trackingMatch || phoneMatch || emailMatch || addressPhoneMatch;
      });

      setMatchedOrders(matches);
      setExpandedIndex(matches.length > 0 ? 0 : null);
      setLoading(false);
    }, 400);
  };

  const getStatusIcon = (orderStatus: Order['orderStatus']) => {
    switch (orderStatus) {
      case 'pending':
      case 'confirmed':
        return <Clock className="w-6 h-6 text-amber-600" />;
      case 'processing':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'shipped':
      case 'out for delivery':
        return <Truck className="w-6 h-6 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-emerald-600" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-rose-600" />;
      default:
        return <Package className="w-6 h-6 text-neutral-500" />;
    }
  };

  const getStatusBadge = (orderStatus: Order['orderStatus']) => {
    switch (orderStatus) {
      case 'pending':
      case 'confirmed':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'processing':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'shipped':
      case 'out for delivery':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item.product, item.selectedWeight, item.quantity);
    });
    addToast('Added to Cart', `${order.items.length} item(s) from Order #${order.orderNumber} added to cart.`, 'success');
    navigate('/cart');
  };

  const handleConfirmCancel = () => {
    if (!selectedOrderForCancel) return;
    if (!cancelReason.trim()) {
      addToast('Reason Required', 'Please provide a reason for cancelling this order.', 'error');
      return;
    }

    cancelOrder(selectedOrderForCancel.id, cancelReason.trim());
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedOrderForCancel(null);

    // Refresh matched state
    setMatchedOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderForCancel.id
          ? { ...o, status: 'Cancelled', orderStatus: 'cancelled', cancelReason: cancelReason.trim() }
          : o
      )
    );
  };

  const handleConfirmPayment = () => {
    if (!selectedOrderForPayment) return;
    if (paymentMethod === 'upi' && !paymentSubMethod) {
      addToast('Selection Required', 'Please select an online UPI app.', 'error');
      return;
    }
    if (paymentMethod === 'card' && !paymentSubMethod) {
      addToast('Selection Required', 'Please select Debit or Credit card option.', 'error');
      return;
    }

    updatePaymentStatus(selectedOrderForPayment.id, 'completed');
    setShowPaymentModal(false);
    setSelectedOrderForPayment(null);
    setPaymentSubMethod('');

    // Refresh matched state
    setMatchedOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrderForPayment.id
          ? { ...o, paymentStatus: 'completed' }
          : o
      )
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-black py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Real-time Order Status</span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">Track Your Order</h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium">
          Enter your <span className="font-bold text-black">Phone Number</span>, <span className="font-bold text-black">Order ID</span> (e.g. AURA-98214), <span className="font-bold text-black">Tracking Code</span>, or <span className="font-bold text-black">Email Address</span>.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter Phone, Order ID, Tracking Code, or Email..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-200 text-sm font-bold focus:outline-none focus:border-black bg-neutral-50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-black hover:bg-neutral-800 text-white rounded-2xl font-extrabold text-sm transition-all shadow-subtle cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? (
              <span className="animate-pulse">Searching...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Order</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="space-y-6">
          {matchedOrders.length > 0 ? (
            <>
              {matchedOrders.length > 1 && (
                <div className="bg-neutral-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-subtle">
                  <span>📦 Found {matchedOrders.length} orders associated with your query</span>
                  <span className="text-neutral-400 text-xs">Click order to expand</span>
                </div>
              )}

              {matchedOrders.map((ord, idx) => {
                const isExpanded = expandedIndex === idx;

                return (
                  <div
                    key={ord.id}
                    className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-subtle hover:border-black transition-all"
                  >
                    {/* Header Bar */}
                    <div
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="p-6 bg-neutral-900 text-white cursor-pointer hover:bg-black transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg sm:text-xl font-extrabold font-mono tracking-tight">Order #{ord.orderNumber}</h2>
                          {matchedOrders.length > 1 && (
                            <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-neutral-700">
                              {idx + 1} of {matchedOrders.length}
                            </span>
                          )}
                        </div>
                        {ord.trackingCode && (
                          <p className="text-xs text-neutral-400 font-mono">Tracking Code: <span className="text-white font-bold">{ord.trackingCode}</span></p>
                        )}
                        <p className="text-xs text-neutral-400">Placed on {ord.date}</p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${getStatusBadge(ord.orderStatus)}`}>
                          ● {ord.orderStatus}
                        </span>
                        <div className="p-2 bg-neutral-800 rounded-xl">
                          {getStatusIcon(ord.orderStatus)}
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
                      </div>
                    </div>

                    {/* Expandable Order Details */}
                    {isExpanded && (
                      <div className="divide-y divide-neutral-100">
                        
                        {/* Order Timeline / Status & Quick Actions */}
                        <div className="p-6 bg-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Status</span>
                            <h3 className="text-base font-extrabold text-black capitalize mt-0.5">
                              Order is currently <span className="underline decoration-black">{ord.orderStatus}</span>
                            </h3>
                            {ord.cancelReason && (
                              <p className="text-xs text-rose-600 font-medium mt-1">Cancellation Note: {ord.cancelReason}</p>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            {ord.paymentStatus === 'pending' && ord.status !== 'Cancelled' && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForPayment(ord);
                                  setShowPaymentModal(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-subtle"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Complete Payment</span>
                              </button>
                            )}

                            {ord.status !== 'Cancelled' && ord.orderStatus !== 'delivered' && (
                              <button
                                onClick={() => {
                                  setSelectedOrderForCancel(ord);
                                  setShowCancelModal(true);
                                }}
                                className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel Order</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleReorder(ord)}
                              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-subtle"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reorder Items</span>
                            </button>
                          </div>
                        </div>

                        {/* Customer & Delivery Details */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer info */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-black" />
                              Customer Details
                            </h4>
                            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-neutral-500 font-medium">Customer Name:</span>
                                <span className="font-bold text-black">{ord.customerName || 'Customer'}</span>
                              </div>
                              <div className="flex justify-between font-mono">
                                <span className="text-neutral-500 font-medium">Phone Number:</span>
                                <span className="font-bold text-black">{ord.customerPhone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-500 font-medium">Email Address:</span>
                                <span className="font-bold text-black">{ord.customerEmail || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Address info */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-black" />
                              Delivery Address
                            </h4>
                            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-1 text-xs">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-black text-white font-extrabold text-[10px] mb-1">
                                {ord.deliveryAddress?.label || 'Home'}
                              </span>
                              <p className="font-bold text-black">{ord.deliveryAddress?.address}</p>
                              <p className="text-neutral-600">{ord.deliveryAddress?.city}, {ord.deliveryAddress?.pincode}</p>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="p-6 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order Items</h4>
                          <div className="space-y-3">
                            {ord.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex items-center gap-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-3">
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-14 h-14 object-cover rounded-xl border border-neutral-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-extrabold text-sm text-black truncate">{item.product.name}</h5>
                                  <p className="text-xs text-neutral-500 font-medium">Weight: {item.selectedWeight} | Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-extrabold text-sm text-black">₹{item.unitPrice * item.quantity}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Payment & Summary */}
                        <div className="p-6 bg-neutral-950 text-white rounded-b-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="text-xs space-y-1">
                            <p className="text-neutral-400">Payment Method: <span className="font-bold text-white uppercase">{ord.paymentMethod}</span></p>
                            <p className="text-neutral-400">Payment Status: <span className={`font-bold capitalize ${ord.paymentStatus === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>{ord.paymentStatus}</span></p>
                          </div>
                          <div className="text-right self-end sm:self-auto">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest block">Total Amount</span>
                            <span className="text-2xl font-black font-mono text-white">₹{ord.total}</span>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            /* No Orders Found State */
            <div className="bg-white border border-neutral-200 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-subtle">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
                <AlertCircle className="w-8 h-8 text-neutral-500" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-black">No Orders Found</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  We couldn't locate any order matching "<span className="font-bold text-black">{searchTerm}</span>". Please double-check your phone number, order number, or tracking code.
                </p>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Try Another Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && selectedOrderForCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Cancel Order #{selectedOrderForCancel.orderNumber}</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Are you sure you want to cancel this order? Please specify the reason for cancellation below.
            </p>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Placed order by mistake, change of address..."
              className="w-full p-3 border border-neutral-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
            />

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Complete Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-neutral-400 hover:text-black">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex justify-between items-center text-xs">
              <div>
                <p className="text-neutral-500 font-medium">Order Number</p>
                <p className="font-bold font-mono text-black">#{selectedOrderForPayment.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-neutral-500 font-medium">Amount Due</p>
                <p className="font-black font-mono text-lg text-black">₹{selectedOrderForPayment.total}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-black block">Select Payment Method</label>
              
              {/* UPI Option */}
              <div className={`p-3 rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'upi' ? 'border-black bg-neutral-50' : 'border-neutral-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="accent-black"
                  />
                  <span>UPI / Google Pay / PhonePe / Paytm</span>
                </label>
                {paymentMethod === 'upi' && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pl-6">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setPaymentSubMethod(sub)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          paymentSubMethod === sub ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Option */}
              <div className={`p-3 rounded-2xl border transition-all cursor-pointer ${paymentMethod === 'card' ? 'border-black bg-neutral-50' : 'border-neutral-200'}`}>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-black"
                  />
                  <span>Credit / Debit Card</span>
                </label>
                {paymentMethod === 'card' && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pl-6">
                    {['Debit Card', 'Credit Card'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setPaymentSubMethod(sub)}
                        className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          paymentSubMethod === sub ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
