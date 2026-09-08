import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, ArrowUp, ShoppingBag, Gift, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FloatingBundleWidget: React.FC = () => {
  const { cartItems } = useApp();
  const navigate = useNavigate();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const itemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

  // Dynamic Discount Tier Logic
  let discountAmount = 0;
  let nextTierMessage = 'Add 2 items to get Rs.201 off.';
  let progressPercentage = 0;

  if (itemCount >= 6) {
    discountAmount = 603;
    nextTierMessage = '🎉 Maximum tier achieved! You unlocked Rs.603 OFF!';
    progressPercentage = 100;
  } else if (itemCount >= 4) {
    discountAmount = 402;
    const needed = 6 - itemCount;
    nextTierMessage = `Add ${needed} more to get Rs.603 off.`;
    progressPercentage = 66;
  } else if (itemCount >= 2) {
    discountAmount = 201;
    const needed = 4 - itemCount;
    nextTierMessage = `Add ${needed} more to get Rs.402 off.`;
    progressPercentage = 33;
  } else {
    const needed = 2 - itemCount;
    nextTierMessage = `Add ${needed} more to get Rs.201 off.`;
    progressPercentage = Math.round((itemCount / 2) * 33);
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      navigate('/products');
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-sans text-left print:hidden">
      
      {/* Scroll to Top floating circle button */}
      <button
        onClick={handleScrollToTop}
        className="w-10 h-10 rounded-full bg-white border border-neutral-300 shadow-modal flex items-center justify-center text-neutral-700 hover:text-black hover:border-black transition-all cursor-pointer"
        title="Scroll to Top"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* FLOATING CARD */}
      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-72 sm:w-80 bg-white border border-neutral-200 rounded-3xl p-5 shadow-modal space-y-4 relative"
          >
            {/* Header & Minimize Toggle */}
            <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-black tracking-tight flex items-center gap-1.5">
                  <span>Bundle More,</span>
                  <span>Save More</span>
                </h3>
                <p className="text-xs text-neutral-600 font-semibold mt-0.5">{nextTierMessage}</p>
              </div>

              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
                title="Minimize Widget"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Savings Progress Bar Tiers */}
            <div className="space-y-1.5">
              <div className="relative w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                <div
                  className="bg-black h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Tier Dots Labels */}
              <div className="flex justify-between text-[10px] font-extrabold text-neutral-500 font-mono">
                <span className={itemCount >= 2 ? 'text-black font-black' : ''}>Rs.201 off</span>
                <span className={itemCount >= 4 ? 'text-black font-black' : ''}>Rs.402 off</span>
                <span className={itemCount >= 6 ? 'text-black font-black' : ''}>Rs.603 off</span>
              </div>
            </div>

            {/* Accordion Item Counter Dropdown */}
            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-neutral-50">
              <button
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-black hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <span className="uppercase font-mono text-[10px] text-neutral-500">STEP 1</span>
                <div className="flex items-center gap-1">
                  <span>{itemCount} item(s) added</span>
                  {isAccordionOpen ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </div>
              </button>

              {isAccordionOpen && (
                <div className="p-3 border-t border-neutral-200 bg-white max-h-40 overflow-y-auto space-y-2 text-xs">
                  {cartItems.length > 0 ? (
                    cartItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate max-w-[170px]">
                          <img src={item.product.image} alt={item.product.name} className="w-7 h-7 rounded-lg object-cover border" />
                          <span className="truncate font-bold text-black">{item.product.name}</span>
                        </div>
                        <span className="font-mono text-neutral-500 font-bold">{item.quantity}x (₹{item.unitPrice})</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-neutral-400 italic text-center py-1">No items added to bundle yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Subtotal Total Display */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-neutral-500 uppercase">Total</span>
              <span className="text-base font-black font-mono text-black">Rs. {subtotal.toFixed(2)}</span>
            </div>

            {/* Action Checkout Button */}
            <button
              onClick={handleCheckout}
              className="w-full py-3 bg-neutral-700 hover:bg-black text-white text-xs font-extrabold rounded-2xl transition-all shadow-subtle flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{cartItems.length > 0 ? 'Add all to cart & Checkout' : 'Explore Store Items'}</span>
            </button>

          </motion.div>
        ) : (
          /* Minimized Badge Button */
          <motion.button
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            onClick={() => setIsMinimized(false)}
            className="px-4 py-2.5 bg-black text-white rounded-full shadow-modal flex items-center gap-2 text-xs font-extrabold hover:bg-neutral-800 transition-all cursor-pointer border border-neutral-700"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Bundle & Save {discountAmount > 0 ? `(Rs.${discountAmount} OFF)` : `(${itemCount})`}</span>
          </motion.button>
        )}
      </AnimatePresence>

    </div>
  );
};
