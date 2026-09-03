import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, WeightOption } from '../../types';
import { Plus, Edit2, Trash2, Search, X, Check, Star, Tag, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ProductsManagementTab: React.FC = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct, toggleProductBestSeller, toggleProductFestival } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Pickles');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop');
  const [newIsVeg, setNewIsVeg] = useState(true);
  const [newWeightOptions, setNewWeightOptions] = useState<WeightOption[]>([
    { weight: '250g', price: 5.99 },
    { weight: '400g', price: 8.49 },
    { weight: '500g', price: 9.99 },
    { weight: '1kg', price: 17.99 },
  ]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Weight Option Helpers for Add Form
  const handleAddWeightRow = (setWeightOpts: React.Dispatch<React.SetStateAction<WeightOption[]>>) => {
    setWeightOpts((prev) => [...prev, { weight: '300g', price: 6.99 }]);
  };

  const handleUpdateWeightRow = (
    setWeightOpts: React.Dispatch<React.SetStateAction<WeightOption[]>>,
    index: number,
    field: 'weight' | 'price',
    value: any
  ) => {
    setWeightOpts((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt))
    );
  };

  const handleDeleteWeightRow = (
    setWeightOpts: React.Dispatch<React.SetStateAction<WeightOption[]>>,
    index: number
  ) => {
    setWeightOpts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addProduct({
      name: newName,
      category: newCategory,
      price: newWeightOptions[0]?.price || 9.99,
      rating: 5.0,
      reviewsCount: 1,
      image: newImage,
      description: newDescription || 'Fresh handcrafted homemade food item prepared with traditional ingredients.',
      weightOptions: newWeightOptions,
      defaultWeight: newWeightOptions[0]?.weight || '500g',
      isVeg: newIsVeg,
      isBestSeller: false,
      inventoryCount: 100,
      outOfStock: false,
      inStock: true,
    });

    setShowAddModal(false);
    setNewName('');
    setNewDescription('');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: editingProduct.category,
      description: editingProduct.description,
      isVeg: editingProduct.isVeg,
      weightOptions: editingProduct.weightOptions,
      price: editingProduct.weightOptions[0]?.price || editingProduct.price,
      inventoryCount: editingProduct.inventoryCount,
      outOfStock: editingProduct.outOfStock,
    });

    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Product Catalog & Weight Pricing</h2>
          <p className="text-xs text-neutral-500">Configure products, custom gram weight tiers (250g, 400g, 500g, 1kg) and prices.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setCategoryFilter('All')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer ${
              categoryFilter === 'All' ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.name)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer ${
                categoryFilter === c.name ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-extrabold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Dietary</th>
                <th className="py-3.5 px-4">Gram Weights & Cost</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-neutral-50/80 transition-colors">
                  
                  {/* Product Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
                      <div>
                        <p className="font-bold text-black">{prod.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {prod.isBestSeller && <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Best Seller</span>}
                          {prod.isFestival && <span className="bg-neutral-200 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">Festival Special</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 font-semibold text-neutral-700">{prod.category}</td>

                  {/* Dietary */}
                  <td className="py-3.5 px-4">
                    {prod.isVeg ? (
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">● Veg</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">▲ Non-Veg</span>
                    )}
                  </td>

                  {/* Weight Options */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                      {prod.weightOptions.map((w) => (
                        <span key={w.weight} className="bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md font-bold text-neutral-800">
                          {w.weight}: ${w.price.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4">
                    {prod.outOfStock ? (
                      <span className="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                    ) : (
                      <span className="text-xs font-bold text-black">{prod.inventoryCount || 100} units</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleProductBestSeller(prod.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          prod.isBestSeller ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-400 hover:text-black'
                        }`}
                        title="Toggle Best Seller"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleProductFestival(prod.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          prod.isFestival ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-400 hover:text-black'
                        }`}
                        title="Toggle Festival Special"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingProduct(prod)}
                        className="p-2 rounded-xl border border-neutral-200 hover:border-black text-black cursor-pointer"
                        title="Edit Product & Weights"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(prod.id)}
                        className="p-2 rounded-xl border border-neutral-200 hover:border-red-600 hover:text-red-600 text-neutral-400 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-black">Create Product & Set Gram Pricing</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Product Name</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Gongura Mutton Pickle" className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-3 rounded-2xl border border-neutral-300">
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Dietary Type</label>
                  <select value={newIsVeg ? 'veg' : 'non-veg'} onChange={(e) => setNewIsVeg(e.target.value === 'veg')} className="w-full p-3 rounded-2xl border border-neutral-300">
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Weight & Price Tier Editor */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-black" />
                    <span>Package Gram Weights & Cost Tiers</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddWeightRow(setNewWeightOptions)}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Gram Tier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newWeightOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.weight}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'weight', e.target.value)}
                        placeholder="e.g. 500g, 400g, 250g, 1kg"
                        className="w-1/2 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={opt.price}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'price', Number(e.target.value))}
                        placeholder="Cost ($)"
                        className="w-1/2 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                      />
                      {newWeightOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWeightRow(setNewWeightOptions, idx)}
                          className="p-2 text-neutral-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Brief product description..." className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer">
                Create & Publish Product
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-black">Edit Product & Gram Pricing: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Product Name</label>
                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Category</label>
                  <select value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })} className="w-full p-3 rounded-2xl border border-neutral-300">
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Out Of Stock Status</label>
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, outOfStock: !editingProduct.outOfStock })} className={`w-full p-3 rounded-2xl border ${editingProduct.outOfStock ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-neutral-50 text-black border-neutral-300'}`}>
                    {editingProduct.outOfStock ? 'Marked Out of Stock' : 'In Stock'}
                  </button>
                </div>
              </div>

              {/* Edit Package Gram Weights & Price Tiers */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-black" />
                    <span>Edit Package Gram Weights & Cost</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct({
                        ...editingProduct,
                        weightOptions: [...editingProduct.weightOptions, { weight: '400g', price: 8.49 }],
                      });
                    }}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-xl flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingProduct.weightOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.weight}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) =>
                              i === idx ? { ...o, weight: val } : o
                            ),
                          });
                        }}
                        placeholder="Weight (e.g. 500g, 400g)"
                        className="w-1/2 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={opt.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) =>
                              i === idx ? { ...o, price: val } : o
                            ),
                          });
                        }}
                        placeholder="Cost ($)"
                        className="w-1/2 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                      />
                      {editingProduct.weightOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct({
                              ...editingProduct,
                              weightOptions: editingProduct.weightOptions.filter((_, i) => i !== idx),
                            });
                          }}
                          className="p-2 text-neutral-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer">
                Save Changes & Publish
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};
