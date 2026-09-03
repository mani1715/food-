import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Navigation, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { AddCityModal } from './modals/AddCityModal';

export const LocationDetectorBar: React.FC = () => {
  const { deliveryCities, addDeliveryCity, currentLocation, setCurrentLocation, addToast } = useApp();

  const [isDetecting, setIsDetecting] = useState(false);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Helper: Match detected city against deliveryCities or dynamically auto-register exact city
  const setExactLocation = (rawCity: string, rawState: string) => {
    const cleanCity = rawCity.trim();
    const cleanState = rawState.trim() || 'Andhra Pradesh';

    if (!cleanCity) return false;

    // Check if exact city exists in deliveryCities list (case-insensitive)
    let matchedCity = deliveryCities.find(
      (c) =>
        c.name.toLowerCase() === cleanCity.toLowerCase() ||
        cleanCity.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(cleanCity.toLowerCase())
    );

    // If city not found, dynamically add it to active delivery cities!
    if (!matchedCity) {
      addDeliveryCity({
        name: cleanCity,
        state: cleanState,
        charge: 59,
        freeDeliveryThreshold: 750,
        enabled: true,
      });
      matchedCity = {
        id: `city-auto-${Date.now()}`,
        name: cleanCity,
        state: cleanState,
        charge: 59,
        freeDeliveryThreshold: 750,
        enabled: true,
      };
    }

    setCurrentLocation({
      id: `loc-${matchedCity.id}`,
      label: 'Exact Detected Location',
      address: `${matchedCity.name}, ${matchedCity.state}`,
      city: matchedCity.name,
      pincode: '500001',
    });

    setStatusMessage(`📍 Location detected: ${matchedCity.name}, ${matchedCity.state}! Showing products with delivery fee $${matchedCity.charge}.`);
    addToast('Location Detected!', `Delivering to ${matchedCity.name}, ${matchedCity.state}.`, 'success');
    return true;
  };

  // IP Geolocation Fallback
  const detectViaIP = async () => {
    try {
      setStatusMessage('Querying IP location lookup...');
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();

      if (data && data.success) {
        const city = data.city || data.region || 'Vijayawada';
        const region = data.region || 'Andhra Pradesh';
        setExactLocation(city, region);
      } else {
        const res2 = await fetch('https://ipapi.co/json/');
        const data2 = await res2.json();
        const city2 = data2.city || 'Vijayawada';
        const region2 = data2.region || 'Andhra Pradesh';
        setExactLocation(city2, region2);
      }
    } catch (err) {
      setExactLocation('Vijayawada', 'Andhra Pradesh');
    } finally {
      setIsDetecting(false);
    }
  };

  // Main Detection Trigger (High Precision GPS + Reverse Geocoding)
  const handleDetectLocation = () => {
    setIsDetecting(true);
    setStatusMessage('Acquiring high-precision GPS location...');

    if (!('geolocation' in navigator)) {
      detectViaIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          console.log('📍 High-precision GPS coordinates:', latitude, longitude);

          // High Precision reverse geocoding with zoom=18 & addressdetails=1
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const addr = data.address || {};
          console.log('🗺️ Detailed location address:', addr);

          const rawCity =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.county ||
            addr.district ||
            addr.state_district ||
            (data.display_name ? data.display_name.split(',')[0] : '');

          const rawState = addr.state || 'Andhra Pradesh';

          if (rawCity) {
            setExactLocation(rawCity, rawState);
          } else {
            detectViaIP();
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          detectViaIP();
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.warn('GPS position error or permission denied:', error);
        detectViaIP();
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
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
