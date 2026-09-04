import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, WeightOption } from '../../types';
import { Plus, Edit2, Trash2, Search, X, Star, Tag, Scale, Image as ImageIcon, LayoutGrid, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductsManagementTab: React.FC = () => {
  const {
    products,
    categories,
    addCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductBestSeller,
    toggleProductNewArrival,
    toggleProductFestival,
    homeSections,
    updateHomeSection,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Pickles');
  const [newDescription, setNewDescription] = useState('');
  const [newImageInput, setNewImageInput] = useState('');
  const [newGallery, setNewGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop',
  ]);
  const [newIsVeg, setNewIsVeg] = useState(true);
  const [newIsBestSeller, setNewIsBestSeller] = useState(false);
  const [newIsNewArrival, setNewIsNewArrival] = useState(true);
  const [newIsFestival, setNewIsFestival] = useState(false);
  const [newSelectedSectionIds, setNewSelectedSectionIds] = useState<string[]>([]);

  const [newWeightOptions, setNewWeightOptions] = useState<WeightOption[]>([
    { weight: '250g', price: 169 },
    { weight: '400g', price: 249 },
    { weight: '500g', price: 299 },
    { weight: '1kg', price: 549 },
  ]);

  // Edit Product Extra State
  const [editGalleryInput, setEditGalleryInput] = useState('');
  const [editSelectedSectionIds, setEditSelectedSectionIds] = useState<string[]>([]);

  // Add New Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [targetModalForNewCategory, setTargetModalForNewCategory] = useState<'add' | 'edit'>('add');
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Open Add Product Modal with reset state
  const handleOpenAddModal = () => {
    setNewName('');
    setNewDescription('');
    setNewIsBestSeller(false);
    setNewIsNewArrival(true); // Default to New Arrival for freshly added products!
    setNewIsFestival(false);
    setNewCategory(categories[0]?.name || 'Pickles');
    setNewSelectedSectionIds(homeSections.map((s) => s.id));
    setShowAddModal(true);
  };

  // Open Edit Product Modal with populated state
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditGalleryInput('');
    const containingSecIds = homeSections
      .filter((s) => s.productIds.includes(prod.id))
      .map((s) => s.id);
    setEditSelectedSectionIds(containingSecIds);
  };

  // Weight Option Helpers
  const handleAddWeightRow = (setWeightOpts: React.Dispatch<React.SetStateAction<WeightOption[]>>) => {
    setWeightOpts((prev) => [...prev, { weight: '300g', price: 199 }]);
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

  // Create New Category Handler
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const createdCat = addCategory(newCatName.trim(), newCatImage.trim(), newCatDescription.trim());

    if (targetModalForNewCategory === 'add') {
      setNewCategory(createdCat.name);
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, category: createdCat.name });
    }

    setNewCatName('');
    setNewCatImage('');
    setNewCatDescription('');
    setShowAddCategoryModal(false);
  };

  // Add Product Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProdId = `prod-${Date.now()}`;
    const primaryImg = newGallery[0] || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop';

    addProduct({
      name: newName,
      category: newCategory,
      price: newWeightOptions[0]?.price || 299,
      rating: 5.0,
      reviewsCount: 1,
      image: primaryImg,
      gallery: newGallery,
      description: newDescription || 'Fresh handcrafted homemade food item prepared with traditional ingredients.',
      weightOptions: newWeightOptions,
      defaultWeight: newWeightOptions[0]?.weight || '500g',
      isVeg: newIsVeg,
      isBestSeller: newIsBestSeller,
      isNewArrival: newIsNewArrival,
      isFestival: newIsFestival,
      inventoryCount: 100,
      outOfStock: false,
      inStock: true,
    });

    // Assign new product to selected home showcase sections
    newSelectedSectionIds.forEach((secId) => {
      const sec = homeSections.find((s) => s.id === secId);
      if (sec && !sec.productIds.includes(newProdId)) {
        updateHomeSection(secId, {
          productIds: [...sec.productIds, newProdId],
        });
      }
    });

    setShowAddModal(false);
  };

  // Update Product Submit
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const primaryImg = editingProduct.gallery?.[0] || editingProduct.image;

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: editingProduct.category,
      description: editingProduct.description,
      image: primaryImg,
      gallery: editingProduct.gallery || [primaryImg],
      isVeg: editingProduct.isVeg,
      isBestSeller: editingProduct.isBestSeller,
      isNewArrival: editingProduct.isNewArrival,
      isFestival: editingProduct.isFestival,
      weightOptions: editingProduct.weightOptions,
      price: editingProduct.weightOptions[0]?.price || editingProduct.price,
      inventoryCount: editingProduct.inventoryCount,
      outOfStock: editingProduct.outOfStock,
    });

    // Update section memberships for this product
    homeSections.forEach((sec) => {
      const shouldInclude = editSelectedSectionIds.includes(sec.id);
      const isCurrentlyIncluded = sec.productIds.includes(editingProduct.id);

      if (shouldInclude && !isCurrentlyIncluded) {
        updateHomeSection(sec.id, {
          productIds: [...sec.productIds, editingProduct.id],
        });
      } else if (!shouldInclude && isCurrentlyIncluded) {
        updateHomeSection(sec.id, {
          productIds: sec.productIds.filter((pId) => pId !== editingProduct.id),
        });
      }
    });

    setEditingProduct(null);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Product Catalog & Categories</h2>
          <p className="text-xs text-neutral-500">Configure products, create new categories, choose homepage showcase collections & New Arrival flags.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTargetModalForNewCategory('add');
              setShowAddCategoryModal(true);
            }}
            className="px-3.5 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-extrabold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
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
                <th className="py-3.5 px-4">Product Info & Photos</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Dietary</th>
                <th className="py-3.5 px-4">Gram Weights & Cost (₹)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((prod) => {
                const photosCount = prod.gallery?.length || 1;
                return (
                  <tr key={prod.id} className="hover:bg-neutral-50/80 transition-colors">
                    
                    {/* Product Info & Photos Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-200" />
                          <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white" title={`${photosCount} Photos`}>
                            📷 {photosCount}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-black">{prod.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {prod.isBestSeller && <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Best Seller</span>}
                            {prod.isNewArrival && <span className="bg-neutral-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">✨ New Arrival</span>}
                            {prod.isFestival && <span className="bg-neutral-200 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">🎉 Festival</span>}
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
                            {w.weight}: ₹{w.price}
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
                      <div className="flex items-center justify-end gap-1.5">
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
                          onClick={() => toggleProductNewArrival(prod.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            prod.isNewArrival ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-400 hover:text-black'
                          }`}
                          title="Toggle New Arrival"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
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
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-2 rounded-xl border border-neutral-200 hover:border-black text-black cursor-pointer"
                          title="Edit Product & Section Assignments"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-black">Create Product & Assign Showcase Collections</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Product Name *</label>
                <input type="text" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Gongura Mutton Pickle" className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selector with Add New Category Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-500">Category *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetModalForNewCategory('add');
                        setShowAddCategoryModal(true);
                      }}
                      className="text-[10px] font-extrabold text-black hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW_CAT') {
                        setTargetModalForNewCategory('add');
                        setShowAddCategoryModal(true);
                      } else {
                        setNewCategory(e.target.value);
                      }
                    }}
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="ADD_NEW_CAT" className="font-extrabold text-black">
                      + Add New Category...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Dietary Type</label>
                  <select value={newIsVeg ? 'veg' : 'non-veg'} onChange={(e) => setNewIsVeg(e.target.value === 'veg')} className="w-full p-3 rounded-2xl border border-neutral-300 font-bold">
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* SHOWCASE COLLECTIONS & FEATURE FLAGS SELECTION */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-black" />
                  <span>Product Feature Flags & Homepage Showcases</span>
                </span>

                {/* 3 Checkboxes: Best Seller, New Arrival, Festival */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={newIsBestSeller}
                      onChange={(e) => setNewIsBestSeller(e.target.checked)}
                      className="accent-black w-4 h-4"
                    />
                    <span>⭐ Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={newIsNewArrival}
                      onChange={(e) => setNewIsNewArrival(e.target.checked)}
                      className="accent-black w-4 h-4"
                    />
                    <span>✨ New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={newIsFestival}
                      onChange={(e) => setNewIsFestival(e.target.checked)}
                      className="accent-black w-4 h-4"
                    />
                    <span>🎉 Festival Item</span>
                  </label>
                </div>

                {homeSections.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                      Assign to Homepage Showcase Collections (Select All That Apply)
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {homeSections.map((sec) => {
                        const isChecked = newSelectedSectionIds.includes(sec.id);
                        return (
                          <label
                            key={sec.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              isChecked ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewSelectedSectionIds([...newSelectedSectionIds, sec.id]);
                                  } else {
                                    setNewSelectedSectionIds(newSelectedSectionIds.filter((id) => id !== sec.id));
                                  }
                                }}
                                className="accent-black w-4 h-4"
                              />
                              <span>{sec.title}</span>
                            </div>
                            {sec.badge && (
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isChecked ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {sec.badge}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* MULTIPLE PRODUCT PHOTOS MANAGER */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>Product Photo Gallery ({newGallery.length} Photos)</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {newGallery.map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-neutral-300 bg-white">
                      <img src={imgUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && <span className="absolute top-1 left-1 bg-black text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">Main</span>}
                      <button
                        type="button"
                        onClick={() => setNewGallery(newGallery.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={newImageInput}
                    onChange={(e) => setNewImageInput(e.target.value)}
                    placeholder="Paste Photo URL (e.g. https://...)"
                    className="flex-1 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageInput.trim()) {
                        setNewGallery([...newGallery, newImageInput.trim()]);
                        setNewImageInput('');
                      }
                    }}
                    className="px-3 py-2 bg-black text-white text-xs font-extrabold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Weight & Price Tier Editor */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-black" />
                    <span>Package Gram Weights & Cost Tiers (₹)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddWeightRow(setNewWeightOptions)}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
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
                        value={opt.price}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'price', Number(e.target.value))}
                        placeholder="Cost (₹)"
                        className="w-1/2 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                      />
                      {newWeightOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWeightRow(setNewWeightOptions, idx)}
                          className="p-2 text-neutral-400 hover:text-rose-600 cursor-pointer"
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

              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer shadow-subtle">
                Create & Publish Product
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-modal text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-black">Edit Product & Showcase Assignments: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Product Name</label>
                <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selector with Add New Category Button */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-neutral-500">Category *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetModalForNewCategory('edit');
                        setShowAddCategoryModal(true);
                      }}
                      className="text-[10px] font-extrabold text-black hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW_CAT') {
                        setTargetModalForNewCategory('edit');
                        setShowAddCategoryModal(true);
                      } else {
                        setEditingProduct({ ...editingProduct, category: e.target.value });
                      }
                    }}
                    className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="ADD_NEW_CAT" className="font-extrabold text-black">
                      + Add New Category...
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Stock Status</label>
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, outOfStock: !editingProduct.outOfStock })} className={`w-full p-3 rounded-2xl border ${editingProduct.outOfStock ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-neutral-50 text-black border-neutral-300'}`}>
                    {editingProduct.outOfStock ? 'Marked Out of Stock' : 'In Stock'}
                  </button>
                </div>
              </div>

              {/* EDIT SHOWCASE COLLECTIONS & FEATURE FLAGS */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-black" />
                  <span>Homepage Showcase Collections & Feature Flags</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={editingProduct.isBestSeller || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                      className="accent-black w-4 h-4"
                    />
                    <span>⭐ Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={editingProduct.isNewArrival || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                      className="accent-black w-4 h-4"
                    />
                    <span>✨ New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFestival || false}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isFestival: e.target.checked })}
                      className="accent-black w-4 h-4"
                    />
                    <span>🎉 Festival Item</span>
                  </label>
                </div>

                {homeSections.length > 0 && (
                  <div className="pt-2 border-t border-neutral-200 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block">
                      Assign to Homepage Sections
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {homeSections.map((sec) => {
                        const isChecked = editSelectedSectionIds.includes(sec.id);
                        return (
                          <label
                            key={sec.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                              isChecked ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200 hover:border-black'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditSelectedSectionIds([...editSelectedSectionIds, sec.id]);
                                  } else {
                                    setEditSelectedSectionIds(editSelectedSectionIds.filter((id) => id !== sec.id));
                                  }
                                }}
                                className="accent-black w-4 h-4"
                              />
                              <span>{sec.title}</span>
                            </div>
                            {sec.badge && (
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isChecked ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {sec.badge}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* EDIT MULTIPLE PRODUCT PHOTOS MANAGER */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-black" />
                    <span>Product Photo Gallery ({(editingProduct.gallery || [editingProduct.image]).length} Photos)</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(editingProduct.gallery || [editingProduct.image]).map((imgUrl, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-neutral-300 bg-white">
                      <img src={imgUrl} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && <span className="absolute top-1 left-1 bg-black text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md">Main</span>}
                      <button
                        type="button"
                        onClick={() => {
                          const currentGal = editingProduct.gallery || [editingProduct.image];
                          const updatedGal = currentGal.filter((_, i) => i !== idx);
                          setEditingProduct({
                            ...editingProduct,
                            image: updatedGal[0] || editingProduct.image,
                            gallery: updatedGal.length > 0 ? updatedGal : [editingProduct.image],
                          });
                        }}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={editGalleryInput}
                    onChange={(e) => setEditGalleryInput(e.target.value)}
                    placeholder="Paste Photo URL (e.g. https://...)"
                    className="flex-1 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editGalleryInput.trim()) {
                        const currentGal = editingProduct.gallery || [editingProduct.image];
                        setEditingProduct({
                          ...editingProduct,
                          gallery: [...currentGal, editGalleryInput.trim()],
                        });
                        setEditGalleryInput('');
                      }
                    }}
                    className="px-3 py-2 bg-black text-white text-xs font-extrabold rounded-xl flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </div>

              {/* Edit Package Gram Weights & Price Tiers */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-black" />
                    <span>Edit Package Gram Weights & Cost (₹)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct({
                        ...editingProduct,
                        weightOptions: [...editingProduct.weightOptions, { weight: '400g', price: 249 }],
                      });
                    }}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
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
                        placeholder="Cost (₹)"
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
                          className="p-2 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer shadow-subtle">
                Save Changes & Publish
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD NEW CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateCategorySubmit} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Add New Food Category</h3>
              <button type="button" onClick={() => setShowAddCategoryModal(false)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Instant Mixes, Podi & Powders, Dry Fruits"
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Category Image URL (Optional)</label>
                <input
                  type="url"
                  value={newCatImage}
                  onChange={(e) => setNewCatImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-2xl border border-neutral-300"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Brief description of this food category..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
