import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, Flame, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WelcomeOfferNotificationModal: React.FC = () => {
  const { products, weeklyHighlights } = useApp();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show welcome notification on initial session visit
    const hasSeenWelcome = sessionStorage.getItem('aura_welcome_seen');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('aura_welcome_seen', 'true');
  };

  const getProduct = (id: string) => {
    return products.find((p) => p.id === id) || products[0];
  };

  const dayProduct = getProduct(weeklyHighlights.specialOfDay.productId);
  const weekProduct = getProduct(weeklyHighlights.specialOfWeek.productId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-modal text-left space-y-6 relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Header Badge */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-subtle">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Fresh Batch & Specials Notification</span>
            </div>
            <h3 className="text-2xl font-black text-black tracking-tight pt-1">
              Welcome to Aura Homemade Foods!
            </h3>
            <p className="text-xs text-neutral-500 font-medium">
              Explore today's freshly prepared specials, weekly highlights, and newly arrived delicacies.
            </p>
          </div>

          {/* Highlight Cards Notification List */}
          <div className="space-y-3">
            
            {/* 1. Special of the Day Banner */}
            {dayProduct && (
              <div
                onClick={() => {
                  handleClose();
                  navigate(`/product/${dayProduct.id}`);
                }}
                className="p-4 rounded-2xl bg-neutral-950 text-white flex items-center justify-between gap-3 cursor-pointer hover:border-white transition-all border border-neutral-800 shadow-subtle group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={dayProduct.image} alt={dayProduct.name} className="w-14 h-14 rounded-xl object-cover border border-neutral-800 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="bg-white text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3 text-black" />
                        Today's Special
                      </span>
                      {weeklyHighlights.specialOfDay.discountPercentage && (
                        <span className="text-[10px] font-mono font-bold text-neutral-300">
                          {weeklyHighlights.specialOfDay.discountPercentage}% OFF
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white truncate group-hover:underline">{weeklyHighlights.specialOfDay.title || dayProduct.name}</h4>
                    <p className="text-[11px] text-neutral-400 font-mono">₹{dayProduct.price}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

            {/* 2. Special of the Week Banner */}
            {weekProduct && (
              <div
                onClick={() => {
                  handleClose();
                  navigate(`/product/${weekProduct.id}`);
                }}
                className="p-4 rounded-2xl bg-white text-black border-2 border-black flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50 transition-all shadow-subtle group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={weekProduct.image} alt={weekProduct.name} className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="bg-black text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-white" />
                        Weekly Special
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-black truncate group-hover:underline">{weeklyHighlights.specialOfWeek.title || weekProduct.name}</h4>
                    <p className="text-[11px] text-neutral-500 font-mono">₹{weekProduct.price}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-black shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>
            )}

          </div>

          {/* Bottom Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                handleClose();
                navigate('/products?filter=new-arrivals');
              }}
              className="flex-1 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore New Product Arrivals ✨</span>
            </button>

            <button
              onClick={handleClose}
              className="py-3.5 px-5 bg-neutral-100 text-black text-xs font-bold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
