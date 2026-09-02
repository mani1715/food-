import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Star, MapPin, Award, Heart, Share2, Plus, ArrowLeft, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChefProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chefs, dishes, addToCart, toggleFavoriteChef, favoriteChefIds, addToast } = useApp();

  const chef = chefs.find((c) => c.id === id) || chefs[0];
  const isFav = favoriteChefIds.includes(chef.id);

  const [activeTab, setActiveTab] = useState<'menu' | 'about' | 'reviews'>('menu');

  const chefDishes = dishes.filter((d) => d.chefId === chef.id || d.chefName === chef.name);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link Copied', `Chef ${chef.name}'s profile link copied!`);
    } else {
      addToast('Share Profile', `Share Chef ${chef.name}'s profile!`);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Chefs</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black text-neutral-700 hover:text-black transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFavoriteChef(chef.id)}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isFav ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black text-black'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cover Image & Profile Header Card */}
      <div className="bg-white border border-neutral-200 rounded-4xl overflow-hidden shadow-modal mb-8">
        {/* Cover Photo */}
        <div className="relative aspect-[21/7] bg-neutral-900 overflow-hidden">
          <img
            src={chef.coverImage}
            alt={chef.name}
            className="w-full h-full object-cover opacity-80 grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 sm:p-8 relative pt-0 -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <img
              src={chef.avatar}
              alt={chef.name}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-modal shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">{chef.name}</h1>
                <span className="text-[10px] bg-black text-white font-bold px-2.5 py-0.5 rounded-full">
                  ✓ Verified Master Chef
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                <div className="flex items-center gap-1 text-black font-bold">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{chef.location}</span>
                </div>
                <span>•</span>
                <span className="font-bold text-black">{chef.experienceYears} Years Experience</span>
              </div>
            </div>
          </div>

          {/* Overall Rating Pill */}
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-2xl self-stretch sm:self-auto justify-between">
            <div className="flex items-center gap-1 font-extrabold text-lg text-black font-mono">
              <Star className="w-5 h-5 fill-black text-black" />
              <span>{chef.rating}</span>
            </div>
            <span className="text-xs text-neutral-500 font-semibold">({chef.reviewsCount} reviews)</span>
          </div>
        </div>

        {/* Cuisine Specialties Badges */}
        <div className="px-6 sm:px-8 pb-6 flex flex-wrap gap-2">
          {chef.badges.map((badge) => (
            <span key={badge} className="text-xs font-semibold bg-neutral-100 border border-neutral-200 text-black px-3 py-1 rounded-xl">
              ✓ {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-neutral-200 mb-8 gap-8">
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            activeTab === 'menu' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-black'
          }`}
        >
          Daily Menu ({chefDishes.length})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            activeTab === 'about' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-black'
          }`}
        >
          About The Chef
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 text-sm font-extrabold transition-all relative ${
            activeTab === 'reviews' ? 'text-black border-b-2 border-black' : 'text-neutral-400 hover:text-black'
          }`}
        >
          Customer Reviews ({chef.reviewsCount})
        </button>
      </div>

      {/* Tab 1: Menu Section */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Freshly Prepared Today By {chef.name}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {chefDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group"
              >
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 bg-neutral-100 cursor-pointer" onClick={() => navigate(`/food/${dish.id}`)}>
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>

                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 onClick={() => navigate(`/food/${dish.id}`)} className="text-base font-bold text-black line-clamp-1 cursor-pointer hover:underline">
                      {dish.name}
                    </h4>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{dish.description}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between mt-3">
                    <p className="text-lg font-extrabold font-mono text-black">${dish.price.toFixed(2)}</p>
                    <button
                      onClick={() => addToCart(dish)}
                      className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 flex items-center gap-1 shadow-subtle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: About Section */}
      {activeTab === 'about' && (
        <div className="max-w-3xl space-y-8 bg-neutral-50 border border-neutral-200 rounded-3xl p-8 shadow-subtle">
          <div className="space-y-3">
            <h3 className="text-xl font-extrabold text-black">Chef Bio & Heritage</h3>
            <p className="text-sm text-neutral-700 leading-relaxed font-normal">
              {chef.about || chef.bio}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-neutral-400">Kitchen Location</p>
              <p className="text-sm font-bold text-black">{chef.location}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-neutral-400">Operating Schedule</p>
              <p className="text-sm font-bold text-black">{chef.schedule?.dailyHours || '10:00 AM - 09:30 PM'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Reviews Section */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(chef.reviews || []).map((rev) => (
              <div key={rev.id} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={rev.userAvatar} alt={rev.userName} className="w-10 h-10 rounded-full object-cover border border-white" />
                    <div>
                      <h5 className="text-sm font-bold text-black">{rev.userName}</h5>
                      <p className="text-[11px] text-neutral-400">{rev.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-xs text-black">
                    <Star className="w-4 h-4 fill-black text-black" />
                    <span>{rev.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed font-medium">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
