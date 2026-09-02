import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ShoppingBag } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const { orders } = useApp();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'All' || o.status.toLowerCase() === statusFilter.toLowerCase();
    const matchQuery = !query || o.orderNumber.toLowerCase().includes(query.toLowerCase()) || o.customerName.toLowerCase().includes(query.toLowerCase()) || o.chefName.toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  });

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Platform Operations</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Platform Order Oversight</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, customer, or chef..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-neutral-50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Order Placed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-100 uppercase text-[10px] text-neutral-500 font-mono">
            <tr>
              <th className="p-3 rounded-l-xl">Order #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Chef</th>
              <th className="p-3">Items Count</th>
              <th className="p-3">Total Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-xl">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-medium">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="p-3 font-mono font-bold text-black">{o.orderNumber}</td>
                <td className="p-3 font-bold text-black">{o.customerName}</td>
                <td className="p-3 text-neutral-600">{o.chefName}</td>
                <td className="p-3 font-mono">{o.items.reduce((acc, i) => acc + i.quantity, 0)} Items</td>
                <td className="p-3 font-mono font-bold text-black">${o.total.toFixed(2)}</td>
                <td className="p-3">
                  <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold">
                    {o.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-neutral-400">{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
