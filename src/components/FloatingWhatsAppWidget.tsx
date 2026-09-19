import React, { useState } from 'react';
import { MessageCircle, X, Sparkles, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

export const FloatingWhatsAppWidget: React.FC = () => {
  const { storeInfo } = useApp();
  const [isPopupDismissed, setIsPopupDismissed] = useState(false);

  const rawPhone = storeInfo?.supportWhatsApp || storeInfo?.supportPhone || '919876543210';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

  const messageText = encodeURIComponent(
    'Hello Aishu Home Foods! 👋\nI am interested in placing an order for authentic handcrafted delicacies (Bulk / Abroad / Domestic).'
  );

  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${messageText}`;

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 flex flex-col items-end gap-2 pointer-events-auto">
      {/* Top Bubble Popup for Bulk & Abroad Orders */}
      <AnimatePresence>
        {!isPopupDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-white border-2 border-emerald-500 rounded-2xl p-3 shadow-modal max-w-xs text-left relative space-y-1.5"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPopupDismissed(true);
              }}
              className="absolute top-1.5 right-1.5 p-1 text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk & Abroad Orders</span>
            </div>

            <p className="text-xs text-neutral-700 font-medium leading-tight pr-4">
              Need bulk quantity or shipping <strong>Abroad (USA, UK, Dubai, Australia)</strong>?
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 hover:text-emerald-900 underline pt-0.5"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Chat directly on WhatsApp &rarr;</span>
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating WhatsApp Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-modal flex items-center justify-center hover:bg-emerald-700 transition-colors relative group"
        title="Chat with Aishu Home Foods on WhatsApp"
        aria-label="WhatsApp Support"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
        </span>
      </motion.a>
    </div>
  );
};
