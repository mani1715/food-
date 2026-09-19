import React from 'react';
import { RefreshCw, AlertTriangle, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RefundPolicyPage: React.FC = () => {
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
          <strong className="block font-bold">Standard Cancellation & Refund Guidelines — Pending Store Owner Review</strong>
          <span className="text-amber-800">
            Perishable food return terms are subject to store policy confirmation.
          </span>
        </div>
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Returns & Cancellations</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Cancellation & Refund Policy</h1>
        <p className="text-xs text-neutral-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>1. Order Cancellation</span>
          </h2>
          <p>
            Orders may be cancelled before dispatch directly from the Track Order page or by contacting store support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>2. Damaged Deliveries & Refunds</span>
          </h2>
          <p>
            If a package is damaged in transit or an incorrect item is received, please report the issue with supporting details so our team can review and process appropriate resolution or refund.
          </p>
        </section>
      </div>
    </div>
  );
};
