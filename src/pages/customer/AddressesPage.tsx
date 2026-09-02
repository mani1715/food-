import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Plus, Check, Trash2, Edit2, X } from 'lucide-react';
import { UserLocation } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const AddressesPage: React.FC = () => {
  const { locations, addLocation, deleteLocation, updateLocation, setCurrentLocation, currentLocation } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);

  const [label, setLabel] = useState('Home');
  const [houseNo, setHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('Jubilee Hills');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('500033');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({
      label,
      houseNo,
      street,
      area,
      city,
      pincode,
    });
    setShowAddModal(false);
    setHouseNo('');
    setStreet('');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Delivery Management</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Saved Addresses</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      <div className="space-y-4">
        {locations.map((loc) => {
          const isSelected = loc.id === currentLocation.id;
          return (
            <div
              key={loc.id}
              className={`p-6 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
                isSelected ? 'border-black bg-neutral-50 shadow-subtle' : 'border-neutral-200 bg-white hover:border-black'
              }`}
            >
              <div className="flex items-start gap-4">
                <MapPin className={`w-6 h-6 mt-1 shrink-0 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-black">{loc.label}</h3>
                    {isSelected && (
                      <span className="text-[10px] bg-black text-white font-bold px-2.5 py-0.5 rounded-full">
                        Active Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 font-medium">{loc.address}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">Pincode: {loc.pincode || '500033'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isSelected && (
                  <button
                    onClick={() => setCurrentLocation(loc)}
                    className="px-3 py-1.5 border border-neutral-300 rounded-xl text-xs font-bold hover:border-black"
                  >
                    Set Active
                  </button>
                )}
                <button onClick={() => deleteLocation(loc.id)} className="p-2 text-neutral-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">Add Delivery Address</h3>
                <button onClick={() => setShowAddModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Address Label</label>
                  <input
                    type="text"
                    required
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Home, Office, Gym..."
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Flat / Villa / House No</label>
                  <input
                    type="text"
                    required
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 402, Block B"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  Save Address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
