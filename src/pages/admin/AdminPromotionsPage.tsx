import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tag, Plus, Power, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminPromotionsPage: React.FC = () => {
  const { promotions, createPromotion, togglePromotionStatus } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [maxDiscount, setMaxDiscount] = useState('10');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;
    createPromotion({
      name,
      code,
      discountPercent: parseFloat(discountPercent) || 15,
      maxDiscount: parseFloat(maxDiscount) || 10,
    });
    setShowModal(false);
    setName('');
    setCode('');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Marketing & Offers</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Promotions & Coupons</h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-4 shadow-subtle flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold font-mono uppercase bg-black text-white px-3 py-1 rounded-xl">
                  {promo.code}
                </span>
                <button
                  onClick={() => togglePromotionStatus(promo.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    promo.status === 'Active' ? 'bg-emerald-900 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {promo.status}
                </button>
              </div>

              <h3 className="text-lg font-bold text-black pt-1">{promo.name}</h3>
              <p className="text-xs text-neutral-500">
                {promo.discountPercent}% OFF up to ${promo.maxDiscount.toFixed(2)}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Usage: {promo.usageCount} / {promo.usageLimit}</span>
              <span>Valid till {promo.endDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">Create Promotional Coupon</h3>
                <button onClick={() => setShowModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Festival Thali Special"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVAL20"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold uppercase font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Discount %</label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Max Cap ($)</label>
                    <input
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  Publish Coupon
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
