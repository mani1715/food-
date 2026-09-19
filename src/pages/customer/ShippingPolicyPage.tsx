import React from 'react';
import { Truck, Clock, MapPin, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ShippingPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="px-3 py-1.5 bg-neutral-100 hover:bg-black hover:text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Owner Review Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">Standard Shipping Template — Subject to Courier Logistics Configuration</strong>
          <span className="text-amber-800">
            Actual delivery timeframes depend on shipping partners and customer delivery PIN code.
          </span>
        </div>
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Order Delivery</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Shipping & Delivery Policy</h1>
        <p className="text-xs text-neutral-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>1. Dispatch & Delivery Estimates</span>
          </h2>
          <p>
            Orders are typically dispatched after batch preparation. Delivery timelines vary based on location and courier service availability.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>2. Delivery Charges</span>
          </h2>
          <p>
            Delivery fees are computed at checkout based on store promotional thresholds (e.g. standard delivery fee or promotional free delivery on eligible order totals).
          </p>
        </section>
      </div>
    </div>
  );
};
