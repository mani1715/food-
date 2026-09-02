import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, HelpCircle, MessageCircle, Phone, FileText, Plus, Check, X } from 'lucide-react';
import { MOCK_FAQS } from '../../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

export const HelpSupportPage: React.FC = () => {
  const { tickets, createSupportTicket, addToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'Order' | 'Payment' | 'Delivery' | 'General'>('Order');
  const [description, setDescription] = useState('');

  const filteredFaqs = searchQuery.trim()
    ? MOCK_FAQS.filter((f) => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_FAQS;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;
    createSupportTicket(subject, category, description);
    setShowTicketModal(false);
    setSubject('');
    setDescription('');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Support</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Help & Support Center</h1>
        </div>
        <button
          onClick={() => setShowTicketModal(true)}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-subtle shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help topics (e.g. hygiene, packaging, pre-orders)..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black bg-neutral-50"
        />
      </div>

      {/* Support Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
          <MessageCircle className="w-6 h-6 text-black" />
          <h4 className="text-sm font-bold text-black">WhatsApp Hotline</h4>
          <p className="text-xs text-neutral-500">24/7 direct kitchen messaging</p>
          <button
            onClick={() => addToast('WhatsApp Support', 'Opening direct WhatsApp chat with Concierge...')}
            className="text-xs font-bold text-black underline pt-1"
          >
            Chat Now
          </button>
        </div>

        <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
          <Phone className="w-6 h-6 text-black" />
          <h4 className="text-sm font-bold text-black">Phone Helpline</h4>
          <p className="text-xs text-neutral-500">Toll-free 1800-AURA-FOOD</p>
          <button
            onClick={() => addToast('Phone Support', 'Dialing 1800-AURA-FOOD...')}
            className="text-xs font-bold text-black underline pt-1"
          >
            Call Support
          </button>
        </div>

        <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
          <FileText className="w-6 h-6 text-black" />
          <h4 className="text-sm font-bold text-black">Support Tickets</h4>
          <p className="text-xs text-neutral-500">{tickets.length} Active Tickets</p>
          <button
            onClick={() => setShowTicketModal(true)}
            className="text-xs font-bold text-black underline pt-1"
          >
            Submit Inquiry
          </button>
        </div>
      </div>

      {/* Active Tickets List */}
      {tickets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Your Support Tickets</h3>
          <div className="space-y-3">
            {tickets.map((tkt) => (
              <div key={tkt.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="font-mono text-black">#{tkt.ticketNumber} ({tkt.category})</span>
                  <span className="bg-black text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                    {tkt.status}
                  </span>
                </div>
                <h5 className="text-sm font-bold text-black">{tkt.subject}</h5>
                <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-600 space-y-1">
                  {tkt.messages.map((m, i) => (
                    <p key={i}><strong className="text-black">{m.sender}:</strong> {m.text}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Accordions List */}
      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <h3 className="text-base font-extrabold text-black">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
              <h4 className="text-sm font-bold text-black">{faq.question}</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showTicketModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">Open Support Ticket</h3>
                <button onClick={() => setShowTicketModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
                  >
                    <option value="Order">Order Related</option>
                    <option value="Payment">Payment / Refund</option>
                    <option value="Delivery">Delivery Speed & Packaging</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of issue..."
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  Submit Ticket
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
