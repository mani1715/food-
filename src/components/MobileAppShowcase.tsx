import React from 'react';
import { Smartphone, Bell, Heart, MapPin } from 'lucide-react';

export const MobileAppShowcase: React.FC = () => {
  return (
    <section className="py-20 bg-white border-b border-neutral-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left: Feature Highlights */}
          <div className="lg:col-span-6 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <Smartphone className="w-4 h-4 text-black" />
              <span>Native iOS & Android App</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">
              Order Fresh Home Food Anywhere, Anytime.
            </h2>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
              Download the official Aura Mobile App for live kitchen prep streaming, express thermal delivery notifications, and exclusive subscriber meal discounts.
            </p>

            {/* Feature List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">Live Kitchen Prep Notifications</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Receive real-time alerts when your chef starts simmering your clay pot curry.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50">
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">One-Tap Reordering & Favorites</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">Bookmark your top neighborhood home cooks and reorder lunch in under 10 seconds.</p>
                </div>
              </div>
            </div>

            {/* Store Download Badges */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button className="px-6 py-3.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-3 shadow-subtle">
                <span className="text-lg"></span>
                <div className="text-left leading-tight">
                  <p className="text-[9px] uppercase font-medium text-neutral-400">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </button>

              <button className="px-6 py-3.5 bg-white text-black border border-neutral-300 text-xs font-bold rounded-2xl hover:bg-neutral-100 transition-all flex items-center gap-3 shadow-subtle">
                <span className="text-lg">▶</span>
                <div className="text-left leading-tight">
                  <p className="text-[9px] uppercase font-medium text-neutral-500">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>

          {/* Right: Modern SaaS Phone Mockup */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[9/18] bg-black rounded-[48px] p-4 shadow-modal border-4 border-neutral-900">
              
              {/* Phone Speaker Notch */}
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neutral-800" />
              </div>

              {/* Inner App Screen View */}
              <div className="w-full h-full bg-white rounded-[36px] overflow-hidden pt-10 px-4 pb-4 flex flex-col justify-between relative border border-neutral-200">
                {/* App Screen Header */}
                <div className="space-y-3 border-b border-neutral-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-bold text-black">
                      <MapPin className="w-3.5 h-3.5 text-black" />
                      <span>Jubilee Hills</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                      A
                    </div>
                  </div>
                  <div className="bg-neutral-100 rounded-xl p-2 text-[11px] text-neutral-500 text-left font-medium">
                    🔍 Search "Grandma Avakaya Thali"...
                  </div>
                </div>

                {/* App Screen Mock Body */}
                <div className="space-y-3 flex-1 overflow-hidden pt-3 text-left">
                  <div className="rounded-2xl overflow-hidden aspect-[16/9] relative">
                    <img
                      src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop"
                      alt="App Mockup"
                      className="w-full h-full object-cover grayscale"
                    />
                    <span className="absolute bottom-2 left-2 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      Featured Dish
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-black">
                      <span>Awadhi Mutton Biryani</span>
                      <span>$19.99</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">Prepared fresh by Chef Savitri Verma</p>
                  </div>
                </div>

                {/* App Screen Bottom Bar */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-around text-neutral-400 text-[10px] font-bold">
                  <span className="text-black">Home</span>
                  <span>Explore</span>
                  <span>Favorites</span>
                  <span>Cart</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
