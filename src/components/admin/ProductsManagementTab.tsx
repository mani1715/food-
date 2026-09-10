import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, WeightOption, ProcessStep } from '../../types';
import { Plus, Edit2, Trash2, Search, X, Star, Tag, Scale, Image as ImageIcon, LayoutGrid, Check, Sparkles, BookOpen, Layers, History, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { DragDropImagePicker } from './DragDropImagePicker';

const DEFAULT_PROCESS_STEPS: ProcessStep[] = [
  {
    stepNumber: '01',
    title: 'Freshly Picked Produce',
    subtitle: 'Direct Farm Sourcing',
    description: 'Selected raw mangoes, fresh Gongura leaves, and farm produce sourced directly from trusted local Andhra & Telangana orchards at peak freshness.',
  },
  {
    stepNumber: '02',
    title: 'Natural Sun-Curing',
    subtitle: 'Traditional Solar Maturation',
    description: 'Traditional sun-drying under clean, hygienic solar conditions to preserve authentic aroma, natural color, and deep rustic flavor.',
  },
  {
    stepNumber: '03',
    title: 'Stone-Ground Spices',
    subtitle: 'Slow Batch Grinding',
    description: 'Whole Guntur chillies, mustard, fenugreek, and coriander roasted in small batches and slow-ground using traditional stone mills (Rolu).',
  },
  {
    stepNumber: '04',
    title: 'Pure Oils & A2 Desi Ghee',
    subtitle: 'Cold-Pressed Chekku Oils & Bilona Ghee',
    description: 'Prepared exclusively with cold-pressed sesame & groundnut oils from wooden mills, and pure hand-churned A2 cow ghee.',
  },
  {
    stepNumber: '05',
    title: 'Traditional Earthen Storage',
    subtitle: 'Authentic Ceramic Jars (Jadi)',
    description: 'Matured naturally in authentic ceramic jars (Jadi) sealed with clean cotton cloth, without artificial chemicals or synthetic preservatives.',
  },
];

export const ProductsManagementTab: React.FC = () => {
  const {
    products,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductBestSeller,
    toggleProductNewArrival,
    toggleProductFestival,
    homeSections,
    updateHomeSection,
    restockProduct,
    destockProduct,
    stockHistoryLogs,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Restock / Destock Modal State
  const [stockModalState, setStockModalState] = useState<{
    isOpen: boolean;
    type: 'restock' | 'destock';
    product: Product | null;
    quantity: number;
    note: string;
  }>({
    isOpen: false,
    type: 'restock',
    product: null,
    quantity: 10,
    note: '',
  });

  // Stock History Log Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Pickles');
  const [newDescription, setNewDescription] = useState('');
  const [newGrandmaStory, setNewGrandmaStory] = useState('');
  const [newHowWeDoText, setNewHowWeDoText] = useState('');
  const [newSourcingText, setNewSourcingText] = useState('');
  const [newQualityGuaranteeText, setNewQualityGuaranteeText] = useState('');
  const [newIngredientsList, setNewIngredientsList] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [newRating, setNewRating] = useState<number>(5.0);
  const [newReviewsCount, setNewReviewsCount] = useState<number>(1);
  const [newInventoryCount, setNewInventoryCount] = useState<number>(100);
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

  const [newProcessSteps, setNewProcessSteps] = useState<ProcessStep[]>(DEFAULT_PROCESS_STEPS);

  // Edit Product Extra State
  const [editGalleryInput, setEditGalleryInput] = useState('');
  const [editIngredientsList, setEditIngredientsList] = useState<string[]>([]);
  const [editIngredientInput, setEditIngredientInput] = useState('');
  const [editSelectedSectionIds, setEditSelectedSectionIds] = useState<string[]>([]);

  // Delete Confirmation Modal State
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<Product | null>(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<ProductCategory | null>(null);

  // Add New Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [targetModalForNewCategory, setTargetModalForNewCategory] = useState<'add' | 'edit'>('add');
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredHistoryLogs = stockHistoryLogs.filter((log) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return log.productName.toLowerCase().includes(q) || (log.note && log.note.toLowerCase().includes(q));
  });

  // Open Add Product Modal with reset state
  const handleOpenAddModal = (presetCategory?: string) => {
    setNewName('');
    setNewDescription('');
    setNewGrandmaStory('');
    setNewHowWeDoText('');
    setNewSourcingText('');
    setNewQualityGuaranteeText('');
    setNewProcessSteps([...DEFAULT_PROCESS_STEPS]);
    setNewIngredientsList([]);
    setIngredientInput('');
    setNewGallery([]);
    setNewRating(5.0);
    setNewReviewsCount(1);
    setNewInventoryCount(100);
    setNewIsBestSeller(false);
    setNewIsNewArrival(true);
    setNewIsFestival(false);
    setNewCategory(presetCategory || (categoryFilter !== 'All' ? categoryFilter : categories[0]?.name || 'Pickles'));
    setNewSelectedSectionIds(homeSections.map((s) => s.id));
    setShowAddModal(true);
  };

  // Open Edit Product Modal with populated state
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setEditGalleryInput('');
    setEditIngredientsList(prod.ingredients || []);
    setEditIngredientInput('');
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

  // Stock Action Handlers
  const handleOpenStockModal = (product: Product, type: 'restock' | 'destock') => {
    setStockModalState({
      isOpen: true,
      type,
      product,
      quantity: 10,
      note: type === 'restock' ? 'Manual Warehouse Restock' : 'Stock Adjustment / Defect',
    });
  };

  const handleConfirmStockChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalState.product || stockModalState.quantity <= 0) return;

    if (stockModalState.type === 'restock') {
      restockProduct(stockModalState.product.id, stockModalState.quantity, stockModalState.note);
    } else {
      destockProduct(stockModalState.product.id, stockModalState.quantity, stockModalState.note);
    }

    setStockModalState((prev) => ({ ...prev, isOpen: false }));
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

    // Add any remaining text in ingredient input
    let finalIngredients = [...newIngredientsList];
    if (ingredientInput.trim()) {
      finalIngredients.push(ingredientInput.trim());
    }

    const createdProduct = addProduct({
      id: newProdId,
      name: newName,
      category: newCategory,
      price: newWeightOptions[0]?.price || 299,
      rating: newRating || 5.0,
      reviewsCount: newReviewsCount || 1,
      image: primaryImg,
      gallery: newGallery.length > 0 ? newGallery : [primaryImg],
      description: newDescription || 'Fresh handcrafted homemade food item prepared with traditional ingredients.',
      ingredients: finalIngredients.length > 0 ? finalIngredients : undefined,
      grandmaStory: newGrandmaStory.trim() || undefined,
      howWeDoText: newHowWeDoText.trim() || undefined,
      sourcingText: newSourcingText.trim() || undefined,
      qualityGuaranteeText: newQualityGuaranteeText.trim() || undefined,
      customProcessSteps: newProcessSteps,
      weightOptions: newWeightOptions,
      defaultWeight: newWeightOptions[0]?.weight || '500g',
      isVeg: newIsVeg,
      isBestSeller: newIsBestSeller,
      isNewArrival: newIsNewArrival,
      isFestival: newIsFestival,
      inventoryCount: newInventoryCount,
      outOfStock: newInventoryCount <= 0,
      inStock: newInventoryCount > 0,
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

    let finalIngredients = [...editIngredientsList];
    if (editIngredientInput.trim()) {
      finalIngredients.push(editIngredientInput.trim());
    }

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: editingProduct.category,
      description: editingProduct.description,
      ingredients: finalIngredients,
      grandmaStory: editingProduct.grandmaStory,
      howWeDoText: editingProduct.howWeDoText,
      sourcingText: editingProduct.sourcingText,
      qualityGuaranteeText: editingProduct.qualityGuaranteeText,
      customProcessSteps: editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS,
      rating: editingProduct.rating,
      reviewsCount: editingProduct.reviewsCount,
      image: primaryImg,
      gallery: editingProduct.gallery || [primaryImg],
      isVeg: editingProduct.isVeg,
      isBestSeller: editingProduct.isBestSeller,
      isNewArrival: editingProduct.isNewArrival,
      isFestival: editingProduct.isFestival,
      weightOptions: editingProduct.weightOptions,
      price: editingProduct.weightOptions[0]?.price || editingProduct.price,
      inventoryCount: editingProduct.inventoryCount ?? 100,
      outOfStock: (editingProduct.inventoryCount ?? 100) <= 0,
      inStock: (editingProduct.inventoryCount ?? 100) > 0,
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
          <p className="text-xs text-neutral-500">Configure products, create new categories, restock inventory & audit history logs.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Stock History Audit Log Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-black text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="View Restock & Destock History Logs"
          >
            <History className="w-4 h-4 text-black" />
            <span>Stock History Log ({stockHistoryLogs.length})</span>
          </button>

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

          {/* Only show Add Product button in top bar when a specific category is selected */}
          {categoryFilter !== 'All' && (
            <button
              onClick={() => handleOpenAddModal(categoryFilter)}
              className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add to {categoryFilter}</span>
            </button>
          )}
        </div>
      </div>

      {/* Low Stock Notification Warning Bar (< 10 Units) */}
      {products.some((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-bold shadow-subtle">
          <div className="flex items-center gap-2">
            <span className="text-base animate-bounce">⚠️</span>
            <span>
              <strong>Low Stock Alert:</strong> {products.filter((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock).length} product(s) have low inventory stock (&lt; 10 units) or are completely out of stock!
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {products
              .filter((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock)
              .map((p) => (
                <span
                  key={p.id}
                  onClick={() => handleOpenStockModal(p, 'restock')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono cursor-pointer border hover:underline ${
                    p.outOfStock ? 'bg-rose-100 text-rose-800 border-rose-300 font-black' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="Click to Restock Stock"
                >
                  {p.name}: <strong>{p.outOfStock ? 'Out of Stock' : `${p.inventoryCount} left`}</strong> (+ Restock)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* Category Specific Notice & Controls when Category Selected */}
      {categoryFilter !== 'All' && (
        <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-subtle">
          <div className="flex items-center gap-2">
            <span className="font-bold text-black">
              Showing Category: <span className="underline font-black">{categoryFilter}</span> ({filteredProducts.length} products)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {categories.find((c) => c.name === categoryFilter) && (
              <>
                <button
                  onClick={() => {
                    const cat = categories.find((c) => c.name === categoryFilter);
                    if (cat) setEditingCategory(cat);
                  }}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-black text-black text-[11px] font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Edit Category Details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-black" />
                  <span>Edit Category</span>
                </button>

                <button
                  onClick={() => {
                    const cat = categories.find((c) => c.name === categoryFilter);
                    if (cat) setDeleteCategoryConfirm(cat);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Category</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleOpenAddModal(categoryFilter)}
              className="px-3.5 py-1.5 bg-black text-white text-[11px] font-extrabold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer shadow-subtle shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Product to {categoryFilter}</span>
            </button>
          </div>
        </div>
      )}

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
                <th className="py-3.5 px-4">Inventory Stock & Audit</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((prod) => {
                const photosCount = prod.gallery?.length || 1;
                const stockCount = prod.inventoryCount ?? 100;
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

                    {/* Stock Count & Restock / Destock Action Buttons */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          {prod.outOfStock ? (
                            <span className="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Out of Stock
                            </span>
                          ) : (
                            <span className={`text-xs font-black font-mono ${stockCount < 10 ? 'text-amber-600' : 'text-black'}`}>
                              {stockCount} units
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenStockModal(prod, 'restock')}
                            className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-extrabold rounded-md flex items-center gap-0.5 cursor-pointer transition-all"
                            title="Restock units"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>+ Restock</span>
                          </button>
                          <button
                            onClick={() => handleOpenStockModal(prod, 'destock')}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-[10px] font-extrabold rounded-md flex items-center gap-0.5 cursor-pointer transition-all"
                            title="Destock units"
                          >
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                            <span>- Destock</span>
                          </button>
                        </div>
                      </div>
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
                          onClick={() => setDeleteProductConfirm(prod)}
                          className="p-2 rounded-xl border border-neutral-200 hover:border-red-600 hover:bg-rose-50 hover:text-red-600 text-neutral-400 cursor-pointer transition-all"
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

      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-modal text-left space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black">Delete Product?</h3>
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
              <img src={deleteProductConfirm.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-black">{deleteProductConfirm.name}</p>
                <p className="text-[11px] text-neutral-500">{deleteProductConfirm.category} · ₹{deleteProductConfirm.price}</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete <strong>"{deleteProductConfirm.name}"</strong> from the catalog? It will also be removed from all homepage showcase sections.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteProductConfirm(null)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteProductConfirm.id);
                  setDeleteProductConfirm(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {deleteCategoryConfirm && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-modal text-left space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black">Delete Category?</h3>
                <p className="text-xs text-neutral-500">Products in this category will not be deleted.</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Are you sure you want to permanently delete the <strong>"{deleteCategoryConfirm.name}"</strong> category? Products assigned to this category will remain in the catalog.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteCategoryConfirm(null)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteCategory(deleteCategoryConfirm.id);
                  setCategoryFilter('All');
                  setDeleteCategoryConfirm(null);
                }}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-extrabold cursor-pointer"
              >
                Yes, Delete Category
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* RESTOCK / DESTOCK MODAL */}
      {stockModalState.isOpen && stockModalState.product && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleConfirmStockChange}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-modal text-left"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {stockModalState.type === 'restock' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                )}
                <h3 className="text-base font-extrabold text-black">
                  {stockModalState.type === 'restock' ? 'Restock Inventory Stock' : 'Destock Inventory Units'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
              <img src={stockModalState.product.image} alt="" className="w-10 h-10 rounded-xl object-cover border" />
              <div>
                <h4 className="text-xs font-extrabold text-black">{stockModalState.product.name}</h4>
                <p className="text-[11px] text-neutral-500">
                  Current Stock: <strong className="text-black font-mono">{stockModalState.product.inventoryCount ?? 100} units</strong>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">
                  Quantity to {stockModalState.type === 'restock' ? 'Add (+)' : 'Remove (-)'} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockModalState.quantity}
                  onChange={(e) => setStockModalState({ ...stockModalState, quantity: Number(e.target.value) })}
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-mono text-base font-black"
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Reason / Audit Note (Optional)</label>
                <input
                  type="text"
                  value={stockModalState.note}
                  onChange={(e) => setStockModalState({ ...stockModalState, note: e.target.value })}
                  placeholder="e.g. Received new shipment batch from kitchen..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-normal"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 text-white rounded-2xl text-xs font-extrabold cursor-pointer shadow-subtle ${
                  stockModalState.type === 'restock' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {stockModalState.type === 'restock' ? 'Restock' : 'Destock'}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* STOCK HISTORY AUDIT LOG MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-modal text-left max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-black" />
                <h3 className="text-base font-extrabold text-black">Inventory Restock & Destock History Audit Log</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search audit log by product name or note..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
              />
            </div>

            <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden">
              {filteredHistoryLogs.length > 0 ? (
                <div className="divide-y divide-neutral-200 text-xs">
                  {filteredHistoryLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono border ${
                            log.type === 'restock'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-rose-100 text-rose-900 border-rose-300'
                          }`}
                        >
                          {log.type === 'restock' ? `+${log.quantity} Restock` : `-${log.quantity} Destock`}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-black">{log.productName}</h4>
                          <p className="text-[11px] text-neutral-500 font-medium">{log.note || 'No note provided'}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block font-mono text-[11px] font-bold text-neutral-800">{log.date}</span>
                        <span className="block font-mono text-[10px] text-neutral-400">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No stock history logs recorded yet. Restock or destock items to build audit trail.
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Close Audit Logs
              </button>
            </div>
          </motion.div>
        </div>
      )}

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

              {/* Editable Ingredients Checklist Tag System */}
              <div className="space-y-2">
                <label className="block text-neutral-500">Ingredients & Recipe Checklist</label>
                
                {/* Tag Pills */}
                {newIngredientsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {newIngredientsList.map((ing, idx) => (
                      <span key={idx} className="bg-neutral-100 border border-neutral-300 text-black px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => setNewIngredientsList(newIngredientsList.filter((_, i) => i !== idx))}
                          className="hover:text-rose-600 text-neutral-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && ingredientInput.trim()) {
                        e.preventDefault();
                        setNewIngredientsList([...newIngredientsList, ingredientInput.trim().replace(/,/g, '')]);
                        setIngredientInput('');
                      }
                    }}
                    placeholder="Type ingredient and press Enter or Comma..."
                    className="flex-1 p-3 rounded-2xl border border-neutral-300 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (ingredientInput.trim()) {
                        setNewIngredientsList([...newIngredientsList, ingredientInput.trim().replace(/,/g, '')]);
                        setIngredientInput('');
                      }
                    }}
                    className="px-4 py-3 bg-black text-white rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Taste Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Reviews Count</label>
                  <input
                    type="number"
                    value={newReviewsCount}
                    onChange={(e) => setNewReviewsCount(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Inventory Stock Count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newInventoryCount}
                    onChange={(e) => setNewInventoryCount(Number(e.target.value))}
                    placeholder="100"
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-black text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Grandma Says... Story / Memory Text (Optional)</label>
                <textarea
                  rows={2}
                  value={newGrandmaStory}
                  onChange={(e) => setNewGrandmaStory(e.target.value)}
                  placeholder="Enter custom heritage memory story for this product..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-normal"
                />
              </div>

              {/* 3 CUSTOM PROCESS CARDS EDITING SECTION */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Custom Process Cards (How We Do, Sourcing & Guarantee)</span>
                </span>

                <div>
                  <label className="block text-neutral-500 mb-1">How We Do Card Text</label>
                  <input
                    type="text"
                    value={newHowWeDoText}
                    onChange={(e) => setNewHowWeDoText(e.target.value)}
                    placeholder="e.g. Traditional 5-step grandmother recipe process..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Regional Sourcing Card Text</label>
                  <input
                    type="text"
                    value={newSourcingText}
                    onChange={(e) => setNewSourcingText(e.target.value)}
                    placeholder="e.g. Farm origin traceability: Vijayawada raw mangoes..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Quality Guarantee Card Text</label>
                  <input
                    type="text"
                    value={newQualityGuaranteeText}
                    onChange={(e) => setNewQualityGuaranteeText(e.target.value)}
                    placeholder="e.g. 100% natural homemade purity. Zero preservatives..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>
              </div>

              {/* 5-STEP TRADITIONAL CRAFTSMANSHIP PROCESS EDITING SECTION */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-black" />
                  <span>The 5-Step Traditional Craftsmanship Process</span>
                </span>

                <div className="space-y-3 pt-1">
                  {newProcessSteps.map((step, idx) => (
                    <div key={idx} className="p-3 bg-white border border-neutral-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
                        <span className="font-extrabold text-black font-mono">Step {step.stepNumber}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Craftsmanship Phase</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Title</label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewProcessSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, title: val } : s)));
                            }}
                            placeholder="Step Title"
                            className="w-full p-2 border border-neutral-300 rounded-lg font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Subtitle / Tagline</label>
                          <input
                            type="text"
                            value={step.subtitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewProcessSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, subtitle: val } : s)));
                            }}
                            placeholder="Subtitle"
                            className="w-full p-2 border border-neutral-300 rounded-lg font-medium bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Step Description</label>
                        <textarea
                          rows={2}
                          value={step.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewProcessSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, description: val } : s)));
                          }}
                          placeholder="Step detailed process..."
                          className="w-full p-2 border border-neutral-300 rounded-lg font-normal bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHOWCASE COLLECTIONS & FEATURE FLAGS SELECTION */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-black" />
                  <span>Product Feature Flags & Homepage Showcases</span>
                </span>

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

                <DragDropImagePicker
                  label="Add Photo to Gallery"
                  value=""
                  onChange={(url) => {
                    if (url) setNewGallery((prev) => [...prev, url]);
                  }}
                  multiple={true}
                  onMultipleChange={(urls) => {
                    if (urls.length > 0) setNewGallery((prev) => [...prev, ...urls]);
                  }}
                  helperText="Drag & drop product images from your computer or click to select files/folders."
                />
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

              {/* Edit Ingredients Checklist Tag System */}
              <div className="space-y-2">
                <label className="block text-neutral-500">Ingredients & Recipe Checklist</label>

                {editIngredientsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {editIngredientsList.map((ing, idx) => (
                      <span key={idx} className="bg-neutral-100 border border-neutral-300 text-black px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => setEditIngredientsList(editIngredientsList.filter((_, i) => i !== idx))}
                          className="hover:text-rose-600 text-neutral-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editIngredientInput}
                    onChange={(e) => setEditIngredientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ',') && editIngredientInput.trim()) {
                        e.preventDefault();
                        setEditIngredientsList([...editIngredientsList, editIngredientInput.trim().replace(/,/g, '')]);
                        setEditIngredientInput('');
                      }
                    }}
                    placeholder="Type ingredient and press Enter or Comma..."
                    className="flex-1 p-3 rounded-2xl border border-neutral-300 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editIngredientInput.trim()) {
                        setEditIngredientsList([...editIngredientsList, editIngredientInput.trim().replace(/,/g, '')]);
                        setEditIngredientInput('');
                      }
                    }}
                    className="px-4 py-3 bg-black text-white rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-500 mb-1">Taste Rating (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingProduct.rating || 5.0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, rating: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Reviews Count</label>
                  <input
                    type="number"
                    value={editingProduct.reviewsCount || 1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reviewsCount: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Inventory Stock Count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.inventoryCount ?? 100}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        inventoryCount: Number(e.target.value),
                        outOfStock: Number(e.target.value) <= 0,
                        inStock: Number(e.target.value) > 0,
                      })
                    }
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-black text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Grandma Says... Story / Memory Text (Optional)</label>
                <textarea
                  rows={2}
                  value={editingProduct.grandmaStory || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, grandmaStory: e.target.value })}
                  placeholder="Enter custom heritage memory story for this product..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 bg-white font-normal"
                />
              </div>

              {/* EDIT 3 CUSTOM PROCESS CARDS */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Custom Process Cards (How We Do, Sourcing & Guarantee)</span>
                </span>

                <div>
                  <label className="block text-neutral-500 mb-1">How We Do Card Text</label>
                  <input
                    type="text"
                    value={editingProduct.howWeDoText || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, howWeDoText: e.target.value })}
                    placeholder="e.g. Traditional 5-step grandmother recipe process..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Regional Sourcing Card Text</label>
                  <input
                    type="text"
                    value={editingProduct.sourcingText || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sourcingText: e.target.value })}
                    placeholder="e.g. Farm origin traceability: Vijayawada raw mangoes..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>

                <div>
                  <label className="block text-neutral-500 mb-1">Quality Guarantee Card Text</label>
                  <input
                    type="text"
                    value={editingProduct.qualityGuaranteeText || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, qualityGuaranteeText: e.target.value })}
                    placeholder="e.g. 100% natural homemade purity. Zero preservatives..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-normal"
                  />
                </div>
              </div>

              {/* EDIT 5-STEP TRADITIONAL CRAFTSMANSHIP PROCESS SECTION */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-black" />
                  <span>The 5-Step Traditional Craftsmanship Process</span>
                </span>

                <div className="space-y-3 pt-1">
                  {(editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS).map((step, idx) => (
                    <div key={idx} className="p-3 bg-white border border-neutral-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
                        <span className="font-extrabold text-black font-mono">Step {step.stepNumber}</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">Craftsmanship Phase</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Title</label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              const current = [...(editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS)];
                              current[idx] = { ...current[idx], title: val };
                              setEditingProduct({ ...editingProduct, customProcessSteps: current });
                            }}
                            placeholder="Step Title"
                            className="w-full p-2 border border-neutral-300 rounded-lg font-bold bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Subtitle / Tagline</label>
                          <input
                            type="text"
                            value={step.subtitle}
                            onChange={(e) => {
                              const val = e.target.value;
                              const current = [...(editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS)];
                              current[idx] = { ...current[idx], subtitle: val };
                              setEditingProduct({ ...editingProduct, customProcessSteps: current });
                            }}
                            placeholder="Subtitle"
                            className="w-full p-2 border border-neutral-300 rounded-lg font-medium bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Step Description</label>
                        <textarea
                          rows={2}
                          value={step.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            const current = [...(editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS)];
                            current[idx] = { ...current[idx], description: val };
                            setEditingProduct({ ...editingProduct, customProcessSteps: current });
                          }}
                          placeholder="Step detailed process..."
                          className="w-full p-2 border border-neutral-300 rounded-lg font-normal bg-white"
                        />
                      </div>
                    </div>
                  ))}
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

                <DragDropImagePicker
                  label="Add Photo to Gallery"
                  value=""
                  onChange={(url) => {
                    if (url) {
                      const currentGal = editingProduct.gallery || [editingProduct.image];
                      setEditingProduct({
                        ...editingProduct,
                        image: editingProduct.image || url,
                        gallery: [...currentGal, url],
                      });
                    }
                  }}
                  multiple={true}
                  onMultipleChange={(urls) => {
                    if (urls.length > 0) {
                      const currentGal = editingProduct.gallery || [editingProduct.image];
                      setEditingProduct({
                        ...editingProduct,
                        image: editingProduct.image || urls[0],
                        gallery: [...currentGal, ...urls],
                      });
                    }
                  }}
                  helperText="Drag & drop product images from your computer or click to select files/folders."
                />
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

              <DragDropImagePicker
                label="Category Cover Image"
                value={newCatImage}
                onChange={setNewCatImage}
                helperText="Upload or select category banner image."
              />

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

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingCategory.name.trim()) return;
              updateCategory(editingCategory.id, {
                name: editingCategory.name.trim(),
                image: editingCategory.image,
                description: editingCategory.description,
              });
              setCategoryFilter(editingCategory.name.trim());
              setEditingCategory(null);
            }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-modal text-left"
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-lg font-black text-black">Edit Category: {editingCategory.name}</h3>
              <button type="button" onClick={() => setEditingCategory(null)} className="text-neutral-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-extrabold text-sm"
                />
              </div>

              <DragDropImagePicker
                label="Category Cover Image"
                value={editingCategory.image || ''}
                onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
                helperText="Upload or select category banner image."
              />

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Brief description of this food category..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-sans"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-black hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-subtle"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
