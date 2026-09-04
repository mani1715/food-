import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const OrdersPage: React.FC = () => {
  const { orders, addToCart } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'Active' | 'Delivered' | 'Cancelled'>('Active');

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'Active') return o.status === 'Active';
    if (activeTab === 'Delivered') return o.status === 'Delivered';
    if (activeTab === 'Cancelled') return o.status === 'Cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Purchase History</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">My Orders</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl max-w-md">
        {['Active', 'Delivered', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === tab ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
            }`}
          >
            {tab} Orders
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <EmptyState
          type="cart"
          title={`No ${activeTab} Orders`}
          description="Order authentic homemade pickles, sweets, and snacks to view order details here."
          onAction={() => navigate('/products')}
          actionLabel="Shop Products"
        />
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((ord) => (
            <div key={ord.id} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black transition-all space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-black font-mono">Order #{ord.orderNumber}</h3>
                  <p className="text-xs text-neutral-400 font-mono">Placed on {ord.date}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${
                    ord.status === 'Active' ? 'bg-black text-white' : ord.status === 'Delivered' ? 'bg-neutral-100 text-black border border-neutral-300' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    ● {ord.status}
                  </span>
                  <span className="text-base font-extrabold font-mono text-black">₹{ord.total}</span>
                </div>
              </div>

              <div className="space-y-2">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-neutral-700">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-black">{item.quantity}x</span>
                      <span className="font-semibold text-black">{item.product.name} ({item.selectedWeight})</span>
                    </div>
                    <span className="font-mono text-neutral-500">₹{item.unitPrice * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500 font-medium">Payment: {ord.paymentMethod}</span>
                <button
                  onClick={() => {
                    ord.items.forEach((i) => addToCart(i.product, i.selectedWeight, i.quantity));
                    navigate('/cart');
                  }}
                  className="py-2.5 px-4 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reorder All</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
