import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Star, ShieldCheck, MessageCircle } from 'lucide-react';

export const ChefReviewsPage: React.FC = () => {
  const { chefs } = useApp();
  const currentChef = chefs[0];

  const [starFilter, setStarFilter] = useState<number>(0);

  const reviewsList = currentChef.reviews || [];

  const filtered = reviewsList.filter((r) => starFilter === 0 || r.rating === starFilter);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Feedback</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Chef Reviews & Ratings</h1>
      </div>

      {/* Overall Score Banner */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-subtle">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-black text-white flex items-center justify-center font-extrabold text-3xl font-mono">
            {currentChef.rating}
          </div>
          <div>
            <h3 className="text-xl font-bold text-black">Average Rating Score</h3>
            <p className="text-xs text-neutral-500">Based on {currentChef.reviewsCount} verified customer orders</p>
          </div>
        </div>

        {/* Star Rating Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                starFilter === s ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'
              }`}
            >
              {s === 0 ? 'All Reviews' : `${s} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="space-y-4">
        {filtered.map((rev) => (
          <div key={rev.id} className="p-6 rounded-3xl border border-neutral-200 bg-white space-y-3 shadow-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={rev.userAvatar} alt={rev.userName} className="w-10 h-10 rounded-full object-cover border border-neutral-200" />
                <div>
                  <h4 className="text-sm font-bold text-black">{rev.userName}</h4>
                  <p className="text-[11px] text-neutral-400">{rev.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-extrabold text-black font-mono">
                <Star className="w-4 h-4 fill-black text-black" />
                <span>{rev.rating}.0</span>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed font-medium">"{rev.comment}"</p>

            {rev.chefReply && (
              <div className="p-3 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs space-y-1">
                <p className="font-bold text-black text-[11px]">Kitchen Response from {currentChef.name}:</p>
                <p className="text-neutral-600 italic">{rev.chefReply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
