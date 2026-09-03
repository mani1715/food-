import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Plus, Check, AlertCircle, ChevronDown } from 'lucide-react';
import { AddCityModal } from './modals/AddCityModal';

export const LocationDetectorBar: React.FC = () => {
  const { deliveryCities, currentLocation, setCurrentLocation, addToast } = useApp();

  const [isDetecting, setIsDetecting] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto Geolocation Detection via OpenStreetMap Reverse Geocoding
  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      addToast('Geolocation Error', 'Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsDetecting(true);
    setStatusMessage('Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const detectedState = addr.state || 'Telangana';
          const possibleCityNames = [
            addr.city,
            addr.town,
            addr.municipality,
            addr.county,
            addr.district,
            addr.suburb,
          ].filter(Boolean);

          // Match against deliveryCities list
          let matchedCity = deliveryCities.find((c) =>
            possibleCityNames.some((p) => c.name.toLowerCase() === p.toLowerCase())
          );

          if (!matchedCity) {
            // Fallback match by state or first city
            matchedCity = deliveryCities.find((c) => c.state.toLowerCase() === detectedState.toLowerCase()) || deliveryCities[0];
          }

          if (matchedCity) {
            setCurrentLocation({
              id: 'loc-detected',
              label: 'Current Location',
              address: `${matchedCity.name}, ${matchedCity.state}`,
              city: matchedCity.name,
              pincode: '500001',
            });

            setStatusMessage(`📍 Location detected: ${matchedCity.name}, ${matchedCity.state}! Showing products with delivery fee $${matchedCity.charge}.`);
            addToast('Location Detected', `Delivering to ${matchedCity.name}, ${matchedCity.state}.`, 'success');
          } else {
            setStatusMessage(`Detected ${possibleCityNames[0] || 'your area'}, but we don't deliver there yet. Request your city below!`);
          }
        } catch (err) {
          setStatusMessage('Failed to detect GPS location. Select your city manually.');
        } finally {
          setIsDetecting(false);
        }
      },
      () => {
        setIsDetecting(false);
        setStatusMessage('Location permission denied or unavailable. Please select your city manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-neutral-50 border-y border-neutral-200 py-3.5 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Location Selection Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-xs text-black">
            <MapPin className="w-4 h-4 text-black" />
            <span>Delivering To:</span>
          </div>

          {/* Current City Selector Dropdown */}
          <div className="relative">
            <select
              value={currentLocation.city}
              onChange={(e) => {
                const selected = deliveryCities.find((c) => c.name === e.target.value);
                if (selected) {
                  setCurrentLocation({
                    id: `loc-${selected.id}`,
                    label: 'Selected City',
                    address: `${selected.name}, ${selected.state}`,
                    city: selected.name,
                    pincode: '500001',
                  });
                  addToast('City Selected', `Delivering to ${selected.name}.`, 'info');
                }
              }}
              className="py-2 pl-3 pr-8 rounded-xl border border-neutral-300 bg-white text-xs font-extrabold text-black focus:outline-none focus:border-black shadow-subtle appearance-none cursor-pointer"
            >
              {deliveryCities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}, {city.state} (Fee: ${city.charge})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Auto-Detect GPS Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="px-3 py-2 rounded-xl bg-black text-white text-xs font-extrabold hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting GPS...' : 'Auto-Detect Location'}</span>
          </button>

          {/* Request City Unlisted Modal Trigger */}
          <button
            onClick={() => setShowAddCityModal(true)}
            className="px-3 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold hover:border-black text-black transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>City Not Listed? Request City</span>
          </button>
        </div>

        {/* Right: Delivery Guarantee Badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
          <span>Thermal Sealed Freshness Delivery Available</span>
        </div>

      </div>

      {/* Geolocation Detection Status Message Banner */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto mt-2 p-2.5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-700 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-black font-mono text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Add City Modal */}
      <AddCityModal
        isOpen={showAddCityModal}
        onClose={() => setShowAddCityModal(false)}
      />
    </div>
  );
};
