import React from 'react';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenModal: (type: 'becomeChef' | 'login') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateSection, onOpenModal }) => {
  return (
    <footer className="bg-black text-white pt-16 pb-12 border-t border-neutral-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 text-left">
          
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-extrabold text-xl shadow-subtle">
                A
              </div>
              <span className="font-extrabold text-xl tracking-wider text-white">
                AURA
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              The premier mobile-first Home Food Marketplace connecting discerning food enthusiasts directly with verified neighborhood home chefs.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-mono text-neutral-400">
              <span>Hyderabad</span>
              <span>•</span>
              <span>Bengaluru</span>
              <span>•</span>
              <span>Mumbai</span>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Company</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button onClick={() => onNavigateSection('hero')} className="hover:text-white transition-colors">
                  About Aura
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('chefs')} className="hover:text-white transition-colors">
                  Our Home Chefs
                </button>
              </li>
              <li>
                <button onClick={() => onOpenModal('becomeChef')} className="hover:text-white transition-colors">
                  Become a Partner Chef
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('how-it-works')} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Food Categories</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigateSection('categories')} className="hover:text-white transition-colors">Breakfast & Idlis</button></li>
              <li><button onClick={() => onNavigateSection('categories')} className="hover:text-white transition-colors">Clay Pot Thalis</button></li>
              <li><button onClick={() => onNavigateSection('categories')} className="hover:text-white transition-colors">Awadhi Dum Biryani</button></li>
              <li><button onClick={() => onNavigateSection('categories')} className="hover:text-white transition-colors">Artisan Sourdough</button></li>
              <li><button onClick={() => onNavigateSection('categories')} className="hover:text-white transition-colors">Grandma Pickles</button></li>
            </ul>
          </div>

          {/* Column 4: Customer Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">Support & Legal</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><button onClick={() => onNavigateSection('faq')} className="hover:text-white transition-colors">Help Center & FAQ</button></li>
              <li><a href="#legal" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#hygiene" className="hover:text-white transition-colors">Hygiene Standards</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-mono">
          <p>© 2026 AURA Home Food Marketplace Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-neutral-400">
            <a href="#instagram" className="hover:text-white transition-colors">Instagram</a>
            <a href="#twitter" className="hover:text-white transition-colors">Twitter / X</a>
            <a href="#linkedin" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
