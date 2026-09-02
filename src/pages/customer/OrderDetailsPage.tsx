import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ArrowLeft, Clock, MapPin, Phone, RotateCcw, FileText, XCircle, CheckCircle2, MessageCircle } from 'lucide-react';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, addToCart, createSupportTicket, addToast } = useApp();

  const order = orders.find((o) => o.id === id) || orders[0];

  const [showReceipt, setShowReceipt] = useState(false);

  const handleCancelOrder = () => {
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      addToast('Cannot Cancel', `Order is already ${order.status.toLowerCase()}.`, 'error');
      return;
    }
    updateOrderStatus(order.id, 'Cancelled');
  };

  const handleContactChef = () => {
    createSupportTicket(`Order #${order.orderNumber}`, 'Order', `Inquiring about order preparation status for ${order.chefName}.`);
    navigate('/help');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-xl text-xs font-bold hover:border-black"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Receipt</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 shadow-modal space-y-4 border border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-mono text-neutral-400">Order #{order.orderNumber}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
              Order Timeline & Tracking
            </h1>
          </div>
          <span className="bg-white text-black text-xs font-extrabold uppercase px-3 py-1 rounded-full self-start sm:self-auto">
            ● {order.status}
          </span>
        </div>

        {/* Timeline Visual Steps */}
        <div className="pt-4 space-y-6">
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-800">
            {order.timeline.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4 text-xs">
                <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  step.completed ? 'bg-white border-white text-black' : 'bg-neutral-900 border-neutral-700 text-neutral-600'
                }`}>
                  {step.completed && <CheckCircle2 className="w-3 h-3 text-black" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${step.completed ? 'text-white' : 'text-neutral-500'}`}>
                      {step.status}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">({step.time})</span>
                  </div>
                  <p className="text-neutral-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chef & Address Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chef Info */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Home Chef</span>
          <div className="flex items-center gap-3">
            <img src={order.chefAvatar} alt={order.chefName} className="w-12 h-12 rounded-full object-cover border border-white" />
            <div>
              <h4 className="text-sm font-bold text-black">{order.chefName}</h4>
              <p className="text-xs text-neutral-500">Hygiene Certified Kitchen</p>
            </div>
          </div>
          <button
            onClick={handleContactChef}
            className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Contact Chef / Support</span>
          </button>
        </div>

        {/* Address Info */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Delivery Address</span>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-black shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-black">{order.deliveryAddress.label}</h4>
              <p className="text-xs text-neutral-600 mt-0.5">{order.deliveryAddress.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle">
        <h3 className="text-base font-extrabold text-black border-b border-neutral-200 pb-3">Ordered Items</h3>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-medium pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <img src={item.dish.image} alt={item.dish.name} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <p className="font-bold text-black">{item.dish.name}</p>
                  <p className="text-[10px] text-neutral-400">Qty: {item.quantity}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-black">${(item.dish.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 text-xs text-neutral-600 pt-2 font-mono">
          <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Packaging Fee</span><span>${order.packagingFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Delivery Fee</span><span>${order.deliveryFee.toFixed(2)}</span></div>
          <div className="flex justify-between text-black font-extrabold text-sm pt-2 border-t border-neutral-200 font-sans">
            <span>Total Paid ({order.paymentMethod})</span>
            <span className="font-mono">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button
          onClick={() => {
            order.items.forEach((i) => addToCart(i.dish, i.quantity));
            navigate('/cart');
          }}
          className="flex-1 py-4 bg-black text-white text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-subtle"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reorder This Meal</span>
        </button>

        {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
          <button
            onClick={handleCancelOrder}
            className="flex-1 py-4 bg-white border border-neutral-300 text-rose-600 hover:border-rose-600 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        )}
      </div>

      {/* Mock Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-md w-full text-left space-y-4 shadow-modal">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="text-base font-extrabold text-black">Official Aura Receipt</h4>
              <button onClick={() => setShowReceipt(false)} className="text-neutral-400">✕</button>
            </div>
            <p className="text-xs font-mono text-neutral-500">Order ID: {order.orderNumber}</p>
            <div className="text-xs space-y-1 font-mono border-t border-b py-3">
              <p>Customer: {order.customerName}</p>
              <p>Chef: {order.chefName}</p>
              <p>Total Paid: ${order.total.toFixed(2)} ({order.paymentMethod})</p>
            </div>
            <button onClick={() => setShowReceipt(false)} className="w-full py-3 bg-black text-white text-xs font-bold rounded-xl">
              Print / Save PDF
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
