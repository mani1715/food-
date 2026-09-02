import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Star, Clock, Flame, ShieldCheck, Heart, Share2, Plus, Minus, ArrowLeft, ArrowRight, Award, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FoodDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { dishes, chefs, addToCart, toggleFavoriteDish, favoriteDishIds, addToast } = useApp();

  const dish = dishes.find((d) => d.id === id) || dishes[0];
  const chef = chefs.find((c) => c.id === dish.chefId) || chefs[0];
  const isFav = favoriteDishIds.includes(dish.id);

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const gallery = dish.gallery && dish.gallery.length > 0 ? dish.gallery : [dish.image];

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link Copied', 'Dish link copied to clipboard!');
    } else {
      addToast('Share Dish', `Share "${dish.name}" with friends!`);
    }
  };

  const handleBuyNow = () => {
    addToCart(dish, quantity);
    navigate('/checkout');
  };

  const moreFromChef = dishes.filter((d) => (d.chefId === chef.id || d.chefName === chef.name) && d.id !== dish.id);
  const similarDishes = dishes.filter((d) => d.category === dish.category && d.id !== dish.id);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left pb-24 lg:pb-12">
      
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black text-neutral-700 hover:text-black transition-colors"
            title="Share Dish"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleFavoriteDish(dish.id)}
            className={`p-2.5 rounded-2xl border transition-colors ${
              isFav ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black text-black'
            }`}
            title="Save to Favorites"
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Selected Image */}
          <div
            onClick={() => setShowLightbox(true)}
            className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-neutral-100 border border-neutral-200 shadow-modal cursor-pointer group"
          >
            <img
              src={gallery[activeImageIndex]}
              alt={dish.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Click for Lightbox View
            </div>
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold text-black shadow-subtle">
              {activeImageIndex + 1} / {gallery.length} Photos
            </div>
          </div>

          {/* Thumbnails list */}
          {gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative rounded-2xl overflow-hidden w-20 h-20 border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-black scale-105 shadow-subtle' : 'border-neutral-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Chef Mini Profile Card */}
          <div
            onClick={() => navigate(`/chef/${chef.id}`)}
            className="p-5 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-black cursor-pointer transition-all shadow-subtle flex items-center justify-between gap-4 mt-6"
          >
            <div className="flex items-center gap-4">
              <img src={chef.avatar} alt={chef.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-subtle" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-black">{chef.name}</h4>
                  <span className="text-[10px] bg-black text-white font-bold px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{chef.location}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-black mt-1">
                  <Star className="w-3.5 h-3.5 fill-black text-black" />
                  <span>{chef.rating} ({chef.reviewsCount} reviews)</span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400" />
          </div>
        </div>

        {/* Right Column: Dish Information & Actions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Category & Tags */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest bg-neutral-100 text-black px-3 py-1 rounded-full border border-neutral-200">
              {dish.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${dish.isVeg ? 'bg-emerald-800' : 'bg-rose-800'}`}>
              {dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
            </span>
          </div>

          {/* Headline & Price */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight leading-tight">
              {dish.name}
            </h1>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl font-extrabold font-mono text-black">${dish.price.toFixed(2)}</span>
              {dish.originalPrice && (
                <span className="text-base text-neutral-400 line-through font-mono">
                  ${dish.originalPrice.toFixed(2)}
                </span>
              )}
              <span className="text-xs text-neutral-500 font-semibold">Taxes included</span>
            </div>
          </div>

          {/* Portion & Prep Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 uppercase font-bold">Portion Size</p>
              <p className="text-xs font-bold text-black mt-0.5">{dish.portionSize}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 uppercase font-bold">Prep Time</p>
              <p className="text-xs font-bold text-black mt-0.5">{dish.prepTime}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] text-neutral-400 uppercase font-bold">Calories</p>
              <p className="text-xs font-bold text-black mt-0.5">{dish.calories ? `${dish.calories} kcal` : 'Fresh Homemade'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">About This Dish</h3>
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              {dish.description}
            </p>
          </div>

          {/* Ingredients List */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">Fresh Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {dish.ingredients.map((ing) => (
                <span key={ing} className="text-xs font-semibold bg-white border border-neutral-300 text-black px-3 py-1 rounded-xl shadow-subtle">
                  ✓ {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Dietary Info */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">Dietary Standards</h3>
            <div className="flex flex-wrap gap-2">
              {dish.dietaryInfo.map((d) => (
                <span key={d} className="text-xs font-semibold bg-neutral-100 text-neutral-800 px-3 py-1 rounded-xl">
                  • {d}
                </span>
              ))}
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="pt-6 border-t border-neutral-200 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Quantity</span>
              <div className="flex items-center gap-3 bg-neutral-100 border border-neutral-300 rounded-2xl px-3 py-1.5 shadow-subtle">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:bg-neutral-200 rounded text-black font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-extrabold font-mono text-black min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:bg-neutral-200 rounded text-black font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:grid grid-cols-2 gap-4">
              <button
                onClick={() => addToCart(dish, quantity)}
                className="py-4 bg-white border-2 border-black text-black text-sm font-extrabold rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add To Order Basket</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="py-4 bg-black text-white text-sm font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-elevated active:scale-95"
              >
                <span>Buy Now (${(dish.price * quantity).toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* More from Chef */}
      {moreFromChef.length > 0 && (
        <section className="mt-16 pt-12 border-t border-neutral-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Chef Kitchen Specialties</span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight mt-1">
                More From {chef.name}
              </h2>
            </div>
            <button
              onClick={() => navigate(`/chef/${chef.id}`)}
              className="text-xs font-bold text-black hover:underline flex items-center gap-1"
            >
              <span>View Kitchen Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {moreFromChef.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/food/${item.id}`)}
                className="p-4 rounded-3xl border border-neutral-200 bg-white hover:border-black transition-all cursor-pointer shadow-subtle flex items-center gap-4"
              >
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-black truncate">{item.name}</h4>
                  <p className="text-xs font-extrabold text-black mt-1">${item.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="mt-16 pt-12 border-t border-neutral-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Verified Customer Feedback</span>
            <h2 className="text-2xl font-extrabold text-black tracking-tight mt-1">
              Ratings & Reviews ({dish.reviewsCount || 184})
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 px-4 py-2 rounded-2xl">
            <Star className="w-5 h-5 fill-black text-black" />
            <span className="text-lg font-extrabold font-mono text-black">{dish.rating} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(dish.reviews || []).map((rev) => (
            <div key={rev.id} className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50/50 space-y-3">
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
              <p className="text-xs text-neutral-600 leading-relaxed font-medium">"{rev.comment}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-6 right-6 p-3 bg-white text-black rounded-full"
            >
              ✕
            </button>
            <img
              src={gallery[activeImageIndex]}
              alt={dish.name}
              className="max-w-4xl max-h-[80vh] object-contain rounded-2xl shadow-modal"
            />
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Bottom Purchase Bar */}
      <div className="sm:hidden fixed bottom-14 left-0 right-0 z-40 bg-white border-t border-neutral-200 p-3 flex items-center justify-between gap-3 shadow-modal">
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase">Total Price</span>
          <p className="text-lg font-extrabold font-mono text-black">${(dish.price * quantity).toFixed(2)}</p>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <button
            onClick={() => addToCart(dish, quantity)}
            className="py-3 px-4 bg-white border border-black text-black text-xs font-extrabold rounded-2xl"
          >
            Add
          </button>
          <button
            onClick={handleBuyNow}
            className="py-3 px-5 bg-black text-white text-xs font-extrabold rounded-2xl shadow-subtle"
          >
            Buy Now
          </button>
        </div>
      </div>

    </div>
  );
};
