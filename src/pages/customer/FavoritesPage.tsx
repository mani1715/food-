import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Star, ArrowRight, Trash2 } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const FavoritesPage: React.FC = () => {
  const { dishes, chefs, favoriteDishIds, favoriteChefIds, toggleFavoriteDish, toggleFavoriteChef, addToCart } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'dishes' | 'chefs'>('dishes');

  const favoriteDishes = dishes.filter((d) => favoriteDishIds.includes(d.id));
  const favoriteChefs = chefs.filter((c) => favoriteChefIds.includes(c.id));

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      <div className="mb-8 border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Wishlist Collection</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Saved Favorites</h1>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 border border-neutral-200 rounded-2xl mb-8 max-w-md">
        <button
          onClick={() => setActiveTab('dishes')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'dishes' ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
          }`}
        >
          Dishes ({favoriteDishes.length})
        </button>
        <button
          onClick={() => setActiveTab('chefs')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'chefs' ? 'bg-black text-white shadow-subtle' : 'text-neutral-600 hover:text-black'
          }`}
        >
          Home Chefs ({favoriteChefs.length})
        </button>
      </div>

      {/* Tab 1: Favorite Dishes */}
      {activeTab === 'dishes' && (
        favoriteDishes.length === 0 ? (
          <EmptyState
            type="favorites"
            title="No Saved Dishes Yet"
            description="Tap the heart icon on any dish card to bookmark your favorite home meals."
            onAction={() => navigate('/explore')}
            actionLabel="Discover Dishes"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteDishes.map((dish) => (
              <div key={dish.id} className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 bg-neutral-100 cursor-pointer" onClick={() => navigate(`/food/${dish.id}`)}>
                  <img src={dish.image} alt={dish.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <button
                    onClick={() => toggleFavoriteDish(dish.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black text-white"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                  </button>
                </div>

                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 onClick={() => navigate(`/food/${dish.id}`)} className="text-base font-bold text-black line-clamp-1 cursor-pointer hover:underline">
                      {dish.name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium">{dish.chefName}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-base font-extrabold font-mono text-black">${dish.price.toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(dish)}
                      className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-subtle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab 2: Favorite Chefs */}
      {activeTab === 'chefs' && (
        favoriteChefs.length === 0 ? (
          <EmptyState
            type="favorites"
            title="No Saved Home Chefs"
            description="Tap the heart icon on any chef profile to follow your favorite neighborhood cooks."
            onAction={() => navigate('/explore')}
            actionLabel="Discover Chefs"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteChefs.map((chef) => (
              <div key={chef.id} className="p-5 rounded-3xl border border-neutral-200 bg-white shadow-subtle hover:border-black transition-all space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={chef.avatar} alt={chef.name} className="w-12 h-12 rounded-full object-cover border border-neutral-200" />
                    <div>
                      <h4 className="text-base font-bold text-black">{chef.name}</h4>
                      <p className="text-xs text-neutral-500">{chef.location}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleFavoriteChef(chef.id)} className="p-2 text-rose-500">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1 font-bold text-black">
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                    <span>{chef.rating} ({chef.reviewsCount})</span>
                  </div>
                  <button
                    onClick={() => navigate(`/chef/${chef.id}`)}
                    className="flex items-center gap-1 text-xs font-bold text-black hover:underline"
                  >
                    <span>View Kitchen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
};
