import React from 'react';
import { Chef } from '../types';
import { Star, MapPin, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeaturedChefsProps {
  chefs: Chef[];
  onViewChefMenu: (chef: Chef) => void;
  onToggleFavoriteChef: (chefId: string) => void;
  favoriteChefIds: string[];
}

export const FeaturedChefs: React.FC<FeaturedChefsProps> = ({
  chefs,
  onViewChefMenu,
  onToggleFavoriteChef,
  favoriteChefIds,
}) => {
  return (
    <section id="chefs" className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Master Culinary Artists</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-1">
              Meet Our Featured Home Chefs
            </h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-md">
            Passionate neighborhood culinary icons bringing authentic regional flavors & heirloom recipes to your doorstep.
          </p>
        </div>

        {/* Chefs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {chefs.map((chef, idx) => {
            const isFav = favoriteChefIds.includes(chef.id);
            return (
              <motion.div
                key={chef.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-neutral-50 border border-neutral-200 rounded-3xl p-5 shadow-subtle hover:shadow-elevated hover:bg-white hover:border-black transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Chef Bar */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={chef.avatar}
                        alt={chef.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-subtle"
                      />
                      <div>
                        <h3 className="text-base font-bold text-black group-hover:text-black leading-tight">
                          {chef.name}
                        </h3>
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span className="truncate max-w-[120px]">{chef.location}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavoriteChef(chef.id)}
                      className={`p-2 rounded-full border transition-colors ${
                        isFav
                          ? 'bg-black text-white border-black'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:text-black hover:border-black'
                      }`}
                      aria-label="Save chef"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Kitchen Portrait Image */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4 bg-neutral-200">
                    <img
                      src={chef.image}
                      alt={chef.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      {chef.experienceYears} Yrs Experience
                    </div>
                  </div>

                  {/* Rating & Bio Specialty */}
                  <div className="space-y-2 mb-6 text-left">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-black">
                        <Star className="w-4 h-4 fill-black text-black" />
                        <span>{chef.rating}</span>
                        <span className="text-neutral-400 font-normal">({chef.reviewsCount} reviews)</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase bg-neutral-200 px-2 py-0.5 rounded text-neutral-800">
                        {chef.dishesCount} Dishes
                      </span>
                    </div>

                    <p className="text-xs text-neutral-700 font-medium line-clamp-2">
                      <span className="font-bold text-black">Specialty: </span>
                      {chef.specialty}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onViewChefMenu(chef)}
                  className="w-full py-3 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-95"
                >
                  <span>View Full Kitchen Menu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
