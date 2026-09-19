import React from 'react';
import { ShieldCheck, Lock, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
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
          <strong className="block font-bold">Standard Policy Template — Pending Store Owner Finalization</strong>
          <span className="text-amber-800">
            This document outlines standard customer data handling guidelines. Store owners can customize these terms via store settings.
          </span>
        </div>
      </div>

      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Legal & Transparency</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Privacy Policy</h1>
        <p className="text-xs text-neutral-500 mt-1">Last Updated: September 2026</p>
      </div>

      <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you place an order with Aishu Home Foods, we collect standard details required for fulfillment and payment processing: customer name, contact phone number, email address, postal PIN code, and delivery address.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>2. How We Use Your Data</span>
          </h2>
          <p>
            Your information is used strictly to fulfill your order, coordinate delivery through courier partners, send order status updates, and provide customer support.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-black flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>3. Payment Information Security</span>
          </h2>
          <p>
            Online payments are processed securely via RBI-authorized payment gateway partners. Aishu Home Foods does not store debit/credit card numbers or banking passwords on our servers.
          </p>
        </section>
      </div>
    </div>
  );
};
