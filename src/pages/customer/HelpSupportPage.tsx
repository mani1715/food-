import React, { useState } from 'react';
import { Search, HelpCircle, MessageCircle, Phone, FileText } from 'lucide-react';

export const HelpSupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: 'How are the pickles and sweets packaged for shipping?',
      a: 'All our homemade pickles are sealed in airtight glass & food-grade PET jars with thermal leak-proof seals to ensure freshness during transit.',
    },
    {
      q: 'Are the products prepared fresh after placing an order?',
      a: 'Yes, sweets, snacks, and pickles are prepared in daily fresh batches without artificial preservatives.',
    },
    {
      q: 'Do you offer bulk return gift hampers for weddings and events?',
      a: 'Yes! We specialize in custom rigid gift hampers for Weddings, Diwali, Sankranti, and corporate events. Contact our team via WhatsApp hotline.',
    },
    {
      q: 'What is the shelf life of homemade pickles?',
      a: 'Our pickles have a shelf life of 6 to 12 months when stored with a dry spoon away from moisture.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Support</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Help Center & FAQ</h1>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help topics (e.g. shipping, shelf life, gift boxes)..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
          <MessageCircle className="w-6 h-6 text-black" />
          <h4 className="text-sm font-bold text-black">WhatsApp Customer Concierge</h4>
          <p className="text-xs text-neutral-500">24/7 direct messaging for order queries</p>
        </div>

        <div className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
          <Phone className="w-6 h-6 text-black" />
          <h4 className="text-sm font-bold text-black">Toll-Free Helpline</h4>
          <p className="text-xs text-neutral-500">1800-AURA-FOOD (Mon-Sat 9AM - 8PM)</p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-neutral-200">
        <h3 className="text-lg font-extrabold text-black">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-3xl border border-neutral-200 bg-white space-y-2 shadow-subtle">
              <h4 className="text-sm font-bold text-black">{faq.q}</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
