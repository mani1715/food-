import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, ShoppingBag, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
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

      {/* Success Title */}
      <div className="space-y-2 max-w-lg">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Confirmed</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Thank You For Your Order!
        </h1>
        <p className="text-sm text-neutral-600">
          Order <strong className="text-black font-mono">#{order.orderNumber}</strong> has been received and is being prepared in small fresh batches.
        </p>
      </div>

      {/* Order Summary Box */}
      <div className="w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Delivery Address</p>
            <p className="text-xs font-bold text-black">{order.deliveryAddress.label}: {order.deliveryAddress.address}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-400 font-bold uppercase">Total Paid</p>
            <p className="text-sm font-extrabold font-mono text-black">${order.total.toFixed(2)} ({order.paymentMethod})</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-neutral-400 font-bold uppercase">Items Ordered</p>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-neutral-700">
              <span>{item.quantity}x {item.product.name} ({item.selectedWeight})</span>
              <span className="font-mono font-bold">${(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => navigate('/orders')}
          className="flex-1 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate('/products')}
          className="flex-1 py-4 bg-white border-2 border-black text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold pt-4">
        <ShieldCheck className="w-4 h-4 text-black" />
        <span>Thermal Sealed & Freshness Guaranteed</span>
      </div>

    </div>
  );
};
