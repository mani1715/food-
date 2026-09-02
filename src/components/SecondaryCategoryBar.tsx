import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SecondaryCategoryBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'All';
  const currentDietary = searchParams.get('dietary') || 'All';

  const categoryChips = [
    { label: 'All', path: '/products' },
    { label: 'Veg', path: '/products?dietary=Veg', isDietary: true, value: 'Veg' },
    { label: 'Non-Veg', path: '/products?dietary=Non-Veg', isDietary: true, value: 'Non-Veg' },
    { label: 'Pickles', path: '/products?category=Pickles', value: 'Pickles' },
    { label: 'Sweets', path: '/products?category=Sweets', value: 'Sweets' },
    { label: 'Snacks', path: '/products?category=Snacks', value: 'Snacks' },
    { label: 'Bakery', path: '/products?category=Bakery', value: 'Bakery' },
    { label: 'Gift Boxes', path: '/products?category=Gift%20Boxes', value: 'Gift Boxes' },
    { label: 'Festival Specials', path: '/products?category=Gift%20Boxes', value: 'Gift Boxes' },
  ];

  return (
    <div className="bg-neutral-50 border-b border-neutral-200 sticky top-20 z-30 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400 shrink-0 mr-2 hidden sm:inline">
          Quick Browse:
        </span>

        {categoryChips.map((chip, idx) => {
          let isSelected = false;
          if (chip.label === 'All') {
            isSelected = currentCategory === 'All' && currentDietary === 'All';
          } else if (chip.isDietary) {
            isSelected = currentDietary.toLowerCase() === chip.value?.toLowerCase();
          } else {
            isSelected = currentCategory.toLowerCase() === chip.value?.toLowerCase();
          }

          return (
            <button
              key={`${chip.label}-${idx}`}
              onClick={() => navigate(chip.path)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                isSelected
                  ? 'bg-black text-white border-black shadow-subtle scale-105'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black hover:bg-neutral-100'
              }`}
            >
              {chip.label === 'Veg' && <span className="text-emerald-700 mr-1 font-black">●</span>}
              {chip.label === 'Non-Veg' && <span className="text-rose-700 mr-1 font-black">▲</span>}
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
