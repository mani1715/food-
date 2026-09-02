import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';

interface NewsletterSectionProps {
  onSubscribe: (email: string) => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ onSubscribe }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    onSubscribe(email);
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section className="py-16 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-neutral-200 rounded-4xl p-8 sm:p-12 shadow-elevated text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-subtle">
            <Mail className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-black tracking-tight">
              Get Weekly Secret Chef Recipes & Weekend Menu Drops
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Join 15,000+ home food lovers. Unsubscribe anytime with a single click.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="flex-1 px-5 py-3.5 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black transition-all"
            />
            <button
              type="submit"
              className="px-7 py-3.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 shadow-subtle"
            >
              {submitted ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Subscribed!</span>
                </>
              ) : (
                <>
                  <span>Subscribe</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-neutral-400 font-mono">
            100% Privacy Guaranteed • Zero Spam Ever
          </p>
        </div>
      </div>
    </section>
  );
};
