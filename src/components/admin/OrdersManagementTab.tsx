import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, CartItem } from '../../types';
import {
  Search,
  Edit2,
  Save,
  XCircle,
  Printer,
  Download,
  Calendar as CalendarIcon,
  Copy,
  Check,
  Filter,
  X,
  ChevronDown,
  Eye,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  Ban,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderPrintInvoiceModal } from './OrderPrintInvoiceModal';
import {
  AdminTimeframe,
  getTodayDateStr,
  getYesterdayDateStr,
  formatDisplayDate,
  isDateMatch,
} from '../../utils/dateFilters';

const DEFAULT_CANCEL_REASONS = [
  {
    title: '🚨 Out of Stock / Ingredient Unavailable',
    description: 'Fresh batch ingredients (raw mangoes, Gongura, spices) exhausted in kitchen.',
  },
  {
    title: '📍 Delivery Address Unserviceable',
    description: 'Customer location is outside our refrigerated courier delivery coverage zone.',
  },
  {
    title: '👤 Customer Requested Cancellation',
    description: 'Customer contacted support asking to cancel order / placed by mistake.',
  },
  {
    title: '💳 Payment Verification Failed',
    description: 'UPI / NetBanking transaction was not credited or failed fraud verification check.',
  },
  {
    title: '⏳ Kitchen Batch Preparation Delay',
    description: 'Unable to prepare handcrafted batch in time for requested delivery date.',
  },
  {
    title: '⚠️ Duplicate Order Detected',
    description: 'Customer accidentally submitted identical order twice.',
  },
  {
    title: '📦 Quality Assurance Rejection',
    description: 'Batch failed traditional cleanliness / taste testing during final packaging.',
  },
  {
    title: '📝 Administrative Cancellation',
    description: 'Cancelled per store operations review.',
  },
];

const COURIER_PARTNERS = [
  'Delhivery Logistics',
  'DTDC Express',
  'BlueDart Couriers',
  'India Post (Speed Post)',
  'Porter / Dunzo Express',
  'Aishu Foods Local Delivery',
];

