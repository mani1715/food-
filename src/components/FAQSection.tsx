import React, { useState } from 'react';
import { MOCK_FAQS } from '../data/mockData';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-white border-b border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            <HelpCircle className="w-4 h-4 text-black" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Everything you need to know about our home chefs, food safety verification, and delivery process.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {MOCK_FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="border border-neutral-200 rounded-3xl overflow-hidden bg-white shadow-subtle hover:border-black transition-colors"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base text-black focus:outline-none"
                >
                  <span className="leading-snug">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-200 text-black'
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
