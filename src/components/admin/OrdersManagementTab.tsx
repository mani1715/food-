import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { Search, Filter, Clock, CheckCircle, XCircle, TrendingUp, Package, MapPin, Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const OrdersManagementTab: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, cancelOrder } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Order['orderStatus']>('pending');
  const [editPaymentStatus, setEditPaymentStatus] = useState<Order['paymentStatus']>('completed');
  const [editNotes, setEditNotes] = useState('');
  const [editDeliveryDays, setEditDeliveryDays] = useState(3);

  // Cancellation Modal State
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !searchTerm.trim() ||
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.deliveryAddress.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && o.status === 'Active') ||
        (statusFilter === 'delivered' && o.status === 'Delivered') ||
        (statusFilter === 'cancelled' && o.status === 'Cancelled');

      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalRevenue = useMemo(() => {
    return filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((acc, o) => acc + o.total, 0);
  }, [filteredOrders]);

  const handleStartEdit = (order: Order) => {
    setEditingOrderId(order.id);
    setEditStatus(order.orderStatus || 'pending');
    setEditPaymentStatus(order.paymentStatus || 'completed');
    setEditNotes(order.adminNotes || '');
    setEditDeliveryDays(order.deliveryDays || 3);
  };

  const handleSaveEdit = (orderId: string) => {
    updateOrderStatus(orderId, editStatus, editNotes, editDeliveryDays);
    updatePaymentStatus(orderId, editPaymentStatus);
    setEditingOrderId(null);
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrderId && cancelReason.trim()) {
      cancelOrder(cancelModalOrderId, cancelReason);
      setCancelModalOrderId(null);
      setCancelReason('');
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Store Orders & Fulfillment</h2>
        <p className="text-xs text-neutral-500">Track, update delivery status, update payments & process cancellations.</p>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Total Orders</span>
          <p className="text-2xl font-extrabold text-black">{filteredOrders.length} Orders</p>
          <p className="text-xs text-neutral-500 font-mono">Filtered from {orders.length} total</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Filtered Sales Revenue</span>
          <p className="text-2xl font-extrabold text-black font-mono">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-neutral-500">Excludes cancelled orders</p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Status Breakdown</span>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-black">● {orders.filter((o) => o.status === 'Active').length} Active</span>
            <span className="text-neutral-500">● {orders.filter((o) => o.status === 'Delivered').length} Delivered</span>
            <span className="text-neutral-400">● {orders.filter((o) => o.status === 'Cancelled').length} Cancelled</span>
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
            placeholder="Search by order #, address, city..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'active', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                statusFilter === tab ? 'bg-black text-white' : 'bg-white text-neutral-600 border border-neutral-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => (
          <div key={ord.id} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <span className="text-sm font-extrabold text-black font-mono">#{ord.orderNumber}</span>
                <span className="text-xs text-neutral-400 ml-2 font-mono">Placed: {ord.date}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-black text-white">
                  ● {ord.orderStatus || ord.status}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-neutral-300 text-black">
                  Payment: {ord.paymentStatus || 'completed'}
                </span>
                <span className="text-base font-extrabold font-mono text-black">${ord.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Address & Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-neutral-400">Delivery Address</p>
                <p className="font-bold text-black">{ord.deliveryAddress.label}: {ord.deliveryAddress.address}, {ord.deliveryAddress.city}</p>
                <p className="text-neutral-500 mt-1">Payment Method: {ord.paymentMethod}</p>
              </div>

              <div>
                <p className="text-[10px] font-extrabold uppercase text-neutral-400">Items Ordered</p>
                {ord.items.map((i, idx) => (
                  <p key={idx} className="text-neutral-700 font-medium">
                    {i.quantity}x {i.product.name} ({i.selectedWeight}) — ${(i.unitPrice * i.quantity).toFixed(2)}
                  </p>
                ))}
              </div>
            </div>

            {/* Admin Controls */}
            {editingOrderId === ord.id ? (
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">Fulfillment Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-neutral-300 rounded-xl"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="out for delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
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
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Order Changes</span>
                  </button>
                  <button
                    onClick={() => setEditingOrderId(null)}
                    className="px-4 py-2 bg-neutral-200 text-black text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <div className="text-neutral-500">
                  {ord.adminNotes && <span>Notes: {ord.adminNotes}</span>}
                  {ord.cancelReason && <span className="text-rose-600 font-bold">Cancellation Reason: {ord.cancelReason}</span>}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(ord)}
                    className="px-3 py-1.5 border border-neutral-200 hover:border-black text-black font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Status</span>
                  </button>

                  {ord.status !== 'Cancelled' && (
                    <button
                      onClick={() => setCancelModalOrderId(ord.id)}
                      className="px-3 py-1.5 border border-neutral-200 hover:border-rose-600 text-rose-600 font-bold rounded-xl flex items-center gap-1.5"
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

      {/* Cancel Order Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <h3 className="text-base font-extrabold text-black">Cancel Order #{cancelModalOrderId}</h3>
            <p className="text-xs text-neutral-500">Please provide a reason for cancelling this order:</p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Item out of stock or customer requested cancellation..."
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
            />
            <div className="flex gap-2">
              <button onClick={() => setCancelModalOrderId(null)} className="flex-1 py-3 bg-neutral-100 text-black text-xs font-bold rounded-2xl">
                Close
              </button>
              <button onClick={handleConfirmCancel} className="flex-1 py-3 bg-black text-white text-xs font-bold rounded-2xl">
                Confirm Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
