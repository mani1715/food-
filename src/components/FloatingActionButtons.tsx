import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionButtonsProps {
  onShowToast: (title: string, message: string) => void;
}

export const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({ onShowToast }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsApp = () => {
    onShowToast('WhatsApp Concierge', 'Opening direct chat with Aura Customer Support...');
  };

  const handleCall = () => {
    onShowToast('Call Support', 'Dialing Aura Home Kitchen Hotline: 1800-AURA-FOOD');
  };

  return (
    <div className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 flex flex-col gap-3 items-end pointer-events-auto">
      {/* WhatsApp Action */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleWhatsApp}
        className="w-12 h-12 rounded-full bg-black text-white border border-neutral-700 shadow-modal flex items-center justify-center hover:bg-neutral-800 transition-colors group"
        title="Chat on WhatsApp"
        aria-label="WhatsApp Support"
      >
        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Direct Call Support */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleCall}
        className="w-12 h-12 rounded-full bg-white text-black border border-neutral-300 shadow-modal flex items-center justify-center hover:bg-black hover:text-white transition-colors group"
        title="Call Kitchen Support"
        aria-label="Call Support"
      >
        <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </motion.button>

      {/* Scroll To Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-neutral-900 text-white border border-neutral-700 shadow-modal flex items-center justify-center hover:bg-black transition-colors"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
