import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ChefHat, ShieldCheck } from 'lucide-react';

export const TopPortalSwitcher: React.FC = () => {
  const { portalMode, setPortalMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitch = (mode: 'customer' | 'chef' | 'admin') => {
    setPortalMode(mode);
    if (mode === 'customer') {
      if (!location.pathname.startsWith('/chef') && !location.pathname.startsWith('/admin')) return;
      navigate('/');
    } else if (mode === 'chef') {
      navigate('/chef/dashboard');
    } else if (mode === 'admin') {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="bg-black text-white text-xs py-1.5 px-4 border-b border-neutral-800 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] text-neutral-400 font-semibold uppercase tracking-wider hidden sm:inline">
            Aura Platform Environment
          </span>
        </div>

        {/* Portal Switcher Buttons */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => handleSwitch('customer')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              portalMode === 'customer'
                ? 'bg-white text-black shadow-subtle'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Customer Portal</span>
          </button>

          <button
            onClick={() => handleSwitch('chef')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              portalMode === 'chef'
                ? 'bg-white text-black shadow-subtle'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3 h-3" />
            <span>Chef Dashboard</span>
          </button>

          <button
            onClick={() => handleSwitch('admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              portalMode === 'admin'
                ? 'bg-white text-black shadow-subtle'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Admin Control</span>
          </button>
        </div>
      </div>
    </div>
  );
};
