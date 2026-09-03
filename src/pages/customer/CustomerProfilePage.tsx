import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, MapPin, Edit2, LogOut, X, Plus, Trash2, Home, Briefcase, CheckCircle2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerProfilePage: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    locations,
    addLocation,
    deleteLocation,
    currentLocation,
    setCurrentLocation,
    wishlistProductIds,
    orders,
    addToast,
  } = useApp();

  const navigate = useNavigate();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);

  // Address Add Modal State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newPincode, setNewPincode] = useState('500033');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, phone });
    setIsEditing(false);
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim() || !newCity.trim() || !newPincode.trim()) return;

    addLocation({
      label: newLabel,
      address: newAddress,
      city: newCity,
      pincode: newPincode,
    });

    setShowAddAddressModal(false);
    setNewAddress('');
  };

  const menuOptions = [
    { label: 'My Orders', icon: <ShoppingBag className="w-5 h-5 text-black" />, sub: `${orders.length} Past Orders`, action: () => navigate('/orders') },
    { label: 'Wishlist', icon: <Heart className="w-5 h-5 text-black" />, sub: `${wishlistProductIds.length} Saved Products`, action: () => navigate('/wishlist') },
    { label: 'Saved Addresses', icon: <MapPin className="w-5 h-5 text-black" />, sub: `${locations.length} Saved Locations`, action: () => {
      const addressSection = document.getElementById('saved-addresses-section');
      addressSection?.scrollIntoView({ behavior: 'smooth' });
    } },
  ];

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-10">
      
      {/* Profile Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img src={userProfile.avatar} alt={userProfile.name} className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-subtle shrink-0" />
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-black tracking-tight">{userProfile.name}</h1>
            <p className="text-xs text-neutral-500 font-mono">{userProfile.email} • {userProfile.phone}</p>
            <span className="inline-block text-[10px] bg-black text-white font-bold px-2.5 py-0.5 rounded-full mt-1">
              Member since {userProfile.joinedDate}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-2xl flex items-center gap-2 shadow-subtle cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Account Navigation Options */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Account Options</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {menuOptions.map((opt) => (
            <div
              key={opt.label}
              onClick={opt.action}
              className="p-5 rounded-3xl border border-neutral-200 bg-white hover:border-black cursor-pointer transition-all shadow-subtle space-y-2 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                {opt.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-black">{opt.label}</h4>
                <p className="text-xs text-neutral-500">{opt.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Delivery Addresses Section */}
      <div id="saved-addresses-section" className="space-y-4 pt-4 border-t border-neutral-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-black tracking-tight">Saved Delivery Addresses</h3>
            <p className="text-xs text-neutral-500">Manage your Home, Work, and alternate delivery addresses.</p>
          </div>

          <button
            onClick={() => setShowAddAddressModal(true)}
            className="px-3.5 py-2 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-subtle cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locations.map((loc) => {
            const isSelected = currentLocation.id === loc.id;
            return (
              <div
                key={loc.id}
                className={`bg-white border rounded-3xl p-5 shadow-subtle flex flex-col justify-between space-y-3 transition-all ${
                  isSelected ? 'border-black ring-2 ring-black/10' : 'border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {loc.label.toLowerCase() === 'home' ? (
                      <Home className="w-4 h-4 text-black" />
                    ) : loc.label.toLowerCase() === 'work' || loc.label.toLowerCase() === 'office' ? (
                      <Briefcase className="w-4 h-4 text-black" />
                    ) : (
                      <MapPin className="w-4 h-4 text-black" />
                    )}
                    <span className="text-xs font-extrabold text-black uppercase tracking-wider">{loc.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="text-[10px] bg-black text-white font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}

                    <button
                      onClick={() => deleteLocation(loc.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-black leading-snug">{loc.address}</p>
                  <p className="text-neutral-500 font-mono">{loc.city} — {loc.pincode}</p>
                </div>

                {!isSelected && (
                  <button
                    onClick={() => {
                      setCurrentLocation(loc);
                      addToast('Default Location Set', `Set ${loc.label} as active delivery address.`, 'info');
                    }}
                    className="w-full py-2 bg-neutral-50 border border-neutral-200 hover:border-black text-black text-xs font-bold rounded-xl transition-all"
                  >
                    Set as Active Delivery Location
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-neutral-200">
        <button
          onClick={() => {
            addToast('Signed Out', 'Signed out of account.', 'info');
            navigate('/');
          }}
          className="w-full py-4 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-neutral-300 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">Edit Customer Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle cursor-pointer">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Address Modal */}
      <AnimatePresence>
        {showAddAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-extrabold text-black">Add Saved Address</h3>
                <button onClick={() => setShowAddAddressModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAddressSubmit} className="space-y-4 text-xs font-bold">
                
                {/* Address Label Pills (Home, Work, Other) */}
                <div>
                  <label className="block text-neutral-500 mb-1">Address Label</label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                      <button
                        type="button"
                        key={lbl}
                        onClick={() => setNewLabel(lbl)}
                        className={`flex-1 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                          newLabel === lbl ? 'bg-black text-white border-black shadow-subtle' : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {lbl === 'Home' ? <Home className="w-3.5 h-3.5" /> : lbl === 'Work' ? <Briefcase className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        <span>{lbl}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Street Address / Flat / Door No.</label>
                  <input
                    type="text"
                    required
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Flat 302, Royal Palms, Road No 10"
                    className="w-full p-3 rounded-2xl border border-neutral-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-500 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="e.g. Hyderabad"
                      className="w-full p-3 rounded-2xl border border-neutral-300"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      placeholder="500033"
                      className="w-full p-3 rounded-2xl border border-neutral-300 font-mono"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle cursor-pointer">
                  Save Delivery Address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
