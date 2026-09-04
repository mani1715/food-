import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, Facebook, Twitter, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-neutral-950 text-white pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 text-left">
        
        {/* Brand Summary Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black text-lg tracking-tighter">
              A
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block leading-none text-white">AURA</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Homemade Foods</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
            Premium homemade food shopping store offering authentic pickles, pure ghee sweets, traditional savories, powders, and handcrafted festival gift hampers.
          </p>

          <div className="flex items-center gap-3 text-neutral-400 pt-2">
            <a href="#" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:text-white hover:border-white transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:text-white hover:border-white transition-all">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:text-white hover:border-white transition-all">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Categories Link Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Categories</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/products?category=Pickles')} className="hover:text-white transition-colors">Traditional Pickles</button></li>
            <li><button onClick={() => navigate('/products?category=Sweets')} className="hover:text-white transition-colors">Pure Ghee Sweets</button></li>
            <li><button onClick={() => navigate('/products?category=Snacks')} className="hover:text-white transition-colors">Crispy Snacks</button></li>
            <li><button onClick={() => navigate('/products?category=Bakery')} className="hover:text-white transition-colors">Artisanal Bakery</button></li>
            <li><button onClick={() => navigate('/products?category=Gift%20Boxes')} className="hover:text-white transition-colors">Festival Gift Boxes</button></li>
          </ul>
        </div>

        {/* Support Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Support</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Help Center</button></li>
            <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Shipping & Delivery</button></li>
            <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors">Freshness Guarantee</button></li>
            <li><button onClick={() => navigate('/track-order')} className="hover:text-white transition-colors">Track Your Order</button></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Company & Admin</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><span className="text-neutral-500">About Aura Foods</span></li>
            <li><span className="text-neutral-500">Privacy Policy</span></li>
            <li><span className="text-neutral-500">Terms & Conditions</span></li>
            <li>
              <button
                onClick={() => navigate('/admin')}
                className="text-white hover:underline flex items-center gap-1 font-bold pt-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono">
        <p>© 2026 Aura Homemade Foods Store. All Rights Reserved.</p>
        <p>Premium Minimal Luxury E-Commerce UI/UX</p>
      </div>
    </footer>
  );
};
