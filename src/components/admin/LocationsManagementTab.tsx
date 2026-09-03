import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryCity, CitySuggestion } from '../../types';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

export const LocationsManagementTab: React.FC = () => {
  const {
    deliveryCities,
    citySuggestions,
    addDeliveryCity,
    updateDeliveryCity,
    deleteDeliveryCity,
    approveCitySuggestion,
    rejectCitySuggestion,
    deleteCitySuggestion,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'cities' | 'suggestions'>('cities');
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newStateName, setNewStateName] = useState('Andhra Pradesh');
  const [newCharge, setNewCharge] = useState(49);
  const [newThreshold, setNewThreshold] = useState(750);

  // Approve Suggestion Modal
  const [selectedSuggestion, setSelectedSuggestion] = useState<CitySuggestion | null>(null);
  const [approveCharge, setApproveCharge] = useState(59);
  const [approveThreshold, setApproveThreshold] = useState(1000);

  const handleAddCitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    addDeliveryCity({
      name: newCityName,
      state: newStateName,
      charge: newCharge,
      freeDeliveryThreshold: newThreshold,
      enabled: true,
    });

    setShowAddCityModal(false);
    setNewCityName('');
  };

  const handleConfirmApproval = () => {
    if (selectedSuggestion) {
      approveCitySuggestion(selectedSuggestion.id, approveCharge, approveThreshold);
      setSelectedSuggestion(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Delivery Locations & City Requests</h2>
          <p className="text-xs text-neutral-500">Manage delivery charges, free delivery thresholds and customer city requests.</p>
        </div>

        {/* Subtab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-2xl border border-neutral-200">
          <button
            onClick={() => setActiveSubTab('cities')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'cities' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Active Cities ({deliveryCities.length})
          </button>
          <button
            onClick={() => setActiveSubTab('suggestions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'suggestions' ? 'bg-black text-white' : 'text-neutral-600 hover:text-black'
            }`}
          >
            City Requests ({citySuggestions.filter((s) => s.status === 'pending').length} Pending)
          </button>
        </div>
      </div>

      {activeSubTab === 'cities' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Enabled Delivery Cities</span>
            <button
              onClick={() => setShowAddCityModal(true)}
              className="px-3.5 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add New City</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deliveryCities.map((city) => (
              <div key={city.id} className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-black" />
                    <div>
                      <h4 className="text-sm font-extrabold text-black">{city.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">{city.state}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteDeliveryCity(city.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-sans block uppercase">Delivery Fee</span>
                    <span className="font-extrabold text-black">${city.charge.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-sans block uppercase">Free Delivery Above</span>
                    <span className="font-extrabold text-black">${city.freeDeliveryThreshold || 500}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Customer Suggested Cities</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {citySuggestions.map((sug) => (
              <div key={sug.id} className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-black">{sug.city}</h4>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase">{sug.state}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    sug.status === 'pending' ? 'bg-neutral-100 text-black border border-neutral-300' : sug.status === 'approved' ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {sug.status}
                  </span>
                </div>

                <div className="text-xs text-neutral-600 space-y-0.5">
                  <p>Customer: <strong>{sug.customerName}</strong></p>
                  <p className="font-mono text-[11px]">{sug.phone} • {sug.email}</p>
                </div>

                {sug.status === 'pending' ? (
                  <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSuggestion(sug)}
                      className="flex-1 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectCitySuggestion(sug.id)}
                      className="flex-1 py-2 border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-xl"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => deleteCitySuggestion(sug.id)}
                    className="w-full py-2 bg-neutral-100 text-neutral-600 text-xs font-bold rounded-xl hover:bg-neutral-200"
                  >
                    Delete Suggestion
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showAddCityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-black">Add Delivery City</h3>
              <button onClick={() => setShowAddCityModal(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <form onSubmit={handleAddCitySubmit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">City Name</label>
                <input type="text" required value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="e.g. Tirupati" className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">State</label>
                <input type="text" required value={newStateName} onChange={(e) => setNewStateName(e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Delivery Charge ($)</label>
                  <input type="number" step="0.5" value={newCharge} onChange={(e) => setNewCharge(Number(e.target.value))} className="w-full p-3 rounded-2xl border border-neutral-300" />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Free Delivery Threshold ($)</label>
                  <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(Number(e.target.value))} className="w-full p-3 rounded-2xl border border-neutral-300" />
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl">
                Save & Enable Delivery City
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Approve Suggestion Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-modal">
            <h3 className="text-base font-extrabold text-black">Approve {selectedSuggestion.city}, {selectedSuggestion.state}</h3>
            <p className="text-xs text-neutral-500">Set delivery parameters for this newly approved city:</p>
            
            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Delivery Charge ($)</label>
                <input type="number" value={approveCharge} onChange={(e) => setApproveCharge(Number(e.target.value))} className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>
              <div>
                <label className="block text-neutral-500 mb-1">Free Delivery Threshold ($)</label>
                <input type="number" value={approveThreshold} onChange={(e) => setApproveThreshold(Number(e.target.value))} className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setSelectedSuggestion(null)} className="flex-1 py-3 bg-neutral-100 text-black text-xs font-bold rounded-2xl">
                Cancel
              </button>
              <button onClick={handleConfirmApproval} className="flex-1 py-3 bg-black text-white text-xs font-bold rounded-2xl">
                Approve & Enable City
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
