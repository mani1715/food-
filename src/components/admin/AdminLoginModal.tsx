import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, X, ArrowRight, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAdmin } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(email, password);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@aura.com');
    setPassword('admin123');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-modal space-y-6 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-black tracking-tight">Admin Portal Login</h3>
                <p className="text-xs text-neutral-400 font-mono">Restricted Store Management</p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@aura.com"
                className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle mt-2"
            >
              <span>Authenticate & Access Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo Credentials Auto-Fill Button */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-medium">Demo Access Credentials:</span>
            <button
              type="button"
              onClick={handleDemoFill}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 font-bold transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Auto-Fill Admin Demo</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
