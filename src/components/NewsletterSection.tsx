import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, ArrowRight } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const { addToast } = useApp();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    addToast('Subscribed!', `Welcome ${email} to Aura Kitchens weekly product alerts.`);
    setEmail('');
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-8 sm:p-12 shadow-subtle space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Get Updates About New Homemade Products
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Subscribe to receive fresh batch announcements, festival hampers, and exclusive discounts.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address..."
            className="flex-1 px-4 py-3.5 rounded-2xl border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black bg-white"
          />
          <button
            type="submit"
            className="px-6 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
          >
            <span>Subscribe</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-neutral-400">We respect your privacy. Unsubscribe at any time.</p>
      </div>
    </section>
  );
};