export const OrdersManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, cancelOrder, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'placed' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<AdminTimeframe>('all');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Quick Edit Inline State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Order['orderStatus']>('placed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('completed');
  const [editNotes, setEditNotes] = useState('');
  const [editDeliveryDays, setEditDeliveryDays] = useState(3);

  // Print Invoice Modal State
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<Order | null>(null);

  // Full Order Details & Inspection Modal State
  const [selectedInspectOrder, setSelectedInspectOrder] = useState<Order | null>(null);

  // Dispatch / Shipping Prompt Modal State
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(null);
  const [selectedCourier, setSelectedCourier] = useState('Delhivery Logistics');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelPresetIndex, setCancelPresetIndex] = useState<number>(0);
  const [cancelCustomNotes, setCancelCustomNotes] = useState<string>('');
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Timeframe calculation using unified isDateMatch
  const timeframeOrders = useMemo(() => {
    return orders.filter((o) => isDateMatch(o.date, timeframeFilter, selectedCalendarDate));
  }, [orders, timeframeFilter, selectedCalendarDate]);

  const filteredOrders = useMemo(() => {
    return timeframeOrders.filter((o) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        (o.trackingCode && o.trackingCode.toLowerCase().includes(q)) ||
        o.deliveryAddress.address.toLowerCase().includes(q) ||
        (o.deliveryAddress.city && o.deliveryAddress.city.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.cancelReason && o.cancelReason.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === 'all' ||
        o.orderStatus === statusFilter ||
        (statusFilter === 'placed' && (o.orderStatus === 'placed' || o.orderStatus === 'pending')) ||
        (statusFilter === 'ready_to_ship' && o.orderStatus === 'ready_to_ship') ||
        (statusFilter === 'cancelled' && (o.orderStatus === 'cancelled' || o.status === 'Cancelled'));

      return matchSearch && matchStatus;
    });
  }, [timeframeOrders, searchTerm, statusFilter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.orderStatus !== 'cancelled' && o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [filteredOrders]);

  // Breakdown Counts for Badges & KPI Tabs
  const counts = useMemo(() => {
    return {
      all: timeframeOrders.length,
      placed: timeframeOrders.filter((o) => o.orderStatus === 'placed' || o.orderStatus === 'pending').length,
      processing: timeframeOrders.filter((o) => o.orderStatus === 'processing').length,
      ready_to_ship: timeframeOrders.filter((o) => o.orderStatus === 'ready_to_ship').length,
      shipped: timeframeOrders.filter((o) => o.orderStatus === 'shipped').length,
      delivered: timeframeOrders.filter((o) => o.orderStatus === 'delivered').length,
      cancelled: timeframeOrders.filter((o) => o.orderStatus === 'cancelled' || o.status === 'Cancelled').length,
    };
  }, [timeframeOrders]);

  const handleStartEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setEditStatus(order.orderStatus || 'placed');
    setEditPaymentStatus(order.paymentStatus || 'completed');
    setEditNotes(order.adminNotes || '');
    setEditDeliveryDays(order.deliveryDays || 3);
  };

  const handleSaveEdit = (orderId: string) => {
    updateOrderStatus(orderId, editStatus, editNotes, editDeliveryDays);
    updatePaymentStatus(orderId, editPaymentStatus);
    setEditingOrderId(null);
    if (selectedInspectOrder && selectedInspectOrder.id === orderId) {
      setSelectedInspectOrder({
        ...selectedInspectOrder,
        orderStatus: editStatus,
        paymentStatus: editPaymentStatus,
        adminNotes: editNotes,
        deliveryDays: editDeliveryDays,
      });
    }
  };

  // 1-Click Fast Stepper Status Handlers
  const handleAdvanceStatus = (order: Order, nextStatus: Order['orderStatus']) => {
    if (nextStatus === 'shipped') {
      setShippingModalOrder(order);
      setSelectedCourier(order.courierPartner || 'Delhivery Logistics');
      setTrackingNumberInput(order.trackingCode || `TRK-${Math.floor(100000 + Math.random() * 900000)}`);
      return;
    }
    updateOrderStatus(order.id, nextStatus);
    if (selectedInspectOrder && selectedInspectOrder.id === order.id) {
      setSelectedInspectOrder({ ...selectedInspectOrder, orderStatus: nextStatus });
    }
  };

  const handleConfirmShipping = () => {
    if (!shippingModalOrder) return;
    updateOrderStatus(
      shippingModalOrder.id,
      'shipped',
      `Dispatched via ${selectedCourier}. Tracking: ${trackingNumberInput}`
    );
    setShippingModalOrder(null);
  };

  // Open Cancel Modal with presets
  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelPresetIndex(0);
    setCancelCustomNotes(DEFAULT_CANCEL_REASONS[0].description);
  };

  const handleSelectCancelPreset = (index: number) => {
    setCancelPresetIndex(index);
    setCancelCustomNotes(DEFAULT_CANCEL_REASONS[index].description);
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrder) {
      const selectedPreset = DEFAULT_CANCEL_REASONS[cancelPresetIndex];
      const finalReason = `${selectedPreset.title}: ${cancelCustomNotes.trim()}`;
      cancelOrder(cancelModalOrder.id, finalReason, 'Store Admin');
      if (selectedInspectOrder && selectedInspectOrder.id === cancelModalOrder.id) {
        setSelectedInspectOrder({
          ...selectedInspectOrder,
          orderStatus: 'cancelled',
          status: 'Cancelled',
          cancelReason: finalReason,
          cancelledAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
          cancelledBy: 'Store Admin',
        });
      }
      setCancelModalOrder(null);
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTrackingId(code);
    addToast('Copied to Clipboard 📋', `Tracking code ${code} copied.`, 'info');
    setTimeout(() => setCopiedTrackingId(null), 2500);
  };

  const handleSelectTimeframe = (tf: AdminTimeframe) => {
    setTimeframeFilter(tf);
    if (tf === 'today') {
      setSelectedCalendarDate(getTodayDateStr());
    } else if (tf === 'yesterday') {
      setSelectedCalendarDate(getYesterdayDateStr());
    } else if (tf !== 'custom') {
      setSelectedCalendarDate('');
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedCalendarDate(val);
      setTimeframeFilter('custom');
    }
  };

  const handleClearCalendarDate = () => {
    setSelectedCalendarDate('');
    setTimeframeFilter('all');
  };

  const getTimeframeLabel = () => {
    if (timeframeFilter === 'today') return `Today (${formatDisplayDate(getTodayDateStr())})`;
    if (timeframeFilter === 'yesterday') return `Yesterday (${formatDisplayDate(getYesterdayDateStr())})`;
    if (timeframeFilter === 'weekly' || timeframeFilter === '7d') return 'This Week (7 Days)';
    if (timeframeFilter === 'monthly' || timeframeFilter === '30d') return 'This Month';
    if (timeframeFilter === 'custom' && selectedCalendarDate) return `Calendar Date: ${formatDisplayDate(selectedCalendarDate)}`;
    return 'All Time';
  };

  // CSV Report Generator Download
  const handleDownloadCSVReport = () => {
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Phone',
      'City',
      'Delivery Address',
      'Subtotal',
      'Delivery Fee',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Items Purchased',
      'Cancellation Reason',
      'Cancelled At',
      'Cancelled By',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.date,
      `"${o.customerName || 'Customer'}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.deliveryAddress?.city || ''}"`,
      `"${o.deliveryAddress?.address || ''}"`,
      o.subtotal,
      o.deliveryFee,
      o.total,
      `"${o.paymentMethod || 'UPI'}"`,
      o.paymentStatus,
      o.orderStatus || o.status,
      `"${o.items.map((i) => `${i.quantity}x ${i.product.name} (${i.selectedWeight})`).join('; ')}"`,
      `"${o.cancelReason || ''}"`,
      `"${o.cancelledAt || ''}"`,
      `"${o.cancelledBy || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileTag = selectedCalendarDate || timeframeFilter;
    link.setAttribute('download', `Aishu_Foods_Orders_Report_${fileTag}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report Downloaded 📥', `Orders CSV report for ${getTimeframeLabel()} generated successfully.`, 'success');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Header & Download Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Store Orders & Fulfillment Center</h2>
          <p className="text-xs text-neutral-500">
            Manage order statuses (Placed &rarr; Processing &rarr; Ready to Ship &rarr; Shipped &rarr; Delivered &rarr; Cancelled) & cancellation reasons.
          </p>
        </div>

        <button
          onClick={handleDownloadCSVReport}
          className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download {selectedCalendarDate ? formatDisplayDate(selectedCalendarDate) : timeframeFilter.toUpperCase()} Report (CSV)</span>
        </button>
      </div>

      {/* Timeframe Period Filter Bar: Today, Yesterday, This Week, This Month, All Time + Calendar Date Picker */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-100 p-3 rounded-2xl">
        
        {/* Quick Timeframe Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-wrap">
          <span className="text-xs font-extrabold text-neutral-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Timeframe:</span>
          </span>

          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'weekly', label: 'This Week' },
            { id: 'monthly', label: 'This Month' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => handleSelectTimeframe(tf.id as AdminTimeframe)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                timeframeFilter === tf.id && !selectedCalendarDate
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Interactive Calendar Date Picker Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border flex items-center gap-2 cursor-pointer transition-all ${
                timeframeFilter === 'custom' || selectedCalendarDate
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-white text-neutral-800 border-neutral-300 hover:border-black'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-amber-500" />
              <span>
                {selectedCalendarDate ? formatDisplayDate(selectedCalendarDate) : 'Calendar Date Picker'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            <input
              ref={dateInputRef}
              type="date"
              value={selectedCalendarDate}
              onChange={handleDateInputChange}
              className="sr-only"
            />
          </div>

          {selectedCalendarDate && (
            <button
              type="button"
              onClick={handleClearCalendarDate}
              className="p-1.5 bg-neutral-200 hover:bg-neutral-300 rounded-lg text-neutral-700 text-xs font-bold transition-all cursor-pointer"
              title="Clear Date Filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Analytics & Status Breakdown KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            Total Orders ({getTimeframeLabel()})
          </span>
          <p className="text-2xl font-extrabold text-black font-mono">{timeframeOrders.length} Orders</p>
          <p className="text-xs text-neutral-500 font-mono">From {orders.length} all-time store orders</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Filtered Sales Revenue</span>
          <p className="text-2xl font-extrabold text-black font-mono">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-neutral-500">Excludes cancelled orders</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Fulfillment Status Breakdown</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-bold">
            <span onClick={() => setStatusFilter('placed')} className="text-amber-700 cursor-pointer hover:underline">● {counts.placed} Placed</span>
            <span onClick={() => setStatusFilter('processing')} className="text-blue-700 cursor-pointer hover:underline">● {counts.processing} Processing</span>
            <span onClick={() => setStatusFilter('ready_to_ship')} className="text-indigo-700 cursor-pointer hover:underline">● {counts.ready_to_ship} Ready to Ship</span>
            <span onClick={() => setStatusFilter('shipped')} className="text-purple-700 cursor-pointer hover:underline">● {counts.shipped} Shipped</span>
            <span onClick={() => setStatusFilter('delivered')} className="text-emerald-700 cursor-pointer hover:underline">● {counts.delivered} Delivered</span>
            <span onClick={() => setStatusFilter('cancelled')} className="text-rose-700 font-black cursor-pointer hover:underline">● {counts.cancelled} Cancelled</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs (Large Intuitive Pills) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'all', label: 'All Orders', count: counts.all, color: 'neutral' },
          { id: 'placed', label: '🍳 Placed / Pending', count: counts.placed, color: 'amber' },
          { id: 'processing', label: '👨‍🍳 Processing', count: counts.processing, color: 'blue' },
          { id: 'ready_to_ship', label: '📦 Ready to Ship', count: counts.ready_to_ship, color: 'indigo' },
          { id: 'shipped', label: '🚚 Shipped', count: counts.shipped, color: 'purple' },
          { id: 'delivered', label: '✅ Delivered', count: counts.delivered, color: 'emerald' },
          { id: 'cancelled', label: '🚨 Cancelled Orders', count: counts.cancelled, color: 'rose' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          const isCancelledTab = tab.id === 'cancelled';
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                isActive
                  ? isCancelledTab
                    ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                    : 'bg-black text-white border-black shadow-md'
                  : isCancelledTab
                  ? 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100 font-black'
                  : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-black ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isCancelledTab
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Order ID, Customer Name, Phone, Address, City, Tracking Code, or Cancellation Reason..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50 shadow-sm"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-extrabold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer & City</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Amount & Payment</th>
                <th className="py-3.5 px-4">Fulfillment Status & Stepper</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-neutral-400 space-y-2">
                    <CalendarIcon className="w-8 h-8 text-neutral-300 mx-auto" />
                    <p className="font-bold text-neutral-600 text-sm">No orders found for {getTimeframeLabel()}</p>
                    <p className="text-[11px] text-neutral-400">Try switching status filters or clearing the search box.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isEditing = editingOrderId === ord.id;
                  const isCancelled = ord.orderStatus === 'cancelled' || ord.status === 'Cancelled';
                  const isDelivered = ord.orderStatus === 'delivered';
                  const isShipped = ord.orderStatus === 'shipped';
                  const isReadyToShip = ord.orderStatus === 'ready_to_ship';
                  const isProcessing = ord.orderStatus === 'processing';
                  const isPlaced = ord.orderStatus === 'placed' || ord.orderStatus === 'pending';

                  const totalItemsCount = ord.items.reduce((sum, item) => sum + item.quantity, 0);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${isCancelled ? 'bg-rose-50/20' : ''}`}
                    >
                      {/* 1. Order ID & Date */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            onClick={() => setSelectedInspectOrder(ord)}
                            className="font-black text-black font-mono text-xs cursor-pointer hover:underline flex items-center gap-1.5"
                          >
                            <span>{ord.orderNumber}</span>
                          </span>
                          <span className="block font-mono text-[11px] text-neutral-500">
                            {formatDisplayDate(ord.date)}
                          </span>
                          {ord.trackingCode && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded border text-neutral-600">
                                {ord.trackingCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(ord.trackingCode!)}
                                className="text-neutral-400 hover:text-black cursor-pointer"
                                title="Copy tracking code"
                              >
                                {copiedTrackingId === ord.trackingCode ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Customer & City */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-black text-xs">{ord.customerName || 'Customer'}</p>
                          <p className="text-[11px] text-neutral-500 font-mono">{ord.customerPhone || 'No Phone'}</p>
                          <p className="text-[11px] text-neutral-600 font-medium line-clamp-1">
                            {ord.deliveryAddress?.city || 'India'}
                          </p>
                        </div>
                      </td>

                      {/* 3. Items Summary */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          <span className="text-[10px] font-black uppercase text-neutral-400 block">
                            {totalItemsCount} Total Items
                          </span>
                          {ord.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-[11px] text-black font-medium line-clamp-1">
                              • <strong>{item.quantity}x</strong> {item.product.name} ({item.selectedWeight})
                            </p>
                          ))}
                          {ord.items.length > 2 && (
                            <span
                              onClick={() => setSelectedInspectOrder(ord)}
                              className="text-[10px] font-bold text-neutral-500 hover:underline cursor-pointer block"
                            >
                              + {ord.items.length - 2} more items...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Amount & Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="font-extrabold font-mono text-black text-sm">
                            ₹{ord.total.toLocaleString('en-IN')}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-neutral-500">{ord.paymentMethod || 'UPI'}</span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                                ord.paymentStatus === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.paymentStatus === 'refunded'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ord.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Fulfillment Status & Stepper */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="space-y-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                            <div>
                              <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">Status</label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value as any)}
                                className="w-full p-1.5 rounded-lg border border-neutral-300 text-xs font-bold bg-white"
                              >
                                <option value="placed">Placed</option>
                                <option value="processing">Processing</option>
                                <option value="ready_to_ship">Ready to Ship</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-neutral-400 mb-0.5">Payment Status</label>
                              <select
                                value={editPaymentStatus}
                                onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                                className="w-full p-1.5 rounded-lg border border-neutral-300 text-xs font-bold bg-white"
                              >
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </div>

                            <div className="flex gap-1 pt-1">
                              <button
                                onClick={() => handleSaveEdit(ord.id)}
                                className="px-2 py-1 bg-black text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingOrderId(null)}
                                className="px-2 py-1 bg-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Live Status Badge */}
                            <div>
                              {isCancelled ? (
                                <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <Ban className="w-3 h-3" />
                                  <span>Cancelled</span>
                                </span>
                              ) : isDelivered ? (
                                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Delivered</span>
                                </span>
                              ) : isShipped ? (
                                <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <Truck className="w-3 h-3 text-purple-700" />
                                  <span>Shipped</span>
                                </span>
                              ) : isReadyToShip ? (
                                <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <Package className="w-3 h-3 text-indigo-700" />
                                  <span>Ready to Ship</span>
                                </span>
                              ) : isProcessing ? (
                                <span className="bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <ChefHat className="w-3 h-3 text-blue-700" />
                                  <span>Processing</span>
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-xl inline-flex items-center gap-1 shadow-sm">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Placed</span>
                                </span>
                              )}
                            </div>

                            {/* Lifecycle Fast Action Button Stepper */}
                            {!isCancelled && !isDelivered && (
                              <div className="flex items-center gap-1">
                                {isPlaced && (
                                  <button
                                    onClick={() => handleAdvanceStatus(ord, 'processing')}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                    title="Start Kitchen Batch Preparation"
                                  >
                                    <ChefHat className="w-3 h-3" />
                                    <span>Start Prep</span>
                                  </button>
                                )}

                                {isProcessing && (
                                  <button
                                    onClick={() => handleAdvanceStatus(ord, 'ready_to_ship')}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                    title="Mark Packaged in Jar & Ready to Ship"
                                  >
                                    <Package className="w-3 h-3" />
                                    <span>Ready to Ship</span>
                                  </button>
                                )}

                                {isReadyToShip && (
                                  <button
                                    onClick={() => handleAdvanceStatus(ord, 'shipped')}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                    title="Dispatch with Courier Tracking ID"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Dispatch</span>
                                  </button>
                                )}

                                {isShipped && (
                                  <button
                                    onClick={() => handleAdvanceStatus(ord, 'delivered')}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                                    title="Mark as Successfully Delivered to Customer"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Delivered</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Cancellation Reason Preview */}
                            {isCancelled && ord.cancelReason && (
                              <p
                                onClick={() => setSelectedInspectOrder(ord)}
                                className="text-[10px] text-rose-700 italic max-w-xs line-clamp-1 cursor-pointer hover:underline"
                                title={ord.cancelReason}
                              >
                                📝 {ord.cancelReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Order Details */}
                          <button
                            onClick={() => setSelectedInspectOrder(ord)}
                            className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border border-neutral-200"
                            title="Inspect Order Details & Timeline"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => setSelectedPrintOrder(ord)}
                            className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border border-neutral-200"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit */}
                          <button
                            onClick={() => handleStartEdit(ord)}
                            className="p-2 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer border border-neutral-200"
                            title="Edit Order Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel Order (Enabled if not already cancelled) */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancelModal(ord)}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200 hover:border-rose-400"
                              title="Cancel Order with Reason"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCELLATION MODAL WITH DEFAULT REASONS & CUSTOM NOTES */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-modal text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Cancel Store Order</h3>
                  <p className="text-[11px] text-neutral-500">Provide an audit description and reason for cancellation.</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Brief Box */}
            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-black font-mono font-black">{cancelModalOrder.orderNumber}</span>
                <span className="font-mono text-black font-black">₹{cancelModalOrder.total}</span>
              </div>
              <p className="text-neutral-600 font-medium">
                Customer: <strong>{cancelModalOrder.customerName || 'Customer'}</strong> ({cancelModalOrder.customerPhone || 'No phone'})
              </p>
              <p className="text-neutral-500 text-[11px]">
                Items: {cancelModalOrder.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
              </p>
            </div>

            {/* Preset Cancellation Reasons (Click to pick) */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-neutral-700">
                Choose Cancellation Reason Preset ({DEFAULT_CANCEL_REASONS.length} Options):
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {DEFAULT_CANCEL_REASONS.map((preset, idx) => {
                  const isSelected = cancelPresetIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCancelPreset(idx)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                          : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <span className="block text-[11px] font-extrabold">{preset.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Notes / Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-neutral-700">
                Detailed Cancellation Notes & Customer Communication:
              </label>
              <textarea
                value={cancelCustomNotes}
                onChange={(e) => setCancelCustomNotes(e.target.value)}
                rows={3}
                placeholder="Explain the specific reason (e.g. Called customer and informed about batch delay; initiated full refund via UPI)..."
                className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Never Mind (Keep Order)
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold cursor-pointer shadow-subtle"
              >
                Confirm Order Cancellation
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DISPATCH / SHIPPING MODAL */}
      {shippingModalOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-modal text-left"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Dispatch & Ship Order</h3>
                  <p className="text-[11px] text-neutral-500">Attach courier partner and consignment tracking code.</p>
                </div>
              </div>
              <button
                onClick={() => setShippingModalOrder(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
              <p className="font-extrabold text-black">{shippingModalOrder.orderNumber}</p>
              <p className="text-neutral-600 mt-0.5">
                Ship to: <strong>{shippingModalOrder.customerName}</strong> ({shippingModalOrder.deliveryAddress?.city})
              </p>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-neutral-600 mb-1">Courier & Delivery Partner</label>
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-bold"
                >
                  {COURIER_PARTNERS.map((cp) => (
                    <option key={cp} value={cp}>
                      {cp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 mb-1">Consignment Tracking Number / Docket ID</label>
                <input
                  type="text"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  placeholder="e.g. DEL-77291048"
                  className="w-full p-2.5 rounded-xl border border-neutral-300 font-mono text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShipping}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-xs font-extrabold cursor-pointer shadow-subtle"
              >
                Confirm Dispatch & Mark Shipped
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FULL ORDER INSPECTION & DETAILS MODAL */}
      {selectedInspectOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-left max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center font-mono font-bold">
                  📦
                </div>
                <div>
                  <h3 className="text-base font-black text-black">
                    Order Details: {selectedInspectOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Placed on {formatDisplayDate(selectedInspectOrder.date)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInspectOrder(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cancellation Notice Banner (If Cancelled) */}
            {(selectedInspectOrder.orderStatus === 'cancelled' || selectedInspectOrder.status === 'Cancelled') && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl space-y-1.5 text-xs text-rose-950 shadow-sm">
                <div className="flex items-center gap-2 font-black text-rose-900">
                  <Ban className="w-4 h-4 text-rose-600" />
                  <span>This order was Cancelled</span>
                </div>
                {selectedInspectOrder.cancelReason && (
                  <p className="text-rose-900 font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-rose-200">
                    <strong>Reason:</strong> {selectedInspectOrder.cancelReason}
                  </p>
                )}
                {selectedInspectOrder.cancelledAt && (
                  <p className="text-[10px] text-rose-700 font-mono">
                    Cancelled on: {selectedInspectOrder.cancelledAt} by {selectedInspectOrder.cancelledBy || 'Store Admin'}
                  </p>
                )}
              </div>
            )}

            {/* Customer & Address Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Customer Particulars</span>
                <p className="font-extrabold text-black">{selectedInspectOrder.customerName || 'Customer'}</p>
                <p className="text-neutral-600 font-mono">{selectedInspectOrder.customerPhone || 'No Phone'}</p>
                <p className="text-neutral-600">{selectedInspectOrder.customerEmail || 'No Email'}</p>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">Delivery Destination</span>
                <p className="font-bold text-black">{selectedInspectOrder.deliveryAddress?.label || 'Home'} Address</p>
                <p className="text-neutral-600 leading-relaxed">{selectedInspectOrder.deliveryAddress?.address}</p>
                <p className="text-neutral-700 font-mono font-bold">
                  {selectedInspectOrder.deliveryAddress?.city} — {selectedInspectOrder.deliveryAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Itemized Order Table */}
            <div className="space-y-2">
              <span className="text-xs font-black text-black block uppercase tracking-wider">Ordered Items</span>
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden text-xs">
                <div className="divide-y divide-neutral-200">
                  {selectedInspectOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
                        />
                        <div>
                          <p className="font-extrabold text-black">{item.product.name}</p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {item.selectedWeight} &times; ₹{item.unitPrice} each
                          </p>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-neutral-500 block text-[10px]">Qty: {item.quantity}</span>
                        <span className="font-extrabold text-black text-xs">₹{item.unitPrice * item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown Footer */}
                <div className="p-3 bg-neutral-100/80 border-t border-neutral-200 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal:</span>
                    <span>₹{selectedInspectOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery Charge:</span>
                    <span>{selectedInspectOrder.deliveryFee === 0 ? 'FREE' : `₹${selectedInspectOrder.deliveryFee}`}</span>
                  </div>
                  {selectedInspectOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon Discount:</span>
                      <span>-₹{selectedInspectOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-black font-black text-sm pt-1 border-t border-neutral-200">
                    <span>Total Amount Paid:</span>
                    <span>₹{selectedInspectOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons in Modal */}
            <div className="flex gap-2 pt-2 border-t border-neutral-200">
              <button
                onClick={() => {
                  setSelectedPrintOrder(selectedInspectOrder);
                }}
                className="flex-1 py-3 bg-neutral-100 hover:bg-neutral-200 text-black rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-neutral-300"
              >
                <Printer className="w-4 h-4" />
                <span>Print Packing Slip</span>
              </button>

              <button
                onClick={() => setSelectedInspectOrder(null)}
                className="flex-1 py-3 bg-black text-white rounded-2xl text-xs font-extrabold hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedPrintOrder && (
        <OrderPrintInvoiceModal
          order={selectedPrintOrder}
          onClose={() => setSelectedPrintOrder(null)}
        />
      )}

    </div>
  );
};
