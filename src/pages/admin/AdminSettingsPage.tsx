import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Save, ShieldCheck, Bell } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { addToast } = useApp();

  const [platformCommission, setPlatformCommission] = useState('15');
  const [deliveryFeeBase, setDeliveryFeeBase] = useState('3.50');
  const [autoApproveChefs, setAutoApproveChefs] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Settings Saved', 'Platform configuration settings updated.');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">System Configuration</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Platform Admin Settings</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Platform Commission Fee (%)</label>
            <input
              type="number"
              value={platformCommission}
              onChange={(e) => setPlatformCommission(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Base Express Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              value={deliveryFeeBase}
              onChange={(e) => setDeliveryFeeBase(e.target.value)}
              className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
            />
          </div>
        </div>

        <div className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-black">Auto-Approve Home Chefs</h4>
            <p className="text-xs text-neutral-500">Automatically mark new applications as verified without manual audit.</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoApproveChefs(!autoApproveChefs)}
            className={`w-12 h-6 rounded-full transition-colors relative ${autoApproveChefs ? 'bg-black' : 'bg-neutral-300'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${autoApproveChefs ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Admin Settings</span>
        </button>
      </form>

    </div>
  );
};
