import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, Check, Trash2, Tag, Utensils, Info } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, clearNotifications } = useApp();
  const [filterType, setFilterType] = useState<'All' | 'Orders' | 'Offers' | 'Platform'>('All');

  const filteredNotifs = notifications.filter((n) => filterType === 'All' || n.type === filterType);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Activity Updates</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearNotifications} className="text-xs text-neutral-400 hover:text-black font-semibold underline">
            Clear All
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl max-w-md">
        {['All', 'Orders', 'Offers', 'Platform'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterType(tab as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              filterType === tab ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredNotifs.length === 0 ? (
        <EmptyState
          type="search"
          title="No Notifications"
          description="You are all caught up! Order alerts and promotional offer notifications will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-5 rounded-3xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                !n.read ? 'border-black bg-neutral-50 shadow-subtle' : 'border-neutral-200 bg-white opacity-70'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                  {n.type === 'Orders' && <Utensils className="w-5 h-5" />}
                  {n.type === 'Offers' && <Tag className="w-5 h-5" />}
                  {n.type === 'Platform' && <Info className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-black">{n.title}</h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-neutral-400 font-mono pt-1">{n.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
