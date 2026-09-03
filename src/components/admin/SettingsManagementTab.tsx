import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditCard, Smartphone, Plus, Trash2, ShieldCheck } from 'lucide-react';

export const SettingsManagementTab: React.FC = () => {
  const {
    paymentEnabled,
    setPaymentEnabled,
    whatsappContacts,
    addWhatsAppContact,
    deleteWhatsAppContact,
  } = useApp();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContactName.trim() && newContactPhone.trim()) {
      addWhatsAppContact(newContactName, newContactPhone);
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Store Settings & Hotline Channels</h2>
        <p className="text-xs text-neutral-500">Configure online payment gateway availability and WhatsApp concierge hotlines.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Payment Gateway Toggle */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">Payment Gateway Status</h3>
              <p className="text-xs text-neutral-400">Toggle customer checkout online payment status</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-black block">Online Payments (UPI / Cards / COD)</span>
              <span className="text-[11px] text-neutral-500">
                {paymentEnabled ? 'Checkout payments are active.' : 'Online payments suspended.'}
              </span>
            </div>

            <button
              onClick={() => setPaymentEnabled(!paymentEnabled)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                paymentEnabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {paymentEnabled ? 'ENABLED ✅' : 'DISABLED ❌'}
            </button>
          </div>
        </div>

        {/* WhatsApp Support Hotline Manager */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black">WhatsApp Concierge Hotlines</h3>
              <p className="text-xs text-neutral-400">Manage customer support contact channels</p>
            </div>
          </div>

          <form onSubmit={handleAddWhatsApp} className="space-y-3 text-xs font-bold">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Channel Name (e.g. Bulk Orders)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50"
              />
              <input
                type="text"
                placeholder="Phone (+91 98765 43210)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="p-2.5 rounded-xl border border-neutral-300 bg-neutral-50 font-mono"
              />
            </div>
            <button type="submit" className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Add WhatsApp Channel</span>
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {whatsappContacts.map((c) => (
              <div key={c.id} className="p-3 rounded-2xl border border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-black block">{c.name}</span>
                  <span className="font-mono text-neutral-500">{c.phone}</span>
                </div>
                <button onClick={() => deleteWhatsAppContact(c.id)} className="p-1.5 text-neutral-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
