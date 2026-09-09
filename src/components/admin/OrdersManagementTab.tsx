import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { Search, Edit2, Save, XCircle, Printer, Download, Calendar, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { OrderPrintInvoiceModal } from './OrderPrintInvoiceModal';

export const OrdersManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, cancelOrder, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'placed' | 'processing' | 'ready_to_ship' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'today' | 'weekly' | 'monthly'>('all');

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Order['orderStatus']>('placed');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('completed');
  const [editNotes, setEditNotes] = useState('');
  const [editDeliveryDays, setEditDeliveryDays] = useState(3);

  // Print Invoice State
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<Order | null>(null);

  // Cancellation Modal State
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelPreset, setCancelPreset] = useState<string>('Customer Request');
  const [cancelReason, setCancelReason] = useState('Requested by customer via hotline.');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Timeframe calculation
  const timeframeOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    return orders.filter((o) => {
      if (timeframeFilter === 'today') {
        return o.date === todayStr;
      }
      if (timeframeFilter === 'weekly') {
        const oDate = new Date(o.date);
        return oDate >= oneWeekAgo;
      }
      if (timeframeFilter === 'monthly') {
        const oDate = new Date(o.date);
        return oDate >= oneMonthAgo;
      }
      return true;
    });
  }, [orders, timeframeFilter]);

  const filteredOrders = useMemo(() => {
    return timeframeOrders.filter((o) => {
      const matchSearch =
        !searchTerm.trim() ||
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.deliveryAddress.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customerName && o.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        o.orderStatus === statusFilter ||
        (statusFilter === 'placed' && (o.orderStatus === 'placed' || o.orderStatus === 'pending')) ||
        (statusFilter === 'ready_to_ship' && o.orderStatus === 'ready_to_ship');

      return matchSearch && matchStatus;
    });
  }, [timeframeOrders, searchTerm, statusFilter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.orderStatus !== 'cancelled' && o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [filteredOrders]);

  // Breakdown Counts
  const counts = useMemo(() => {
    return {
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
  };

  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrderId(order.id);
    setCancelPreset('Customer Request');
    setCancelReason('Customer requested order cancellation.');
    setCopiedNotice(false);
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrderId) {
      const finalReason = `${cancelPreset}: ${cancelReason.trim()}`;
      cancelOrder(cancelModalOrderId, finalReason);
      setCancelModalOrderId(null);
    }
  };

  // CSV Report Generator Download
  const handleDownloadCSVReport = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'City', 'Subtotal', 'Delivery Fee', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Items Purchased', 'Cancellation Reason'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.date,
      `"${o.customerName || 'Customer'}"`,
      `"${o.customerPhone || ''}"`,
      `"${o.deliveryAddress.city || ''}"`,
      o.subtotal,
      o.deliveryFee,
      o.total,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus || o.status,
      `"${o.items.map((i) => `${i.quantity}x ${i.product.name} (${i.selectedWeight})`).join('; ')}"`,
      `"${o.cancelReason || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Aishu_Foods_Orders_Report_${timeframeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report Downloaded 📥', `${timeframeFilter.toUpperCase()} Orders CSV report generated successfully.`, 'success');
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Header & Download Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Store Orders & Fulfillment Center</h2>
          <p className="text-xs text-neutral-500">Manage order statuses (Placed, Processing, Ready to Ship, Shipped, Delivered) & export reports.</p>
        </div>

        <button
          onClick={handleDownloadCSVReport}
          className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center gap-2 hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download {timeframeFilter.toUpperCase()} Report (CSV)</span>
        </button>
      </div>

      {/* Timeframe Period Filter Tabs */}
      <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl w-fit">
        <span className="text-xs font-extrabold text-neutral-500 px-3 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeframe:</span>
        </span>
        {(['all', 'today', 'weekly', 'monthly'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimeframeFilter(period)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
              timeframeFilter === period ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            {period === 'today' ? 'Daily (Today)' : period === 'weekly' ? 'Weekly' : period === 'monthly' ? 'Monthly' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Analytics & Status Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Total Orders ({timeframeFilter.toUpperCase()})</span>
          <p className="text-2xl font-extrabold text-black">{filteredOrders.length} Orders</p>
          <p className="text-xs text-neutral-500 font-mono">Filtered from {orders.length} total store orders</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Filtered Sales Revenue</span>
          <p className="text-2xl font-extrabold text-black font-mono">₹{totalRevenue}</p>
          <p className="text-xs text-neutral-500">Excludes cancelled orders</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Fulfillment Status Breakdown</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-bold">
            <span className="text-amber-700">● {counts.placed} Placed</span>
            <span className="text-blue-700">● {counts.processing} Processing</span>
            <span className="text-indigo-700">● {counts.ready_to_ship} Ready to Ship</span>
            <span className="text-purple-700">● {counts.shipped} Shipped</span>
            <span className="text-emerald-700">● {counts.delivered} Delivered</span>
            <span className="text-rose-700">● {counts.cancelled} Cancelled</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-neutral-50 p-4 rounded-3xl border border-neutral-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order #, customer name, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'placed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                statusFilter === tab ? 'bg-black text-white' : 'bg-white text-neutral-600 border border-neutral-200'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => (
          <div key={ord.id} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black transition-all space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <span className="text-sm font-extrabold text-black font-mono">#{ord.orderNumber}</span>
                <span className="text-xs text-neutral-400 ml-2 font-mono">Placed: {ord.date}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full text-white ${
                  ord.orderStatus === 'delivered' ? 'bg-emerald-700' :
                  ord.orderStatus === 'shipped' ? 'bg-purple-700' :
                  ord.orderStatus === 'ready_to_ship' ? 'bg-indigo-700' :
                  ord.orderStatus === 'processing' ? 'bg-blue-700' :
                  ord.orderStatus === 'cancelled' || ord.status === 'Cancelled' ? 'bg-rose-700' : 'bg-black'
                }`}>
                  ● {(ord.orderStatus || ord.status).replace('_', ' ')}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-neutral-300 text-black">
                  Payment: {ord.paymentStatus || 'completed'}
                </span>
                <span className="text-base font-extrabold font-mono text-black">₹{ord.total}</span>
              </div>
            </div>

            {/* Address & Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-neutral-400">Customer & Address</p>
                <p className="font-bold text-black">{ord.customerName || 'Customer'} • {ord.customerPhone || 'N/A'}</p>
                <p className="text-neutral-600">{ord.deliveryAddress.address}, {ord.deliveryAddress.city} - {ord.deliveryAddress.pincode}</p>
                <p className="text-neutral-500 mt-1">Payment Method: {ord.paymentMethod}</p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase text-neutral-400">Items Ordered</p>
                {ord.items.map((i, idx) => (
                  <p key={idx} className="text-neutral-700 font-medium">
                    {i.quantity}x {i.product.name} ({i.selectedWeight}) — ₹{i.unitPrice * i.quantity}
                  </p>
                ))}
              </div>
            </div>

            {/* Admin Controls */}
            {editingOrderId === ord.id ? (
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">Fulfillment Status Workflow</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl"
                    >
                      <option value="placed">Order Placed 📦</option>
                      <option value="processing">Processing ⚙️</option>
                      <option value="ready_to_ship">Ready to Shipped 🏷️</option>
                      <option value="shipped">Shipped 🚚 (Updates Stock)</option>
                      <option value="delivered">Delivered ✅</option>
                      <option value="cancelled">Cancelled ❌</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl"
                    >
                      <option value="pending">Pending ⏳</option>
                      <option value="completed">Paid ✅</option>
                      <option value="failed">Failed ❌</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(ord.id)}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Order Status</span>
                  </button>
                  <button
                    onClick={() => setEditingOrderId(null)}
                    className="px-4 py-2 bg-neutral-200 text-black text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-neutral-500">
                  {ord.adminNotes && <span>Notes: {ord.adminNotes}</span>}
                  {ord.cancelReason && <p className="text-rose-600 font-bold">Cancellation Reason: {ord.cancelReason}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedPrintOrder(ord)}
                    className="px-3 py-1.5 bg-black text-white font-bold rounded-xl flex items-center gap-1.5 hover:bg-neutral-800 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill & Label</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(ord)}
                    className="px-3 py-1.5 border border-neutral-200 hover:border-black text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Update Status</span>
                  </button>

                  {ord.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleOpenCancelModal(ord)}
                      className="px-3 py-1.5 border border-neutral-200 hover:border-rose-600 text-rose-600 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Printable Invoice & Delivery Label Modal */}
      <OrderPrintInvoiceModal
        order={selectedPrintOrder}
        onClose={() => setSelectedPrintOrder(null)}
      />

      {/* Cancellation Modal with Presets & Report Text */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal text-left">
            <h3 className="text-base font-extrabold text-black">Cancel Order #{cancelModalOrderId}</h3>
            <p className="text-xs text-neutral-500">Select preset cancellation reason or type custom details:</p>

            {/* Preset Options */}
            <div className="space-y-1.5">
              {[
                'Customer Request',
                'Item Out of Stock',
                'Pincode / Address Unserviceable',
                'Payment Verification Failed',
                'Other Custom Reason',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setCancelPreset(preset);
                    if (preset === 'Customer Request') setCancelReason('Order cancelled per customer request via support.');
                    else if (preset === 'Item Out of Stock') setCancelReason('One or more items in the order are temporarily out of stock.');
                    else if (preset === 'Pincode / Address Unserviceable') setCancelReason('Delivery address pincode is outside active courier coverage.');
                    else if (preset === 'Payment Verification Failed') setCancelReason('Transaction payment verification failed or unconfirmed.');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    cancelPreset === preset ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter custom cancellation notes..."
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-neutral-50"
            />

            <div className="p-3 bg-neutral-100 rounded-2xl text-[11px] text-neutral-700 font-mono space-y-1">
              <span className="font-bold uppercase text-neutral-400 block">Cancellation Notice Text Preview</span>
              <p className="italic">"Order #{cancelModalOrderId} has been cancelled. Reason: {cancelPreset} - {cancelReason}"</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Order #${cancelModalOrderId} has been cancelled. Reason: ${cancelPreset} - ${cancelReason}`);
                  setCopiedNotice(true);
                  setTimeout(() => setCopiedNotice(false), 2000);
                }}
                className="mt-1 text-xs font-bold text-black flex items-center gap-1 underline cursor-pointer"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotice ? 'Notice Copied!' : 'Copy Notice Text to Clipboard'}</span>
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setCancelModalOrderId(null)} className="flex-1 py-3 bg-neutral-100 text-black text-xs font-bold rounded-2xl cursor-pointer">
                Close
              </button>
              <button onClick={handleConfirmCancel} className="flex-1 py-3 bg-black text-white text-xs font-bold rounded-2xl cursor-pointer shadow-subtle">
                Confirm Cancellation
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
