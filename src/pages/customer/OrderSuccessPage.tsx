import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Clock, MapPin, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const OrderSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders } = useApp();

  const order = orders.find((o) => o.id === id) || orders[0];

  return (
    <div className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center flex flex-col items-center justify-center space-y-8">
      
      {/* Animated Success Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center shadow-modal"
      >
        <CheckCircle2 className="w-14 h-14 text-white stroke-[1.5]" />
      </motion.div>

      {/* Success Title & Subtitle */}
      <div className="space-y-2 max-w-lg">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Confirmed</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Your Home Meal Is On Its Way!
        </h1>
        <p className="text-sm text-neutral-600">
          Order <strong className="text-black font-mono">#{order.orderNumber}</strong> has been received by <strong className="text-black">{order.chefName}</strong>.
        </p>
      </div>

      {/* Delivery Estimate Box */}
      <div className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase">Estimated Thermal Delivery</p>
              <p className="text-base font-extrabold text-black">{order.estimatedDeliveryTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <img src={order.chefAvatar} alt={order.chefName} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
            <div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase">Prepared Fresh By</p>
              <p className="text-xs font-bold text-black">{order.chefName}</p>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-3 pt-1">
          <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-black">{order.deliveryAddress.label} Address</p>
            <p className="text-xs text-neutral-500">{order.deliveryAddress.address}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="flex-1 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
        >
          <span>Track Order Status</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/explore')}
          className="flex-1 py-4 bg-white border-2 border-black text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold pt-4">
        <ShieldCheck className="w-4 h-4 text-black" />
        <span>Need help with this order? Contact our 24/7 Concierge Support.</span>
      </div>

    </div>
  );
};
