import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift } from 'lucide-react';

export const FestivalCollections: React.FC = () => {
  const navigate = useNavigate();

  const collections = [
    {
      id: 'col-1',
      title: 'Diwali Special Hampers',
      subtitle: 'Pure Ghee Sweets & Crunch Combos',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
      tag: 'Festive Box',
    },
    {
      id: 'col-2',
      title: 'Sankranti Traditional Combos',
      subtitle: 'Bellam Ariselu & Fresh Pickles',
      image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800&auto=format&fit=crop',
      tag: 'Heritage Special',
    },
    {
      id: 'col-3',
      title: 'Wedding Return Gift Boxes',
      subtitle: 'Handcrafted Rigid Gift Boxes',
      image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop',
      tag: 'Bulk Orders Available',
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Celebration Specials</span>
          <h2 className="text-3xl font-extrabold text-black tracking-tight mt-1">Festival Collections & Gift Boxes</h2>
        </div>

        <button
          onClick={() => navigate('/products?category=Gift%20Boxes')}
          className="text-xs font-bold text-black hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Gift Boxes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collections.map((col) => (
          <div
            key={col.id}
            onClick={() => navigate('/products?category=Gift%20Boxes')}
            className="group relative rounded-3xl overflow-hidden border border-neutral-200 bg-black aspect-[4/3] cursor-pointer shadow-subtle hover:border-black transition-all"
          >
            <img
              src={col.image}
              alt={col.title}
              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
              <span className="self-start px-3 py-1 rounded-full bg-white text-black text-[10px] font-extrabold uppercase shadow-subtle flex items-center gap-1">
                <Gift className="w-3 h-3" />
                <span>{col.tag}</span>
              </span>

              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">{col.title}</h3>
                <p className="text-xs text-neutral-300">{col.subtitle}</p>
                <div className="pt-2 flex items-center gap-1 text-xs font-extrabold underline">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
