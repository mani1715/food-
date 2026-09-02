import React from 'react';
import { CartItem } from '../../types';
import { EmptyState } from '../EmptyState';
import { X, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (dishId: string, delta: number) => void;
  onRemoveItem: (dishId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.dish.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 3.50 : 0;
  const packagingFee = subtotal > 0 ? 1.50 : 0;
  const total = subtotal + deliveryFee + packagingFee;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="bg-white w-full max-w-md h-full shadow-modal flex flex-col justify-between relative text-left border-l border-neutral-200"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-black tracking-tight">Your Order Basket</h3>
              {cartItems.length > 0 && (
                <span className="text-xs bg-black text-white font-mono px-2.5 py-0.5 rounded-full">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-neutral-400 hover:text-black font-semibold underline mr-2"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {cartItems.length === 0 ? (
              <EmptyState
                type="cart"
                onAction={onClose}
                actionLabel="Explore Home Menu"
              />
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.dish.id}
                    className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 flex gap-4 items-center justify-between"
                  >
                    <img
                      src={item.dish.image}
                      alt={item.dish.name}
                      className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-black truncate">{item.dish.name}</h4>
                      <p className="text-xs text-neutral-500 font-medium">{item.dish.chefName}</p>
                      <p className="text-sm font-extrabold text-black mt-1">
                        ${(item.dish.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button
                        onClick={() => onRemoveItem(item.dish.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-xl px-2 py-1 shadow-subtle">
                        <button
                          onClick={() => onUpdateQuantity(item.dish.id, -1)}
                          className="text-black hover:bg-neutral-100 rounded p-0.5"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono text-black min-w-[16px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.dish.id, 1)}
                          className="text-black hover:bg-neutral-100 rounded p-0.5"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-neutral-200 bg-white space-y-4 shadow-modal">
              {/* Pricing Breakdown */}
              <div className="space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-black">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eco Thermal Packaging</span>
                  <span className="font-bold text-black">${packagingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Express Express Delivery</span>
                  <span className="font-bold text-black">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-black pt-2 border-t border-neutral-200">
                  <span>Total Amount</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-semibold bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>100% Prepared Fresh Upon Order Confirmation</span>
              </div>

              {/* Checkout Button */}
              <button
                onClick={onCheckout}
                className="w-full py-4 bg-black text-white text-sm font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-subtle active:scale-95"
              >
                <span>Proceed To Mock Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
