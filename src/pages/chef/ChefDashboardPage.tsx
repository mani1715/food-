import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, DollarSign, Clock, Utensils, Star, Plus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const ChefDashboardPage: React.FC = () => {
  const { orders, dishes, chefs, updateOrderStatus, addToast } = useApp();
  const navigate = useNavigate();

  const currentChef = chefs[0]; // Chef Lakshmi Rao
  const chefOrders = orders.filter((o) => o.chefId === currentChef.id || o.chefName === currentChef.name);

  const pendingOrders = chefOrders.filter((o) => o.status === 'Order Placed' || o.status === 'Confirmed' || o.status === 'Preparing');

  const todayRevenue = chefOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Home Chef Kitchen Console</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">
            Welcome Back, {currentChef.name}
          </h1>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/chef/menu')}
            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
          <button
            onClick={() => navigate('/chef/schedule')}
            className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-2xl"
          >
            Kitchen Availability
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
        <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Today's Orders</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-black">{chefOrders.length}</p>
        </div>
        <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Today's Revenue</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-black">${todayRevenue.toFixed(2)}</p>
        </div>
        <div className="p-5 rounded-3xl border border-neutral-200 bg-black text-white shadow-modal space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Pending Prep</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white">{pendingOrders.length}</p>
        </div>
        <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Active Menu Items</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-black">{currentChef.dishesCount}</p>
        </div>
        <div className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1 col-span-2 md:col-span-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Kitchen Rating</p>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-black flex items-center gap-1">
            <span>{currentChef.rating}</span>
            <Star className="w-5 h-5 fill-black text-black" />
          </p>
        </div>
      </div>

      {/* Main Grid: Active Orders + Popular Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Live Kitchen Orders Board */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-black tracking-tight">Active Kitchen Orders</h2>
            <button onClick={() => navigate('/chef/orders')} className="text-xs font-bold text-black underline">
              View All Orders
            </button>
          </div>

          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <div className="p-8 border border-dashed border-neutral-300 rounded-3xl text-center bg-neutral-50 text-xs text-neutral-500">
                No pending kitchen orders right now. New customer orders will pop up live here!
              </div>
            ) : (
              pendingOrders.map((ord) => (
                <div key={ord.id} className="p-5 rounded-3xl border border-neutral-200 bg-white shadow-subtle space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold border-b pb-2">
                    <span className="font-mono text-black">Order #{ord.orderNumber}</span>
                    <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px]">
                      {ord.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p><strong className="text-black">Customer:</strong> {ord.customerName} ({ord.customerPhone})</p>
                    <div className="pt-1 space-y-1">
                      {ord.items.map((i, idx) => (
                        <p key={idx} className="font-mono text-neutral-700">
                          {i.quantity}x {i.dish.name} (${(i.dish.price * i.quantity).toFixed(2)})
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between gap-3">
                    <span className="text-sm font-extrabold font-mono">${ord.total.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'Preparing')}
                        className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-bold"
                      >
                        Start Prep
                      </button>
                      <button
                        onClick={() => updateOrderStatus(ord.id, 'Ready')}
                        className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold"
                      >
                        Mark Ready
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Menu Shortcuts & Recent Reviews */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Menu Management Box */}
          <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-4 shadow-subtle">
            <h3 className="text-base font-extrabold text-black">Quick Navigation</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/chef/menu')}
                className="w-full p-3 bg-white border border-neutral-200 rounded-2xl text-xs font-bold text-left hover:border-black flex items-center justify-between"
              >
                <span>Manage Menu & Availability</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/chef/earnings')}
                className="w-full p-3 bg-white border border-neutral-200 rounded-2xl text-xs font-bold text-left hover:border-black flex items-center justify-between"
              >
                <span>View Payouts & Revenue Analytics</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/chef/reviews')}
                className="w-full p-3 bg-white border border-neutral-200 rounded-2xl text-xs font-bold text-left hover:border-black flex items-center justify-between"
              >
                <span>Read Verified Customer Reviews</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
