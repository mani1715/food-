import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Globe, Send, Package, Heart, Gift, PhoneCall, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const FloatingWhatsAppWidget: React.FC = () => {
  const { storeInfo, siteLogo } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Hide on checkout and admin pages to prevent collision with crucial checkout/admin actions
  if (location.pathname === '/checkout' || location.pathname.startsWith('/admin')) {
    return null;
  }

  const rawPhone = storeInfo?.supportWhatsApp || storeInfo?.supportPhone || '919848012345';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const openWhatsAppWith = (text: string) => {
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;
    openWhatsAppWith(`Hello Aishu Home Foods! 👋\n${customMsg.trim()}`);
    setCustomMsg('');
    setIsOpen(false);
  };

  const quickPrompts = [
    {
      id: 'abroad',
      icon: <Globe className="w-4 h-4 text-emerald-600" />,
      label: 'Abroad / NRI Shipping',
      desc: 'USA, UK, Dubai, Australia special packaging',
      answer: 'We provide specialized international leak-proof vacuum packaging for NRIs across USA, UK, Canada, Australia, and Middle East. Click below to chat with our international dispatch team.',
      waMsg: 'Hello Aishu Foods! I am interested in International / Abroad courier delivery (USA / UK / Dubai / Australia). Please guide me with packaging & rates.',
    },
    {
      id: 'bulk',
      icon: <Gift className="w-4 h-4 text-amber-600" />,
      label: 'Bulk & Wedding Gifts',
      desc: 'Customized gift boxes & wholesale rates',
      answer: 'We curate handcrafted sweets & pickle gift hampers for weddings, housewarmings, Diwali, and corporate gifts. Special bulk discounts apply.',
      waMsg: 'Hello Aishu Foods! I am looking for Bulk Orders / Custom Gift Hampers for an upcoming family event / wedding. Please share bulk catalog & discount tiers.',
    },
    {
      id: 'track',
      icon: <Package className="w-4 h-4 text-blue-600" />,
      label: 'Track Existing Order',
      desc: 'Check delivery status & courier partner',
      action: () => {
        setIsOpen(false);
        navigate('/track-order');
      },
    },
    {
      id: 'recommend',
      icon: <Heart className="w-4 h-4 text-rose-600" />,
      label: 'Bestseller Delicacies',
      desc: 'Grandma Avakaya, Pure Ghee Sweets',
      action: () => {
        setIsOpen(false);
        navigate('/products');
      },
    },
  ];

  return (
    <div
      style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
      className="fixed lg:bottom-8 right-3 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto"
    >
      {/* Interactive WhatsApp Chatbot Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="w-[calc(100vw-2rem)] sm:w-88 md:w-96 bg-white border border-neutral-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-left mb-2 z-50 max-h-[80vh]"
          >
            {/* WhatsApp Chatbot Header */}
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white/80">
                    <img
                      src={siteLogo && siteLogo !== '/aishu-logo.jpg' ? siteLogo : '/aishu-logo.png'}
                      alt="Aishu Foods"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-800 rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight">Aishu Foods Concierge</span>
                    <span className="text-[10px] bg-emerald-800/80 px-1.5 py-0.2 rounded font-mono">Official</span>
                  </div>
                  <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    Typically replies in minutes
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-emerald-800/50 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[48vh] bg-neutral-50/70 text-xs">
              {/* Bot Greeting Bubble */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  AF
                </div>
                <div className="bg-white border border-neutral-200 p-3 rounded-2xl rounded-tl-sm shadow-subtle space-y-1 text-neutral-800 max-w-[85%]">
                  <p className="font-bold">Namaste! Welcome to Aishu Home Foods 🙏</p>
                  <p className="text-[11px] text-neutral-600 leading-relaxed">
                    How can our kitchen concierge assist you today? Select a common topic below or type your message directly:
                  </p>
                </div>
              </div>

              {/* Active Topic Expansion */}
              {activeTopic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-950"
                >
                  <p className="text-[11px] leading-relaxed">
                    {quickPrompts.find((p) => p.id === activeTopic)?.answer}
                  </p>
                  <button
                    onClick={() => {
                      const topic = quickPrompts.find((p) => p.id === activeTopic);
                      if (topic?.waMsg) openWhatsAppWith(topic.waMsg);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Continue on WhatsApp &rarr;</span>
                  </button>
                </motion.div>
              )}

              {/* Quick Options Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
                  Quick Topics
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickPrompts.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => {
                        if (q.action) {
                          q.action();
                        } else {
                          setActiveTopic(activeTopic === q.id ? null : q.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        activeTopic === q.id
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {q.icon}
                        <div>
                          <span className="font-extrabold text-black block leading-tight">{q.label}</span>
                          <span className="text-[10px] text-neutral-500 block leading-tight">{q.desc}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Input & Direct WhatsApp Dispatch */}
            <form onSubmit={handleSendCustom} className="p-3 border-t border-neutral-200 bg-white space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type a message to WhatsApp concierge..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={!customMsg.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                  title="Send via WhatsApp"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 font-medium">
                <span>Direct WhatsApp Hotline</span>
                <a
                  href={`https://wa.me/${formattedPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline font-bold"
                >
                  +{formattedPhone}
                </a>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`w-14 h-14 rounded-full text-white shadow-modal flex items-center justify-center transition-all cursor-pointer relative group ${
          isOpen ? 'bg-neutral-900 hover:bg-black' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
        title={isOpen ? 'Close WhatsApp Concierge' : 'Chat with Aishu Home Foods on WhatsApp'}
        aria-label="WhatsApp Support"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};
