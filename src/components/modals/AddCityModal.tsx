import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, X, Send, CheckCircle2, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultState?: string;
}

export const AddCityModal: React.FC<AddCityModalProps> = ({ isOpen, onClose, defaultState = 'Andhra Pradesh' }) => {
  const { addToast, citySuggestions } = useApp();

  const [state, setState] = useState(defaultState);
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const states = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra'];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !name.trim() || !phone.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      addToast('City Suggestion Received!', `We received your request for ${city}, ${state}. Admin will review shortly.`, 'success');

      // Auto-reset & close
      setTimeout(() => {
        setIsSuccess(false);
        setCity('');
        setName('');
        setPhone('');
        setEmail('');
        onClose();
      }, 2500);
    }, 1000);
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
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-black tracking-tight">Request Delivery City</h3>
                <p className="text-xs text-neutral-400">Can't find your city? Request delivery below</p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-black mx-auto stroke-[1.5]" />
              <h4 className="text-xl font-extrabold text-black">Request Submitted!</h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Thank you <strong>{name}</strong>. Your request for <strong>{city}, {state}</strong> has been logged. We'll update you at {phone}!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-600 space-y-1">
                <span className="text-black font-extrabold block">Location Processing</span>
                <p className="text-[11px] font-normal leading-relaxed">
                  We'll calculate delivery charges for your city and update delivery availability within 5–10 minutes.
                </p>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">State <span className="text-black">*</span></label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-bold"
                >
                  {states.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">City Name <span className="text-black">*</span></label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Tirupati, Nellore, Warangal..."
                  className="w-full p-3 rounded-2xl border border-neutral-300"
                />
              </div>

              <div className="border-t border-neutral-100 pt-3 space-y-3">
                <span className="text-neutral-400 font-extrabold uppercase tracking-wider text-[10px] block">Customer Contact Info</span>

                <div>
                  <label className="block text-neutral-500 mb-1">Full Name <span className="text-black">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full p-3 rounded-2xl border border-neutral-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">Phone <span className="text-black">*</span></label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full p-3 rounded-2xl border border-neutral-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Email <span className="text-black">*</span></label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-3 rounded-2xl border border-neutral-300"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle mt-2"
              >
                {isSubmitting ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit City Request</span>
                  </>
                )}
              </button>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
