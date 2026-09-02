import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminCategoriesPage: React.FC = () => {
  const { categories, addToast } = useApp();

  const [categoriesList, setCategoriesList] = useState(categories);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop',
      description: description || 'Fresh home-cooked cuisine category.',
    };
    setCategoriesList([...categoriesList, newCat]);
    setShowModal(false);
    setName('');
    setDescription('');
    addToast('Category Created', `Category "${newCat.name}" is now live.`);
  };

  const handleDelete = (id: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
    addToast('Category Removed', 'Category deleted.', 'info');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-left space-y-8">
      
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Taxonomy & Catalog</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Category Management</h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesList.map((cat) => (
          <div key={cat.id} className="p-4 rounded-3xl border border-neutral-200 bg-white flex items-center gap-4 shadow-subtle hover:border-black transition-colors">
            <img src={cat.image} alt={cat.name} className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-black truncate">{cat.name}</h3>
              <p className="text-xs text-neutral-500 line-clamp-1">{cat.description}</p>
              <p className="text-[10px] font-mono text-neutral-400 mt-1">{cat.count} Available Dishes</p>
            </div>
            <button onClick={() => handleDelete(cat.id)} className="p-2 text-neutral-400 hover:text-rose-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-modal space-y-6 text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">Add Food Category</h3>
                <button onClick={() => setShowModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Category Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. South Indian Breakfast"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Fresh idlis, dosas, parathas..."
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  Save Category
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
