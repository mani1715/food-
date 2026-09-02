import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const { addToast } = useApp();
  const [dateRange, setDateRange] = useState('30days');

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Business Intelligence</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Platform Reports & Analytics</h1>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-2.5 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="3months">Last 3 Months</option>
          </select>
          <button
            onClick={() => addToast('Downloading Report', 'Platform analytics PDF exported.')}
            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Gross Platform GMV</p>
          <p className="text-2xl font-extrabold font-mono text-black">$68,410.00</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Net Platform Commission</p>
          <p className="text-2xl font-extrabold font-mono text-black">$10,261.50</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Completed Orders</p>
          <p className="text-2xl font-extrabold font-mono text-black">1,842</p>
        </div>
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-1">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">New Customer Registrations</p>
          <p className="text-2xl font-extrabold font-mono text-black">+420</p>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
        <h3 className="text-base font-extrabold text-black">Monthly Order Volume & Growth</h3>
        <div className="h-48 flex items-end gap-4 pt-6 px-4 border-b border-neutral-200">
          {[35, 50, 45, 60, 75, 85, 95, 110, 100, 120, 130, 145].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-black rounded-t-xl hover:bg-neutral-700 transition-colors" style={{ height: `${(h / 145) * 100}%` }} />
              <span className="text-[10px] font-mono text-neutral-400">M{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
