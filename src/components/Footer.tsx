import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Instagram, Facebook, Twitter, ShieldCheck, Phone, Mail, MessageCircle, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { siteLogo, storeInfo } = useApp();

  const brandName = storeInfo?.storeName || 'AISHU FOODS';
  const tagline = storeInfo?.tagline || 'Pure Love & Handcrafted Foods';
  const phone = storeInfo?.supportPhone || '+91 98480 12345';
  const whatsapp = storeInfo?.supportWhatsApp || '+91 98480 12345';
  const email = storeInfo?.supportEmail || 'orders@aishufoods.com';
  const address = storeInfo?.kitchenAddress || 'Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033';

  const cleanWhatsApp = whatsapp.replace(/\D/g, '');
  const formattedWhatsApp = cleanWhatsApp.startsWith('91') ? cleanWhatsApp : `91${cleanWhatsApp}`;

  return (
    <footer className="bg-neutral-950 text-white pt-16 pb-12 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10 text-left">
        
        {/* Brand Summary Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-black flex items-center justify-center shrink-0">
              <img src={siteLogo && siteLogo !== '/aishu-logo.jpg' ? siteLogo : '/aishu-logo.png'} alt="Aishu Foods Logo" className="w-full h-full object-cover scale-105" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block leading-none text-white font-serif">{brandName.toUpperCase()}</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">{tagline}</span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
            Handcrafted homemade delicacies store offering authentic Andhra pickles, pure ghee sweets, traditional savories, powders, and festival hampers made with pure natural resources.
          </p>

          {/* Quick Contact Chips */}
          <div className="space-y-2 pt-2 text-xs text-neutral-300">
            <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{phone}</span>
            </a>
            <a href={`https://wa.me/${formattedWhatsApp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>WhatsApp: {whatsapp}</span>
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{email}</span>
            </a>
            <div className="flex items-start gap-2 text-neutral-400">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight">{address}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 pt-2">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:border-white transition-all" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:border-white transition-all" aria-label="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:border-white transition-all" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
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
            <li><button onClick={() => navigate('/categories')} className="hover:text-white transition-colors cursor-pointer font-bold text-amber-300">All Categories &rarr;</button></li>
          </ul>
        </div>

        {/* Support Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Support & Tracking</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/track-order')} className="hover:text-white transition-colors cursor-pointer font-bold text-amber-300">Track Your Order 📦</button></li>
            <li><button onClick={() => navigate('/help')} className="hover:text-white transition-colors cursor-pointer">Help Center & FAQ</button></li>
            <li><button onClick={() => navigate('/shipping-policy')} className="hover:text-white transition-colors cursor-pointer">Shipping & Delivery Policy</button></li>
            <li><button onClick={() => navigate('/refund-policy')} className="hover:text-white transition-colors cursor-pointer">Cancellation & Refunds</button></li>
            <li><button onClick={() => navigate('/our-process')} className="hover:text-white transition-colors cursor-pointer">Kitchen Process 📜</button></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Company & Policies</h4>
          <ul className="space-y-2 text-xs text-neutral-300 font-medium">
            <li><button onClick={() => navigate('/our-process')} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">About Aishu Foods</button></li>
            <li><button onClick={() => navigate('/privacy-policy')} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">Privacy Policy</button></li>
            <li><button onClick={() => navigate('/terms')} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">Terms & Conditions</button></li>
            <li><button onClick={() => navigate('/quality-promise')} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">Quality Guarantee 🛡️</button></li>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mt-12 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 font-mono gap-2">
        <p>© 2026 {brandName.toUpperCase()} Store. Handcrafted with Pure Love & Quality.</p>
        <p>Authentic Home Delicacies E-Commerce</p>
      </div>
    </footer>
  );
};
