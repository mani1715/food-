import React from 'react';
import { ShoppingBag, Search, Heart, UtensilsCrossed } from 'lucide-react';

interface EmptyStateProps {
  type: 'cart' | 'search' | 'favorites' | 'filter';
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  onAction,
  actionLabel,
}) => {
  const getDefaults = () => {
    switch (type) {
      case 'cart':
        return {
          icon: <ShoppingBag className="w-12 h-12 stroke-[1.2]" />,
          title: title || 'Your Cart is Empty',
          description: description || 'Explore authentic home meals prepared by top verified neighborhood chefs.',
          actionLabel: actionLabel || 'Browse Menu',
        };
      case 'search':
        return {
          icon: <Search className="w-12 h-12 stroke-[1.2]" />,
          title: title || 'No Dishes or Chefs Found',
          description: description || 'Try searching for dishes like "Biryani", "Avakaya", "Sourdough", or chef names.',
          actionLabel: actionLabel || 'Clear Search',
        };
      case 'favorites':
        return {
          icon: <Heart className="w-12 h-12 stroke-[1.2]" />,
          title: title || 'No Saved Favorites Yet',
          description: description || 'Click the heart icon on any dish or chef card to save your favorite meals here.',
          actionLabel: actionLabel || 'Discover Food',
        };
      case 'filter':
      default:
        return {
          icon: <UtensilsCrossed className="w-12 h-12 stroke-[1.2]" />,
          title: title || 'No Items Match Selected Filter',
          description: description || 'Try switching category tabs or clearing dietary restrictions.',
          actionLabel: actionLabel || 'Reset Filters',
        };
    }
  };

  const config = getDefaults();

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-neutral-300 rounded-3xl bg-neutral-50/50">
      <div className="w-20 h-20 rounded-full bg-white border border-neutral-200 shadow-subtle flex items-center justify-center text-black mb-4">
        {config.icon}
      </div>
      <h3 className="text-xl font-bold text-black tracking-tight mb-2">{config.title}</h3>
      <p className="text-sm text-neutral-600 max-w-sm mb-6 leading-relaxed">
        {config.description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-semibold rounded-2xl hover:bg-neutral-800 transition-all shadow-subtle active:scale-95"
        >
          {config.actionLabel}
        </button>
      )}
    </div>
  );
};
