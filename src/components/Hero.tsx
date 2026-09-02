import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative bg-neutral-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-neutral-800">
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 text-left">
        
        {/* Left Column: Heading & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-xs font-bold tracking-wider uppercase text-neutral-300">
            <Sparkles className="w-4 h-4 text-white" />
            <span>100% Homemade • Pure Ghee & Cold-Pressed Oils</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.08]">
            Authentic Homemade <span className="underline decoration-neutral-600 underline-offset-8">Pickles</span> & Traditional Sweets.
          </h1>

          <p className="text-base sm:text-lg text-neutral-400 font-normal leading-relaxed max-w-2xl">
            Taste the timeless heritage of traditional Andhra pickles, pure ghee sweets, crispy savories, and artisanal gift hampers made with heirloom recipes.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 bg-white text-black font-extrabold text-sm rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-modal"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/products?category=Pickles')}
              className="px-8 py-4 bg-neutral-900 border border-neutral-800 text-white font-bold text-sm rounded-2xl hover:border-white transition-all flex items-center justify-center gap-2"
            >
              <span>Shop Pickles Collection</span>
            </button>
          </div>

          {/* Quick Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-neutral-900 text-xs text-neutral-400 font-semibold">
            <div>
              <span className="text-white font-extrabold block text-sm">No Preservatives</span>
              <span>100% Natural Recipe</span>
            </div>
            <div>
              <span className="text-white font-extrabold block text-sm">Fresh Batch Daily</span>
              <span>Hygienic Home Kitchens</span>
            </div>
            <div>
              <span className="text-white font-extrabold block text-sm">Express Delivery</span>
              <span>Thermal Sealed Jars</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Card */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl overflow-hidden border border-neutral-800 shadow-modal aspect-[4/5] bg-neutral-900 group">
            <img
              src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1000&auto=format&fit=crop"
              alt="Handcrafted Homemade Pickles"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-black/80 backdrop-blur-md border border-neutral-800 space-y-2 text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">Featured Special</span>
              <h3 className="text-xl font-bold text-white">Grandma's Avakaya Mango Pickle</h3>
              <p className="text-xs text-neutral-300 line-clamp-1">Cut raw mangoes pickled with Guntur red chilies & sesame oil.</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-lg font-mono font-extrabold text-white">$9.99 / 500g</span>
                <button
                  onClick={() => navigate('/product/prod-1')}
                  className="px-4 py-2 bg-white text-black text-xs font-extrabold rounded-xl"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
