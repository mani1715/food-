import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto flex items-start gap-3 p-4 bg-black text-white rounded-2xl shadow-elevated border border-neutral-800"
    >
      <div className="mt-0.5 shrink-0">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-white" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold tracking-wide text-white">{toast.title}</h4>
        <p className="text-xs text-neutral-300 mt-0.5">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};
