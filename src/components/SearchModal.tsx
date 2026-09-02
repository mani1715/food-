import React, { useState } from 'react';
import { Search, X, TrendingUp, History, Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { products } = useApp();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');

  const recentSearches = ['Avakaya Mango Pickle', 'Kaju Katli', 'Gongura Pickle', 'Pure Ghee Mysore Pak', 'Diwali Gift Box'];
  const popularSearches = ['Avakaya Pickle', 'Ghee Sweets', 'Non-Veg Pickles', 'Murukku', 'Gift Hampers', 'Kandi Podi'];

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelectSearch = (term: string) => {
    setQuery(term);
    navigate(`/products?search=${encodeURIComponent(term)}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full p-6 shadow-modal space-y-6 text-left"
        >
          {/* Top Search Input */}
          <div className="relative border-b border-neutral-200 pb-4">
            <Search className="w-5 h-5 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pickles, sweets, snacks, bakery, gift boxes..."
              className="w-full pl-11 pr-10 py-2.5 text-sm font-bold text-black focus:outline-none bg-transparent"
            />
            <button onClick={onClose} className="absolute right-3 top-3 text-neutral-400 hover:text-black">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results or Suggestions */}
          {query.trim() ? (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                Matching Products ({filtered.length})
              </span>

              {filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No products found for "{query}". Try searching for pickles, sweets, or gift hampers.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        navigate(`/product/${prod.id}`);
                        onClose();
                      }}
                      className="p-3 rounded-2xl border border-neutral-200 hover:border-black cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold text-black group-hover:underline">{prod.name}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">{prod.category} • {prod.defaultWeight}</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold font-mono text-black">${prod.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Popular Searches */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
                  <TrendingUp className="w-4 h-4 text-black" />
                  <span>Popular Product Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSearch(term)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-black text-xs font-bold text-black transition-all"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
                  <History className="w-4 h-4 text-black" />
                  <span>Recent Searches</span>
                </div>
                <div className="space-y-1.5">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSelectSearch(term)}
                      className="w-full text-left py-2 px-3 rounded-xl hover:bg-neutral-100 text-xs font-semibold text-neutral-700 flex items-center justify-between"
                    >
                      <span>{term}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
