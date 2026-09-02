import React, { useState } from 'react';
import { UserLocation } from '../../types';
import { MOCK_LOCATIONS } from '../../data/mockData';
import { MapPin, Check, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationsList, setLocationsList] = useState<UserLocation[]>(MOCK_LOCATIONS);

  if (!isOpen) return null;

  const handleAddNew = () => {
    if (!searchQuery.trim()) return;
    const newLoc: UserLocation = {
      id: `loc-${Date.now()}`,
      label: 'Custom Address',
      area: searchQuery.split(',')[0] || searchQuery,
      city: 'Hyderabad',
      address: searchQuery,
    };
    setLocationsList([newLoc, ...locationsList]);
    onSelectLocation(newLoc);
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-modal space-y-6 text-left relative"
        >
          {/* Close Header */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-black tracking-tight">Select Delivery Location</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Find home kitchens delivering to your doorstep.</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Location Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, apartment, or landmark..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black transition-all"
            />
            {searchQuery && (
              <button
                onClick={handleAddNew}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-black text-white text-xs font-bold rounded-xl"
              >
                Add
              </button>
            )}
          </div>

          {/* Saved Addresses List */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Saved Addresses
            </span>

            {locationsList.map((loc) => {
              const isSelected = loc.id === currentLocation.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-black bg-neutral-50 shadow-subtle'
                      : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? 'text-black' : 'text-neutral-400'}`} />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black">{loc.label}</span>
                        {loc.isDefault && (
                          <span className="text-[10px] bg-neutral-200 text-black font-semibold px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 font-medium">{loc.area}, {loc.city}</p>
                      <p className="text-[11px] text-neutral-400 line-clamp-1">{loc.address}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Use Current GPS Button */}
          <button
            onClick={() => {
              const gpsLoc: UserLocation = {
                id: 'gps-loc',
                label: 'Current Location (GPS)',
                area: 'Hitec City Phase 2',
                city: 'Hyderabad',
                address: 'GPS Verified Location, Hitec City, Hyderabad',
              };
              onSelectLocation(gpsLoc);
              onClose();
            }}
            className="w-full py-3.5 border-2 border-black bg-white text-black text-xs font-bold rounded-2xl hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            <span>Use Current Live GPS Location</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
