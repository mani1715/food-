import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, User, ShoppingBag } from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const { userProfile, orders } = useApp();
  const [query, setQuery] = useState('');

  const mockCustomers = [
    { id: 'cust-1', name: userProfile.name, email: userProfile.email, phone: userProfile.phone, ordersCount: 14, totalSpent: 480.50, status: 'Active', joinedDate: 'Jan 2025' },
    { id: 'cust-2', name: 'Dr. Priya Nambiar', email: 'priya.nambiar@example.com', phone: '+91 98111 22334', ordersCount: 22, totalSpent: 840.00, status: 'Active', joinedDate: 'Nov 2024' },
    { id: 'cust-3', name: 'Siddharth Varma', email: 'sid.varma@example.com', phone: '+91 98222 33445', ordersCount: 8, totalSpent: 290.00, status: 'Active', joinedDate: 'Mar 2025' },
  ];

  const filtered = mockCustomers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">User Governance</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Customer Management Directory</h1>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer by name or email..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-neutral-50"
        />
      </div>

      <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-subtle overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-100 uppercase text-[10px] text-neutral-500 font-mono">
            <tr>
              <th className="p-3 rounded-l-xl">Customer Name</th>
              <th className="p-3">Email & Phone</th>
              <th className="p-3">Total Orders</th>
              <th className="p-3">Total Spent</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-xl">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-medium">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td className="p-3 font-bold text-black">{c.name}</td>
                <td className="p-3 text-neutral-600">{c.email} • {c.phone}</td>
                <td className="p-3 font-mono font-bold text-black">{c.ordersCount} Orders</td>
                <td className="p-3 font-mono font-bold text-black">${c.totalSpent.toFixed(2)}</td>
                <td className="p-3">
                  <span className="bg-emerald-900 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                    ✓ {c.status}
                  </span>
                </td>
                <td className="p-3 font-mono text-neutral-400">{c.joinedDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
