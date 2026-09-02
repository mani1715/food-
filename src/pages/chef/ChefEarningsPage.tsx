import React from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, TrendingUp, Calendar, CreditCard, ArrowUpRight } from 'lucide-react';

export const ChefEarningsPage: React.FC = () => {
  const { chefs, orders } = useApp();
  const currentChef = chefs[0];

  const totalEarnings = currentChef.totalEarnings || 14250.00;
  const weeklyEarnings = 1840.50;
  const monthlyEarnings = 6200.00;
  const pendingPayout = 450.00;

  const mockPayouts = [
    { id: 'pay-1', date: '2026-08-28', amount: 1420.00, status: 'Transferred', method: 'Direct Bank Deposit' },
    { id: 'pay-2', date: '2026-08-21', amount: 1280.50, status: 'Transferred', method: 'Direct Bank Deposit' },
    { id: 'pay-3', date: '2026-08-14', amount: 1150.00, status: 'Transferred', method: 'Direct Bank Deposit' },
  ];

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Financial Insights</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Earnings & Payouts</h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl border border-neutral-200 bg-black text-white shadow-modal space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Lifetime Revenue</p>
          <p className="text-3xl font-extrabold font-mono text-white">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">This Month</p>
          <p className="text-3xl font-extrabold font-mono text-black">${monthlyEarnings.toFixed(2)}</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">This Week</p>
          <p className="text-3xl font-extrabold font-mono text-black">${weeklyEarnings.toFixed(2)}</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 shadow-subtle space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Pending Payout</p>
          <p className="text-3xl font-extrabold font-mono text-black">${pendingPayout.toFixed(2)}</p>
        </div>
      </div>

      {/* Revenue Chart Visual Representation */}
      <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-subtle space-y-4">
        <h3 className="text-base font-extrabold text-black">Weekly Sales Growth</h3>
        <div className="h-40 flex items-end gap-3 pt-6 px-4 border-b border-neutral-200">
          {[40, 65, 55, 80, 95, 70, 90].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-black rounded-t-xl transition-all hover:bg-neutral-700" style={{ height: `${h}%` }} />
              <span className="text-[10px] font-bold font-mono text-neutral-400">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History Table */}
      <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
        <h3 className="text-base font-extrabold text-black">Recent Bank Transfers</h3>
        <div className="space-y-3">
          {mockPayouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50 text-xs font-semibold">
              <div>
                <p className="text-black font-bold font-mono">{p.date}</p>
                <p className="text-[11px] text-neutral-400">{p.method}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold font-mono text-black">${p.amount.toFixed(2)}</p>
                <span className="text-[10px] text-emerald-800 font-bold uppercase">✓ {p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
