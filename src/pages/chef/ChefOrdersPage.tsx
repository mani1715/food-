import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const ChefOrdersPage: React.FC = () => {
  const { orders, chefs, updateOrderStatus } = useApp();
  const currentChef = chefs[0];

  const chefOrders = orders.filter((o) => o.chefId === currentChef.id || o.chefName === currentChef.name);

  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'preparing' | 'ready' | 'completed'>('all');

  const filtered = chefOrders.filter((o) => {
    if (activeTab === 'new') return o.status === 'Order Placed';
    if (activeTab === 'preparing') return o.status === 'Confirmed' || o.status === 'Preparing';
    if (activeTab === 'ready') return o.status === 'Ready' || o.status === 'Out for Delivery';
    if (activeTab === 'completed') return o.status === 'Delivered';
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Kitchen Operations</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Kitchen Order Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl max-w-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Orders' },
          { id: 'new', label: 'New Orders' },
          { id: 'preparing', label: 'In Prep' },
          { id: 'ready', label: 'Ready' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          type="cart"
          title="No Orders Found"
          description="Orders assigned to your home kitchen will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((ord) => (
            <div key={ord.id} className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 text-xs">
                <div>
                  <span className="font-extrabold text-black font-mono">Order #{ord.orderNumber}</span>
                  <span className="text-neutral-400 font-mono ml-3">{ord.date}</span>
                </div>
                <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold self-start sm:self-auto">
                  {ord.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-bold text-black uppercase text-[10px] text-neutral-400">Customer Details</p>
                  <p className="font-bold text-black mt-0.5">{ord.customerName}</p>
                  <p className="text-neutral-500">{ord.customerPhone}</p>
                  <p className="text-neutral-500 line-clamp-1">{ord.deliveryAddress.address}</p>
                </div>

                <div>
                  <p className="font-bold text-black uppercase text-[10px] text-neutral-400">Dishes To Prepare</p>
                  <div className="space-y-1 mt-0.5 font-mono">
                    {ord.items.map((i, idx) => (
                      <p key={idx} className="text-black font-bold">
                        {i.quantity}x {i.dish.name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-base font-extrabold font-mono text-black">${ord.total.toFixed(2)}</span>
                
                <div className="flex flex-wrap items-center gap-2">
                  {ord.status === 'Order Placed' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'Confirmed')}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'Cancelled')}
                        className="px-4 py-2 border border-neutral-300 text-rose-600 text-xs font-bold rounded-xl"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {(ord.status === 'Confirmed' || ord.status === 'Preparing') && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'Ready')}
                      className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl"
                    >
                      Mark Ready For Pickup
                    </button>
                  )}

                  {ord.status === 'Ready' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'Out for Delivery')}
                      className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl"
                    >
                      Handover To Courier
                    </button>
                  )}

                  {ord.status === 'Out for Delivery' && (
                    <button
                      onClick={() => updateOrderStatus(ord.id, 'Delivered')}
                      className="px-4 py-2 bg-emerald-900 text-white text-xs font-bold rounded-xl"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
