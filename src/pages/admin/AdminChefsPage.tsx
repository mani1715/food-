import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, ChefHat, ShieldCheck, Check, X, Eye } from 'lucide-react';

export const AdminChefsPage: React.FC = () => {
  const { chefs, updateChefStatus, addToast } = useApp();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Verified' | 'Suspended'>('All');
  const [query, setQuery] = useState('');

  const filtered = chefs.filter((c) => {
    const matchStatus = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.location.toLowerCase().includes(query.toLowerCase());
    return matchStatus && matchQuery;
  });

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Partner Governance</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Chef Management Directory</h1>
        </div>

        <button
          onClick={() => navigate('/admin/verification')}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verification Workspace</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chef name or location..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-neutral-50"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Verified', 'Pending', 'Suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
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
              <th className="p-3 rounded-l-xl">Chef</th>
              <th className="p-3">Location</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-medium">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50">
                <td className="p-3 font-bold text-black flex items-center gap-3">
                  <img src={c.avatar} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                  <span>{c.name}</span>
                </td>
                <td className="p-3 text-neutral-600">{c.location}</td>
                <td className="p-3 font-mono font-bold text-black">{c.rating} ★</td>
                <td className="p-3 font-mono text-black">{c.ordersCount || 450}</td>
                <td className="p-3">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                    c.status === 'Verified' ? 'bg-black text-white' : c.status === 'Pending' ? 'bg-neutral-200 text-black' : 'bg-rose-900 text-white'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/chef/${c.id}`)}
                      className="p-1.5 border border-neutral-300 rounded-lg hover:border-black"
                      title="Preview Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {c.status !== 'Verified' && (
                      <button
                        onClick={() => updateChefStatus(c.id, 'Verified')}
                        className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-lg"
                      >
                        Approve
                      </button>
                    )}
                    {c.status === 'Verified' && (
                      <button
                        onClick={() => updateChefStatus(c.id, 'Suspended')}
                        className="px-2.5 py-1 border border-neutral-300 text-neutral-600 text-[10px] font-bold rounded-lg"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
