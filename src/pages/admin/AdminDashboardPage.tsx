import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, ChefHat, ShoppingBag, DollarSign, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { orders, chefs, addToast } = useApp();
  const navigate = useNavigate();

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0) + 42800.00;
  const pendingChefs = chefs.filter((c) => c.status === 'Pending');
  const activeChefs = chefs.filter((c) => c.status === 'Verified' || c.status === 'Active');

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Executive Control Panel</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Platform Admin Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/verification')}
            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-subtle"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit Pending Chefs ({pendingChefs.length})</span>
          </button>
        </div>
      </div>

      {/* Top 6 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Revenue</p>
          <p className="text-xl font-extrabold font-mono text-black">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Orders</p>
          <p className="text-xl font-extrabold font-mono text-black">20,412</p>
        </div>
        <div className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Verified Chefs</p>
          <p className="text-xl font-extrabold font-mono text-black">{activeChefs.length}</p>
        </div>
        <div className="p-4 rounded-3xl border border-neutral-200 bg-black text-white shadow-modal space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Pending Audit</p>
          <p className="text-xl font-extrabold font-mono text-white">{pendingChefs.length}</p>
        </div>
        <div className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Customers</p>
          <p className="text-xl font-extrabold font-mono text-black">15,890</p>
        </div>
        <div className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Avg Order Value</p>
          <p className="text-xl font-extrabold font-mono text-black">$38.50</p>
        </div>
      </div>

      {/* Main Table: Recent Platform Activity */}
      <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-black">Recent Orders Across Platform</h2>
          <button onClick={() => navigate('/admin/orders')} className="text-xs font-bold text-black underline">
            View All Platform Orders
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-100 uppercase text-[10px] text-neutral-500 font-mono">
              <tr>
                <th className="p-3 rounded-l-xl">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Chef</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-mono font-bold text-black">{o.orderNumber}</td>
                  <td className="p-3 font-bold text-black">{o.customerName}</td>
                  <td className="p-3 text-neutral-600">{o.chefName}</td>
                  <td className="p-3 font-mono font-bold text-black">${o.total.toFixed(2)}</td>
                  <td className="p-3">
                    <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400 font-mono">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Quick Management Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div onClick={() => navigate('/admin/chefs')} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-black hover:text-white cursor-pointer transition-all space-y-2 group shadow-subtle">
          <ChefHat className="w-6 h-6 text-black group-hover:text-white" />
          <h3 className="text-base font-extrabold">Chef Directory</h3>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-300">Audit, approve, or suspend home chef accounts.</p>
        </div>

        <div onClick={() => navigate('/admin/promotions')} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-black hover:text-white cursor-pointer transition-all space-y-2 group shadow-subtle">
          <DollarSign className="w-6 h-6 text-black group-hover:text-white" />
          <h3 className="text-base font-extrabold">Promotions & Coupons</h3>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-300">Create & manage discount codes for marketing campaigns.</p>
        </div>

        <div onClick={() => navigate('/admin/analytics')} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-black hover:text-white cursor-pointer transition-all space-y-2 group shadow-subtle">
          <ShieldCheck className="w-6 h-6 text-black group-hover:text-white" />
          <h3 className="text-base font-extrabold">Reports & Analytics</h3>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-300">Download revenue growth & order volume reports.</p>
        </div>
      </div>

    </div>
  );
};
