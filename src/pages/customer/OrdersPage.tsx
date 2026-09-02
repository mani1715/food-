import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, RotateCcw, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const OrdersPage: React.FC = () => {
  const { orders, addToCart } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') return o.status !== 'Delivered' && o.status !== 'Cancelled';
    if (activeTab === 'completed') return o.status === 'Delivered';
    if (activeTab === 'cancelled') return o.status === 'Cancelled';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Preparing':
      case 'Confirmed':
      case 'Order Placed':
        return <span className="bg-black text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full animate-pulse-subtle">● {status}</span>;
      case 'Out for Delivery':
        return <span className="bg-white border border-black text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">⚡ Out for Delivery</span>;
      case 'Delivered':
        return <span className="bg-neutral-100 text-black border border-neutral-300 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">✓ Delivered</span>;
      case 'Cancelled':
      default:
        return <span className="bg-neutral-200 text-neutral-600 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">✕ Cancelled</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order History</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">My Orders</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'active' ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
          }`}
        >
          Active Orders
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'completed' ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'cancelled' ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          type="cart"
          title={`No ${activeTab} orders found`}
          description="Place an order from top neighborhood home chefs to track real-time clay pot cooking."
          onAction={() => navigate('/explore')}
          actionLabel="Order Food Now"
        />
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black transition-all space-y-4"
            >
              {/* Top Row: Chef & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3">
                  <img src={ord.chefAvatar} alt={ord.chefName} className="w-12 h-12 rounded-full object-cover border border-neutral-200" />
                  <div>
                    <h3 className="text-base font-bold text-black">{ord.chefName}</h3>
                    <p className="text-xs text-neutral-400 font-mono">Order #{ord.orderNumber} • {ord.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(ord.status)}
                  <span className="text-base font-extrabold font-mono text-black">${ord.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-black">{item.quantity}x</span>
                      <span className="font-semibold text-black">{item.dish.name}</span>
                    </div>
                    <span className="font-mono text-neutral-500">${(item.dish.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold">
                  <Clock className="w-4 h-4 text-black" />
                  <span>Est: {ord.estimatedDeliveryTime}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      ord.items.forEach((i) => addToCart(i.dish, i.quantity));
                      navigate('/cart');
                    }}
                    className="flex-1 sm:flex-none py-2.5 px-4 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder All</span>
                  </button>

                  <button
                    onClick={() => navigate(`/orders/${ord.id}`)}
                    className="flex-1 sm:flex-none py-2.5 px-5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shadow-subtle"
                  >
                    <span>View Timeline Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
