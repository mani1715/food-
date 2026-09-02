import React, { useState } from 'react';
import { X, User, ChefHat, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'customer' | 'chef';
  onShowToast: (title: string, message: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'customer',
  onShowToast,
}) => {
  const [tab, setTab] = useState<'customer' | 'chef'>(initialTab);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'customer') {
      onShowToast('Welcome to Aura', 'Sign-in successful! Welcome back to Aura Kitchens.');
    } else {
      onShowToast('Application Submitted', 'Thank you! Our home kitchen audit team will contact you within 24 hours.');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-modal space-y-6 text-left relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-sm">
                A
              </div>
              <span className="font-extrabold text-lg tracking-wider text-black">AURA</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl">
            <button
              onClick={() => setTab('customer')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === 'customer'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer Sign In</span>
            </button>
            <button
              onClick={() => setTab('chef')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                tab === 'chef'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Partner Chef</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                {tab === 'customer' ? 'Email or Mobile Number' : 'Kitchen Owner Name'}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === 'customer' ? 'name@example.com or +91...' : 'Full Legal Name...'}
                className="w-full px-4 py-3 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                {tab === 'customer' ? 'Password / OTP' : 'Home Kitchen Location'}
              </label>
              <input
                type="password"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={tab === 'customer' ? '••••••••' : 'Jubilee Hills, Hyderabad'}
                className="w-full px-4 py-3 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black transition-all"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-95"
              >
                <span>{tab === 'customer' ? 'Sign In To Continue' : 'Submit Chef Application'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Social Sign-in Options */}
          {tab === 'customer' && (
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <span className="text-[10px] text-neutral-400 font-mono block text-center uppercase tracking-widest">
                Or Continue With
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onShowToast('Google Auth', 'Signed in with Google Account.');
                    onClose();
                  }}
                  className="py-2.5 px-4 border border-neutral-300 rounded-xl text-xs font-bold hover:border-black transition-all flex items-center justify-center gap-2"
                >
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onShowToast('Apple Auth', 'Signed in with Apple ID.');
                    onClose();
                  }}
                  className="py-2.5 px-4 border border-neutral-300 rounded-xl text-xs font-bold hover:border-black transition-all flex items-center justify-center gap-2"
                >
                  <span>Apple ID</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-black" />
            <span>256-Bit Encrypted Secure Access</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
