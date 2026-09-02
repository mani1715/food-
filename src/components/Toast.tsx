import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ title, message, type = 'success', onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="pointer-events-auto flex items-start gap-3 p-4 bg-black text-white rounded-2xl shadow-modal border border-neutral-800 text-left"
    >
      <div className="mt-0.5 shrink-0">
        {type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
        {type === 'info' && <Info className="w-5 h-5 text-white" />}
        {type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white">{title}</h4>
        <p className="text-xs text-neutral-300 mt-0.5">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
