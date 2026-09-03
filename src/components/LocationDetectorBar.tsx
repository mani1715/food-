import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { AddCityModal } from './modals/AddCityModal';

export const LocationDetectorBar: React.FC = () => {
  const { deliveryCities, currentLocation, setCurrentLocation, addToast } = useApp();

  const [isDetecting, setIsDetecting] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper: Match detected city string against enabled deliveryCities list
  const matchAndSetCity = (detectedCityName: string, detectedStateName: string) => {
    let matchedCity = deliveryCities.find((c) =>
      c.name.toLowerCase().includes(detectedCityName.toLowerCase()) ||
      detectedCityName.toLowerCase().includes(c.name.toLowerCase())
    );

    if (!matchedCity && detectedStateName) {
      matchedCity = deliveryCities.find((c) =>
        c.state.toLowerCase().includes(detectedStateName.toLowerCase()) ||
        detectedStateName.toLowerCase().includes(c.state.toLowerCase())
      );
    }

    if (!matchedCity) {
      matchedCity = deliveryCities[0]; // Default fallback to first delivery city
    }

    if (matchedCity) {
      setCurrentLocation({
        id: `loc-${matchedCity.id}`,
        label: 'Detected Location',
        address: `${matchedCity.name}, ${matchedCity.state}`,
        city: matchedCity.name,
        pincode: '500001',
      });

      setStatusMessage(`📍 Location detected: ${matchedCity.name}, ${matchedCity.state}! Showing items available for delivery ($${matchedCity.charge} delivery fee).`);
      addToast('Location Detected!', `Delivering to ${matchedCity.name}, ${matchedCity.state}.`, 'success');
      return true;
    }
    return false;
  };

  // Fallback: IP-based Location API
  const detectViaIP = async () => {
    try {
      setStatusMessage('Detecting location via IP lookup...');
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      
      if (data && data.success) {
        const city = data.city || data.region || 'Hyderabad';
        const region = data.region || 'Telangana';
        matchAndSetCity(city, region);
      } else {
        // Second IP API fallback
        const res2 = await fetch('https://ipapi.co/json/');
        const data2 = await res2.json();
        const city2 = data2.city || 'Hyderabad';
        const region2 = data2.region || 'Telangana';
        matchAndSetCity(city2, region2);
      }
    } catch (err) {
      // Default to Hyderabad
      matchAndSetCity('Hyderabad', 'Telangana');
    } finally {
      setIsDetecting(false);
    }
  };

  // Main Detection Trigger (GPS Geolocation + IP Fallback)
  const handleDetectLocation = () => {
    setIsDetecting(true);
    setStatusMessage('Acquiring GPS location...');

    if (!('geolocation' in navigator)) {
      detectViaIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};

          const detectedCity = addr.city || addr.town || addr.municipality || addr.county || addr.district || addr.suburb || 'Hyderabad';
          const detectedState = addr.state || 'Telangana';

          matchAndSetCity(detectedCity, detectedState);
        } catch (err) {
          // Reverse geocoding failed, try IP lookup
          detectViaIP();
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        // Geolocation denied or timed out, use IP lookup fallback instantly
        console.warn('GPS Geolocation unavailable, falling back to IP location:', error);
        detectViaIP();
      },
      { timeout: 8000, enableHighAccuracy: false } // enableHighAccuracy: false speeds up desktop detection
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
                  addToast('City Selected', `Delivering to ${selected.name}, ${selected.state}.`, 'info');
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

          {/* Auto-Detect Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="px-3.5 py-2 rounded-xl bg-black text-white text-xs font-extrabold hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
            <span>{isDetecting ? 'Detecting Location...' : 'Auto-Detect Location'}</span>
          </button>

          {/* Request City Unlisted Modal Trigger */}
          <button
            onClick={() => setShowAddCityModal(true)}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-bold hover:border-black text-black transition-all flex items-center gap-1 cursor-pointer"
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
        <div className="max-w-7xl mx-auto mt-2.5 p-3 bg-white border border-neutral-200 rounded-2xl text-xs font-bold text-black flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-black font-mono text-xs ml-4">
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
