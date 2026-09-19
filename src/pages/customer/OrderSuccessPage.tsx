import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Printer, Heart, Sparkles, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useApp();
  const cardPrintRef = useRef<HTMLDivElement>(null);

  const order = orders.find((o) => o.id === id) || orders[0];
  const customerName = order.customerName || 'Valued Food Lover';

  const handlePrintGreetingCard = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center flex flex-col items-center justify-center space-y-8">
      
      {/* Animated Success Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black text-white flex items-center justify-center shadow-modal print:hidden"
      >
        <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[1.5]" />
      </motion.div>

      {/* Success Title */}
      <div className="space-y-2 max-w-lg print:hidden">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Confirmed</span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-black tracking-tight">
          Thank You For Your Order!
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600">
          Order <strong className="text-black font-mono">#{order.orderNumber}</strong> has been received and is being handcrafted fresh for you.
        </p>
      </div>

      {/* PERSONALIZED GREETING & THANK YOU CARD (Printable) */}
      <div
        ref={cardPrintRef}
        className="w-full bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-modal text-left space-y-4 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-base font-bold shadow-sm">
              👵
            </div>
            <div>
              <span className="text-sm sm:text-base font-black tracking-tight block text-black font-serif">
                AISHU HOME FOODS
              </span>
              <span className="text-[10px] font-bold tracking-widest text-amber-800 uppercase">
                Handcrafted with Pure Love & Heritage Taste
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-500">
            Order #{order.orderNumber}
          </span>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm text-neutral-800 leading-relaxed font-serif">
          <p className="font-sans font-bold text-sm text-black">
            Dear {customerName},
          </p>
          <p>
            Thank you from the bottom of our hearts for choosing <strong>Aishu Home Foods</strong>! Every single item in your order was prepared in small batches following our traditional grandmother recipes.
          </p>
          <p>
            We hope every bite brings you the genuine warmth of home, authentic nostalgia, and rich natural flavors.
          </p>
          <p className="font-sans font-semibold text-xs text-neutral-600 pt-1">
            With Warmth & Gratitude,<br />
            <strong className="text-black font-serif text-sm">The Aishu Home Foods Family 💖</strong>
          </p>
        </div>

        {/* Order Items Snippet inside Card */}
        <div className="bg-white/80 border border-amber-200/80 rounded-2xl p-3 text-[11px] space-y-1 font-sans">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Delicacies Prepared in Your Box:</span>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-neutral-700 font-medium">
              <span>• {item.quantity}x {item.product.name} ({item.selectedWeight})</span>
            </div>
          ))}
        </div>

        {/* Print / Download Button */}
        <div className="pt-2 flex justify-end print:hidden">
          <button
            type="button"
            onClick={handlePrintGreetingCard}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Personalized Greeting Card 🎁</span>
          </button>
        </div>
      </div>

      {/* Order Summary Box */}
      <div className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-left print:hidden">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Delivery Address</p>
            <p className="text-xs font-bold text-black">{order.deliveryAddress.label}: {order.deliveryAddress.address}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Total</p>
            <p className="text-sm font-extrabold font-mono text-black">₹{order.total} ({order.paymentMethod})</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Order Items</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-neutral-700">
              <span>{item.quantity}x {item.product.name} ({item.selectedWeight})</span>
              <span className="font-mono font-bold">₹{item.unitPrice * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md print:hidden">
        <button
          onClick={() => navigate('/orders')}
          className="flex-1 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/products')}
          className="flex-1 py-4 bg-white border-2 border-black text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold pt-4 print:hidden">
        <ShieldCheck className="w-4 h-4 text-black" />
        <span>Authentic Preparation & Freshness Guaranteed</span>
      </div>

    </div>
  );
};
