import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Edit2, Trash2, SwitchCamera, X, Image as ImageIcon } from 'lucide-react';
import { Dish } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

export const ChefMenuPage: React.FC = () => {
  const { dishes, addDish, updateDish, deleteDish, chefs } = useApp();
  const currentChef = chefs[0];

  const chefDishes = dishes.filter((d) => d.chefId === currentChef.id || d.chefName === currentChef.name);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('14.50');
  const [category, setCategory] = useState('Lunch');
  const [prepTime, setPrepTime] = useState('25 min');
  const [isVeg, setIsVeg] = useState(true);
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setName('');
    setPrice('14.50');
    setCategory('Lunch');
    setPrepTime('25 min');
    setIsVeg(true);
    setDescription('');
    setEditingDish(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setPrice(dish.price.toString());
    setCategory(dish.category);
    setPrepTime(dish.prepTime);
    setIsVeg(dish.isVeg);
    setDescription(dish.description);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDish) {
      updateDish({
        ...editingDish,
        name,
        price: parseFloat(price) || 12.0,
        category,
        prepTime,
        isVeg,
        description,
      });
    } else {
      addDish({
        name,
        price: parseFloat(price) || 12.0,
        category,
        prepTime,
        isVeg,
        description,
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Kitchen Operations</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Menu Management</h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {chefDishes.map((dish) => (
          <div
            key={dish.id}
            className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between"
          >
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 bg-neutral-100">
              <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
              <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded text-white ${dish.isVeg ? 'bg-emerald-800' : 'bg-rose-800'}`}>
                {dish.isVeg ? 'Veg' : 'Non-Veg'}
              </span>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-base font-bold text-black">{dish.name}</h4>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{dish.description}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-black mt-2">
                  <span>${dish.price.toFixed(2)}</span>
                  <span>•</span>
                  <span className="text-neutral-400 font-normal">{dish.prepTime}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 mt-3">
                <button
                  onClick={() => handleOpenEdit(dish)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => deleteDish(dish.id)}
                  className="p-2 text-neutral-400 hover:text-rose-600 border border-neutral-200 rounded-xl"
                  title="Delete dish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Dish Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 shadow-modal space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-black">
                  {editingDish ? 'Edit Dish Details' : 'Add New Food Item'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grandma's Avakaya Thali"
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
                    >
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Sweets">Sweets</option>
                      <option value="Pickles">Pickles</option>
                      <option value="Healthy Meals">Healthy Meals</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Prep Time</label>
                    <input
                      type="text"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="e.g. 25-30 min"
                      className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Dietary Type</label>
                    <button
                      type="button"
                      onClick={() => setIsVeg(!isVeg)}
                      className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all ${
                        isVeg ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-rose-900 text-white border-rose-900'
                      }`}
                    >
                      {isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Clay pot cooked Sona Masoori rice served with fresh homemade Avakaya..."
                    className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-bold"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle">
                  {editingDish ? 'Save Changes' : 'Add Dish To Menu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
