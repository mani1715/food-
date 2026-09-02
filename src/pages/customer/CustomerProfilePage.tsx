import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, MapPin, Edit2, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerProfilePage: React.FC = () => {
  const { userProfile, updateUserProfile, wishlistProductIds, orders, addToast } = useApp();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [phone, setPhone] = useState(userProfile.phone);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email, phone });
    setIsEditing(false);
  };

  const menuOptions = [
    { label: 'My Orders', icon: <ShoppingBag className="w-5 h-5 text-black" />, sub: `${orders.length} Past Orders`, action: () => navigate('/orders') },
    { label: 'Wishlist', icon: <Heart className="w-5 h-5 text-black" />, sub: `${wishlistProductIds.length} Saved Products`, action: () => navigate('/wishlist') },
    { label: 'Delivery Addresses', icon: <MapPin className="w-5 h-5 text-black" />, sub: 'Manage Home & Office Addresses', action: () => navigate('/cart') },
  ];

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-left space-y-8">
      
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
          className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-bold rounded-2xl flex items-center gap-2 shadow-subtle"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Menu Options Grid */}
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

      {/* Logout */}
      <div className="pt-4 border-t border-neutral-200">
        <button
          onClick={() => {
            addToast('Signed Out', 'Signed out of account.', 'info');
            navigate('/');
          }}
          className="w-full py-4 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-neutral-300"
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
                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  Save Changes
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
