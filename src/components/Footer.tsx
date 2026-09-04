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
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white bg-black flex items-center justify-center">
              <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block leading-none text-white font-serif">AISHU FOODS</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Pure Love & Handcrafted Foods</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
            Handcrafted homemade delicacies store offering authentic Andhra pickles, pure ghee sweets, traditional savories, powders, and festival hampers made with pure natural resources.
          </p>

          <div className="flex items-center gap-3 text-neutral-400 pt-2">
            <span className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer hover:border-white transition-all">
              <Instagram className="w-4 h-4" />
            </span>
            <span className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer hover:border-white transition-all">
              <Facebook className="w-4 h-4" />
            </span>
            <span className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer hover:border-white transition-all">
              <Twitter className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Categories Link Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Categories</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/products?category=Pickles')} className="hover:text-white transition-colors cursor-pointer">Traditional Pickles</button></li>
            <li><button onClick={() => navigate('/products?category=Sweets')} className="hover:text-white transition-colors cursor-pointer">Pure Ghee Sweets</button></li>
            <li><button onClick={() => navigate('/products?category=Snacks')} className="hover:text-white transition-colors cursor-pointer">Crispy Savories</button></li>
            <li><button onClick={() => navigate('/products?category=Powders')} className="hover:text-white transition-colors cursor-pointer">Authentic Podis / Powders</button></li>
            <li><button onClick={() => navigate('/categories')} className="hover:text-white transition-colors cursor-pointer">All Categories</button></li>
          </ul>
        </div>

        {/* Support Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Support</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer">Help Center</button></li>
            <li><button onClick={() => navigate('/our-process')} className="hover:text-white transition-colors cursor-pointer">How We Do 📜</button></li>
            <li><button onClick={() => navigate('/sourcing')} className="hover:text-white transition-colors cursor-pointer">Regional Sourcing 🗺️</button></li>
            <li><button onClick={() => navigate('/quality-promise')} className="hover:text-white transition-colors cursor-pointer">Quality Guarantee 🛡️</button></li>
            <li><button onClick={() => navigate('/track-order')} className="hover:text-white transition-colors cursor-pointer">Track Your Order 📦</button></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Company & Admin</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/our-process')} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">About Aishu Foods</button></li>
            <li><span className="text-neutral-500">Privacy & Terms</span></li>
            <li><span className="text-neutral-500">100% Homemade Guarantee</span></li>
            <li>
              <button
                onClick={() => navigate('/admin')}
                className="text-white hover:underline flex items-center gap-1 font-bold pt-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Portal</span>
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono">
        <p>© 2026 AISHU FOODS Store. Handcrafted with Pure Love & Quality.</p>
        <p>Authentic Home Delicacies E-Commerce</p>
      </div>
    </footer>
  );
};
