import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, WeightOption, ProcessStep, StockHistoryLog } from '../../types';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Star,
  Tag,
  Scale,
  Image as ImageIcon,
  LayoutGrid,
  Check,
  Sparkles,
  BookOpen,
  Layers,
  History,
  TrendingUp,
  TrendingDown,
  Hand,
  ZoomIn,
  ZoomOut,
  Move,
  Sliders,
  RefreshCw,
  Crosshair,
  Eye,
  EyeOff,
  AlertCircle,
  Calendar,
  CalendarDays,
  Ban,
  CheckCircle2,
  ChevronRight,
  Info,
  Filter,
  FileText,
  Clock,
  ShieldCheck,
  PackageCheck,
  PackageX,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropImagePicker } from './DragDropImagePicker';
import {
  AdminTimeframe,
  isDateMatch,
  getTodayDateStr,
  getYesterdayDateStr,
  formatDisplayDate,
} from '../../utils/dateFilters';

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

const PRESET_STATUS_REASONS = [
  'Seasonal raw ingredient shortage',
  'Batch kitchen preparation in progress',
  'High customer demand - Restocking soon',
  'Quality assurance & testing pause',
  'Temporary supplier inventory delay',
  'Product packaging redesign',
  'Seasonal specialty (Winter / Summer exclusive)',
  'Discontinued for menu revamp',
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
    toggleProductOutOfStock,
    toggleProductVisibility,
    homeSections,
    updateHomeSection,
    restockProduct,
    destockProduct,
    setProductStock,
    stockHistoryLogs,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'hidden'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Status Change Reason Modal State (Out of Stock / Visibility Hide)
  const [reasonModalState, setReasonModalState] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
    action: 'out_of_stock' | 'in_stock' | 'hide' | 'unhide';
    currentOutOfStock?: boolean;
    currentHidden?: boolean;
    reason: string;
  }>({
    isOpen: false,
    productId: '',
    productName: '',
    action: 'out_of_stock',
    reason: '',
  });

  // Restock / Destock / Set Modal State
  const [stockModalState, setStockModalState] = useState<{
    isOpen: boolean;
    type: 'restock' | 'destock' | 'set';
    product: Product | null;
    targetWeight?: string;
    quantity: number;
    note: string;
  }>({
    isOpen: false,
    type: 'restock',
    product: null,
    targetWeight: undefined,
    quantity: 10,
    note: '',
  });

  // Stock History Log Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTimeframe, setHistoryTimeframe] = useState<AdminTimeframe>('all');
  const [historyCustomDate, setHistoryCustomDate] = useState<string>('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [selectedLogDetail, setSelectedLogDetail] = useState<StockHistoryLog | null>(null);

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
  const [newOutOfStock, setNewOutOfStock] = useState<boolean>(false);
  const [newIsHidden, setNewIsHidden] = useState<boolean>(false);
  const [newStatusReason, setNewStatusReason] = useState<string>('');
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
  const [newCatScale, setNewCatScale] = useState(1);
  const [newCatPanX, setNewCatPanX] = useState(0);
  const [newCatPanY, setNewCatPanY] = useState(0);
  const [isCatInteracting, setIsCatInteracting] = useState(false);
  const catDragStartRef = React.useRef<{ x: number; y: number; initialPanX: number; initialPanY: number } | null>(null);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isOut = p.outOfStock || (p.inventoryCount ?? 100) <= 0;
    const isHidden = p.isHidden;
    
    if (statusFilter === 'in_stock' && (isOut || isHidden)) return false;
    if (statusFilter === 'out_of_stock' && !isOut) return false;
    if (statusFilter === 'hidden' && !isHidden) return false;

    return matchesCat && matchesSearch;
  });

  // Filtered Stock History Audit Logs
  const filteredHistoryLogs = stockHistoryLogs.filter((log) => {
    const matchesDate = isDateMatch(log.date, historyTimeframe, historyCustomDate);
    const matchesType = historyTypeFilter === 'all' || log.type === historyTypeFilter;
    const matchesSearch =
      !historySearchQuery.trim() ||
      log.productName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (log.note && log.note.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      (log.adminName && log.adminName.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      log.date.includes(historySearchQuery);
    return matchesDate && matchesType && matchesSearch;
  });

  // KPI Calculations
  const totalProductsCount = products.length;
  const outOfStockCount = products.filter((p) => p.outOfStock || (p.inventoryCount ?? 100) <= 0).length;
  const hiddenCount = products.filter((p) => p.isHidden).length;
  const inStockCount = totalProductsCount - outOfStockCount;

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
    setNewOutOfStock(false);
    setNewIsHidden(false);
    setNewStatusReason('');
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
    field: keyof WeightOption,
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

  // Stock Restock / Destock / Set Action Handlers
  const handleOpenStockModal = (
    product: Product,
    type: 'restock' | 'destock' | 'set' = 'restock',
    targetWeight?: string
  ) => {
    const initialQty = type === 'set' ? 0 : 10;
    setStockModalState({
      isOpen: true,
      type,
      product,
      targetWeight,
      quantity: initialQty,
      note:
        type === 'restock'
          ? targetWeight
            ? `Manual Restock (${targetWeight})`
            : 'Manual Warehouse Restock'
          : type === 'set'
          ? targetWeight
            ? `Stock Level Set (${targetWeight})`
            : 'Stock Level Set'
          : targetWeight
          ? `Stock Reduction (${targetWeight})`
          : 'Stock Adjustment / Defect',
    });
  };

  const handleConfirmStockChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalState.product) return;
    const qty = Math.max(0, Number(stockModalState.quantity) || 0);

    if (stockModalState.type === 'set' || qty === 0) {
      setProductStock(
        stockModalState.product.id,
        qty,
        stockModalState.targetWeight,
        stockModalState.note || 'Admin direct stock override'
      );
    } else if (stockModalState.type === 'restock') {
      restockProduct(
        stockModalState.product.id,
        qty,
        stockModalState.note || 'Manual Restock',
        stockModalState.targetWeight
      );
    } else {
      destockProduct(
        stockModalState.product.id,
        qty,
        stockModalState.note || 'Manual Destock',
        stockModalState.targetWeight
      );
    }

    setStockModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Status Change (Out of Stock / Visibility Hide) Prompt Modal Handlers
  const handleOpenReasonModal = (product: Product, action: 'out_of_stock' | 'in_stock' | 'hide' | 'unhide') => {
    const defaultReason =
      action === 'out_of_stock'
        ? 'Seasonal raw ingredient shortage'
        : action === 'in_stock'
        ? 'Fresh batch prepared and restocked in kitchen'
        : action === 'hide'
        ? 'Temporarily unlisted from customer storefront'
        : 'Restored and visible on customer storefront';

    setReasonModalState({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      action,
      currentOutOfStock: product.outOfStock,
      currentHidden: product.isHidden,
      reason: defaultReason,
    });
  };

  const handleConfirmReasonModal = (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, action, reason } = reasonModalState;
    if (!productId) return;

    if (action === 'out_of_stock' || action === 'in_stock') {
      toggleProductOutOfStock(productId, reason.trim() || undefined);
    } else if (action === 'hide' || action === 'unhide') {
      toggleProductVisibility(productId, reason.trim() || undefined);
    }

    setReasonModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Create New Category Handler with Logo Zoom & Pan
  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const createdCat = addCategory(
      newCatName.trim(),
      newCatImage.trim() || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
      newCatDescription.trim(),
      newCatScale || 1,
      newCatPanX || 0,
      newCatPanY || 0
    );

    if (targetModalForNewCategory === 'add') {
      setNewCategory(createdCat.name);
    } else if (editingProduct) {
      setEditingProduct({ ...editingProduct, category: createdCat.name });
    }

    setNewCatName('');
    setNewCatImage('');
    setNewCatDescription('');
    setNewCatScale(1);
    setNewCatPanX(0);
    setNewCatPanY(0);
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
      outOfStock: newOutOfStock || newInventoryCount <= 0,
      inStock: !newOutOfStock && newInventoryCount > 0,
      isHidden: newIsHidden,
      statusReason: newStatusReason.trim() || undefined,
    });

    // Assign to chosen home showcase sections
    newSelectedSectionIds.forEach((secId) => {
      const section = homeSections.find((s) => s.id === secId);
      if (section && !section.productIds.includes(createdProduct.id)) {
        updateHomeSection(secId, {
          productIds: [...section.productIds, createdProduct.id],
        });
      }
    });

    setShowAddModal(false);
  };

  // Edit Product Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let finalIngredients = [...editIngredientsList];
    if (editIngredientInput.trim()) {
      finalIngredients.push(editIngredientInput.trim());
    }

    const isOut = editingProduct.outOfStock || (editingProduct.inventoryCount ?? 100) <= 0;

    updateProduct(editingProduct.id, {
      name: editingProduct.name,
      category: editingProduct.category,
      price: editingProduct.weightOptions[0]?.price || editingProduct.price,
      rating: editingProduct.rating,
      reviewsCount: editingProduct.reviewsCount,
      image: editingProduct.image,
      gallery: editingProduct.gallery,
      description: editingProduct.description,
      ingredients: finalIngredients.length > 0 ? finalIngredients : undefined,
      grandmaStory: editingProduct.grandmaStory?.trim() || undefined,
      howWeDoText: editingProduct.howWeDoText?.trim() || undefined,
      sourcingText: editingProduct.sourcingText?.trim() || undefined,
      qualityGuaranteeText: editingProduct.qualityGuaranteeText?.trim() || undefined,
      customProcessSteps: editingProduct.customProcessSteps,
      weightOptions: editingProduct.weightOptions,
      defaultWeight: editingProduct.weightOptions[0]?.weight || editingProduct.defaultWeight,
      isVeg: editingProduct.isVeg,
      isBestSeller: editingProduct.isBestSeller,
      isNewArrival: editingProduct.isNewArrival,
      isFestival: editingProduct.isFestival,
      inventoryCount: editingProduct.inventoryCount,
      outOfStock: isOut,
      inStock: !isOut,
      isHidden: editingProduct.isHidden,
      statusReason: editingProduct.statusReason?.trim() || undefined,
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
      
      {/* Top Action Bar & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-black tracking-tight">Product Catalog & Inventory Center</h2>
          <p className="text-xs text-neutral-500">
            Manage product catalog, out-of-stock badges, storefront visibility, restock inventory & audit history logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Stock History Audit Log Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-subtle"
            title="View Restock, Destock & Status Change History Logs"
          >
            <History className="w-4 h-4 text-white" />
            <span>Stock History Log ({stockHistoryLogs.length})</span>
          </button>

          {/* Add New Category Button */}
          <button
            onClick={() => {
              setTargetModalForNewCategory('add');
              setShowAddCategoryModal(true);
            }}
            className="px-4 py-2.5 bg-white border border-neutral-300 hover:border-black text-black text-xs font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-subtle hover:bg-neutral-50"
            title="Create a new product category and adjust logo"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Catalog Quick Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-neutral-900 text-white border-black shadow-subtle'
              : 'bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75">Total Catalog</span>
            <Layers className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-xl font-black mt-1 font-mono">{totalProductsCount}</p>
          <span className="text-[10px] opacity-70">Across {categories.length} Categories</span>
        </div>

        <div
          onClick={() => setStatusFilter('in_stock')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-800 text-white border-emerald-900 shadow-subtle'
              : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">In Stock</span>
            <PackageCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-black mt-1 font-mono text-emerald-950">{inStockCount}</p>
          <span className="text-[10px] text-emerald-700">Available to Customers</span>
        </div>

        <div
          onClick={() => setStatusFilter('out_of_stock')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'out_of_stock'
              ? 'bg-rose-800 text-white border-rose-900 shadow-subtle'
              : 'bg-rose-50 text-rose-950 border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Out of Stock</span>
            <PackageX className="w-4 h-4 text-rose-700" />
          </div>
          <p className="text-xl font-black mt-1 font-mono text-rose-950">{outOfStockCount}</p>
          <span className="text-[10px] text-rose-700">Marked Unavailable</span>
        </div>

        <div
          onClick={() => setStatusFilter('hidden')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'hidden'
              ? 'bg-amber-800 text-white border-amber-900 shadow-subtle'
              : 'bg-amber-50 text-amber-950 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Hidden from Store</span>
            <EyeOff className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-xl font-black mt-1 font-mono text-amber-950">{hiddenCount}</p>
          <span className="text-[10px] text-amber-700">Invisible on Homepage</span>
        </div>
      </div>

      {/* Low Stock Warning Bar (< 10 Units or Out of Stock) */}
      {products.some((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-bold shadow-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>
              <strong>Inventory Alert:</strong> {products.filter((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock).length} product(s) have low inventory stock (&lt; 10 units) or are marked Out of Stock.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {products
              .filter((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock)
              .slice(0, 5)
              .map((p) => (
                <span
                  key={p.id}
                  onClick={() => handleOpenStockModal(p, 'restock')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono cursor-pointer border hover:underline ${
                    p.outOfStock ? 'bg-rose-100 text-rose-800 border-rose-300 font-black' : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="Click to Restock Units"
                >
                  {p.name}: <strong>{p.outOfStock ? 'Out of Stock' : `${p.inventoryCount} left`}</strong> (+ Restock)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
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

        {/* Category Selector Pills */}
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all ${
                categoryFilter === c.name ? 'bg-black text-white border-black shadow-subtle' : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {c.image && (
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-4 h-4 rounded-full object-cover border border-white/40 shrink-0"
                />
              )}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Specific Notice & Category Edit/Delete Controls */}
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
                  onClick={() => setEditingCategory(categories.find((c) => c.name === categoryFilter) || null)}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-black text-black text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Category Logo & Info</span>
                </button>
                <button
                  onClick={() => setDeleteCategoryConfirm(categories.find((c) => c.name === categoryFilter) || null)}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
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
              <span>+ Add Product to {categoryFilter}</span>
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
                <th className="py-3.5 px-4">Category & Diet</th>
                <th className="py-3.5 px-4">Gram Weights & Cost (₹)</th>
                <th className="py-3.5 px-4">Stock & Restock</th>
                <th className="py-3.5 px-4">Storefront Status & Controls</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <p className="text-sm font-bold text-neutral-600">No products found matching the criteria.</p>
                    <p className="text-xs mt-1">Try resetting the search or category filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const photosCount = prod.gallery?.length || 1;
                  const stockCount = prod.inventoryCount ?? 100;
                  const isOut = prod.outOfStock || stockCount <= 0;
                  const isHidden = prod.isHidden;

                  return (
                    <tr key={prod.id} className={`hover:bg-neutral-50/80 transition-colors ${isHidden ? 'bg-amber-50/30' : ''}`}>
                      
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
                            <p className="font-bold text-black flex items-center gap-1.5">
                              <span>{prod.name}</span>
                              {isHidden && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded-full" title="Hidden from customer storefront">
                                  🙈 Hidden
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                              {prod.isBestSeller && <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Best Seller</span>}
                              {prod.isNewArrival && <span className="bg-neutral-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">✨ New Arrival</span>}
                              {prod.isFestival && <span className="bg-neutral-200 text-black text-[9px] font-bold px-2 py-0.5 rounded-full">🎉 Festival</span>}
                            </div>
                            {prod.statusReason && (
                              <p className="text-[10px] text-neutral-500 italic mt-0.5 line-clamp-1" title={prod.statusReason}>
                                📝 Note: {prod.statusReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Dietary */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-neutral-800">{prod.category}</p>
                        <div className="mt-1">
                          {prod.isVeg ? (
                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">● Veg</span>
                          ) : (
                            <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">▲ Non-Veg</span>
                          )}
                        </div>
                      </td>

                      {/* Weight Options */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex flex-col gap-1.5 font-mono text-[11px]">
                          {prod.weightOptions.map((w) => {
                            const variantStock = w.stock ?? stockCount;
                            const isVariantOut = variantStock <= 0;
                            return (
                              <div
                                key={w.weight}
                                className="flex items-center justify-between gap-1.5 bg-neutral-50 border border-neutral-200 px-2 py-1 rounded-lg"
                              >
                                <span className="font-bold text-neutral-800">
                                  {w.weight}: <span className="text-neutral-500 font-normal">₹{w.price}</span>
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                      isVariantOut
                                        ? 'bg-rose-100 text-rose-700'
                                        : variantStock < 10
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-neutral-200 text-neutral-700'
                                    }`}
                                  >
                                    {variantStock} left
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenStockModal(prod, 'restock', w.weight)}
                                    className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[9px] font-black rounded cursor-pointer transition-colors"
                                    title={`Restock ${w.weight}`}
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Stock Count & Restock / Destock Action Buttons */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            {isOut ? (
                              <span className="text-[10px] font-extrabold uppercase text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                0 Units (Out of Stock)
                              </span>
                            ) : (
                              <span className={`text-xs font-black font-mono ${stockCount < 10 ? 'text-amber-600' : 'text-black'}`}>
                                {stockCount} units
                              </span>
                            )}
                          </div>

                          <div className="flex items-center flex-wrap gap-1">
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
                            <button
                              onClick={() => handleOpenStockModal(prod, 'set')}
                              className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-[10px] font-extrabold rounded-md cursor-pointer transition-all"
                              title="Set exact stock (including 0)"
                            >
                              <span>Set</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Storefront Status & Quick Controls (Out of Stock & Visibility Hide) */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          {/* 1. Out of Stock Toggle Button */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenReasonModal(prod, isOut ? 'in_stock' : 'out_of_stock')}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer border shadow-subtle ${
                                isOut
                                  ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                              }`}
                              title="Click to toggle Out of Stock with optional audit note"
                            >
                              {isOut ? (
                                <>
                                  <Ban className="w-3 h-3" />
                                  <span>Out of Stock</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>In Stock</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* 2. Storefront Visibility Toggle Button */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenReasonModal(prod, isHidden ? 'unhide' : 'hide')}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer border shadow-subtle ${
                                isHidden
                                  ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-neutral-200'
                              }`}
                              title="Click to hide/unhide product on customer store"
                            >
                              {isHidden ? (
                                <>
                                  <EyeOff className="w-3 h-3 text-amber-700" />
                                  <span>Hidden in Store</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3 text-neutral-600" />
                                  <span>Visible in Store</span>
                                </>
                              )}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STATUS CHANGE REASON MODAL (Out of Stock / Visibility Hide) */}
      {reasonModalState.isOpen && (
        <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleConfirmReasonModal}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-modal text-left"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {reasonModalState.action === 'out_of_stock' ? (
                  <Ban className="w-5 h-5 text-rose-600" />
                ) : reasonModalState.action === 'in_stock' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : reasonModalState.action === 'hide' ? (
                  <EyeOff className="w-5 h-5 text-amber-600" />
                ) : (
                  <Eye className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-base font-extrabold text-black">
                  {reasonModalState.action === 'out_of_stock'
                    ? 'Mark as Out of Stock'
                    : reasonModalState.action === 'in_stock'
                    ? 'Mark as In Stock'
                    : reasonModalState.action === 'hide'
                    ? 'Hide from Storefront & Homepage'
                    : 'Make Visible on Storefront'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200">
              <p className="text-xs font-extrabold text-black">{reasonModalState.productName}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {reasonModalState.action === 'out_of_stock'
                  ? 'This product will show an "Out of Stock" badge on the homepage and customer store, preventing purchase.'
                  : reasonModalState.action === 'in_stock'
                  ? 'This product will be marked active and purchasable again.'
                  : reasonModalState.action === 'hide'
                  ? 'This product will be completely hidden from all homepage showcase sections, category listings, and search results.'
                  : 'This product will be made visible for customer browsing and ordering.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-600">
                Reason / Audit Description (Optional):
              </label>
              <textarea
                rows={3}
                value={reasonModalState.reason}
                onChange={(e) => setReasonModalState({ ...reasonModalState, reason: e.target.value })}
                placeholder="Explain why this product is being modified (e.g. Seasonal ingredient shortage, Kitchen batch delay)..."
                className="w-full p-3 rounded-2xl border border-neutral-300 text-xs font-medium focus:ring-1 focus:ring-black focus:outline-none"
              />

              {/* Quick Preset Buttons */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-neutral-400 block mb-1">Quick Preset Reasons:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_STATUS_REASONS.slice(0, 5).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setReasonModalState({ ...reasonModalState, reason: preset })}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 text-white rounded-2xl text-xs font-extrabold cursor-pointer shadow-subtle ${
                  reasonModalState.action === 'out_of_stock'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : reasonModalState.action === 'hide'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm & Log Change
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* RESTOCK / DESTOCK / SET MODAL */}
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
                ) : stockModalState.type === 'destock' ? (
                  <TrendingDown className="w-5 h-5 text-rose-600" />
                ) : (
                  <Sliders className="w-5 h-5 text-neutral-800" />
                )}
                <h3 className="text-base font-extrabold text-black">
                  {stockModalState.type === 'restock'
                    ? 'Restock Inventory Stock'
                    : stockModalState.type === 'destock'
                    ? 'Destock Inventory Units'
                    : 'Set Exact Stock Level'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, isOpen: false }))}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Type Toggle */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, type: 'restock' }))}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  stockModalState.type === 'restock'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                + Restock
              </button>
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, type: 'destock' }))}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  stockModalState.type === 'destock'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                - Destock
              </button>
              <button
                type="button"
                onClick={() => setStockModalState((prev) => ({ ...prev, type: 'set' }))}
                className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  stockModalState.type === 'set'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                = Set Exact
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
              <img src={stockModalState.product.image} alt="" className="w-10 h-10 rounded-xl object-cover border" />
              <div>
                <h4 className="text-xs font-extrabold text-black">{stockModalState.product.name}</h4>
                <p className="text-[11px] text-neutral-500">
                  Current Total Stock:{' '}
                  <strong className="text-black font-mono">
                    {stockModalState.product.inventoryCount ?? 100} units
                  </strong>
                </p>
                {stockModalState.targetWeight && (
                  <p className="text-[11px] text-emerald-700 font-bold">
                    Target Variant: {stockModalState.targetWeight}
                  </p>
                )}
              </div>
            </div>

            {/* Target Weight Variant Selector */}
            {stockModalState.product.weightOptions && stockModalState.product.weightOptions.length > 0 && (
              <div>
                <label className="block text-neutral-500 text-xs font-bold mb-1">
                  Target Weight Variant (Optional)
                </label>
                <select
                  value={stockModalState.targetWeight || ''}
                  onChange={(e) =>
                    setStockModalState((prev) => ({
                      ...prev,
                      targetWeight: e.target.value ? e.target.value : undefined,
                    }))
                  }
                  className="w-full p-2.5 rounded-2xl border border-neutral-300 text-xs font-bold bg-white"
                >
                  <option value="">Overall Product Stock (All Variants)</option>
                  {stockModalState.product.weightOptions.map((w) => (
                    <option key={w.weight} value={w.weight}>
                      {w.weight} — ₹{w.price} (Stock: {w.stock ?? stockModalState.product?.inventoryCount ?? 100})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3 text-xs font-bold">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-neutral-500">
                    {stockModalState.type === 'restock'
                      ? 'Units to Add (+)'
                      : stockModalState.type === 'destock'
                      ? 'Units to Remove (-)'
                      : 'Exact Stock Count to Set'} *
                  </label>
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setStockModalState((prev) => ({
                          ...prev,
                          quantity: 10,
                          type: prev.type === 'set' ? 'restock' : prev.type,
                        }))
                      }
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold"
                    >
                      10
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStockModalState((prev) => ({
                          ...prev,
                          quantity: 25,
                          type: prev.type === 'set' ? 'restock' : prev.type,
                        }))
                      }
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold"
                    >
                      25
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStockModalState((prev) => ({
                          ...prev,
                          quantity: 50,
                          type: prev.type === 'set' ? 'restock' : prev.type,
                        }))
                      }
                      className="px-2 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-[10px] font-bold"
                    >
                      50
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStockModalState((prev) => ({
                          ...prev,
                          quantity: 0,
                          type: 'set',
                          note: 'Set to 0 (Out of Stock)',
                        }))
                      }
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[10px] font-bold"
                      title="Set stock to 0"
                    >
                      Set 0
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  required
                  min="0"
                  value={stockModalState.quantity}
                  onChange={(e) =>
                    setStockModalState({
                      ...stockModalState,
                      quantity: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
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
                  stockModalState.type === 'restock'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : stockModalState.type === 'destock'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-black hover:bg-neutral-800'
                }`}
              >
                {stockModalState.type === 'restock'
                  ? `Confirm Restock (+${stockModalState.quantity})`
                  : stockModalState.type === 'destock'
                  ? `Confirm Destock (-${stockModalState.quantity})`
                  : `Confirm Stock = ${stockModalState.quantity}`}
              </button>
            </div>
          </motion.form>
        </div>
      )}

      {/* COMPREHENSIVE STOCK HISTORY & AUDIT LOG FULL PAGE MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl w-full h-full max-w-7xl max-h-[95vh] shadow-2xl text-left flex flex-col overflow-hidden border border-neutral-200"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-subtle">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-black">Stock History & Audit Log</h3>
                    <span className="bg-black text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {stockHistoryLogs.length} Records
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Full chronological audit log of inventory restocks, destocks, out-of-stock changes, and storefront visibility updates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-500 hover:text-black hover:border-black transition-all cursor-pointer shadow-subtle"
                title="Close Full Page Log"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* Audit Log Summary Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 bg-neutral-100 rounded-xl border border-neutral-200">
                <span className="text-[10px] font-bold text-neutral-500 uppercase block">Total Logs</span>
                <span className="text-base font-black text-black font-mono">{stockHistoryLogs.length}</span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Out of Stock</span>
                <span className="text-base font-black text-rose-900 font-mono">
                  {stockHistoryLogs.filter((l) => l.type === 'out_of_stock').length}
                </span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">In Stock</span>
                <span className="text-base font-black text-emerald-900 font-mono">
                  {stockHistoryLogs.filter((l) => l.type === 'in_stock').length}
                </span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Hidden / Visible</span>
                <span className="text-base font-black text-amber-900 font-mono">
                  {stockHistoryLogs.filter((l) => l.type === 'hidden' || l.type === 'visible').length}
                </span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">Restock / Destock</span>
                <span className="text-base font-black text-blue-900 font-mono">
                  {stockHistoryLogs.filter((l) => l.type === 'restock' || l.type === 'destock').length}
                </span>
              </div>
            </div>

            {/* Date Range & Calendar Filters */}
            <div className="space-y-3 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-extrabold text-neutral-500 uppercase mr-1">Timeframe:</span>
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7d', label: '7 Days' },
                    { id: '30d', label: '30 Days' },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => {
                        setHistoryTimeframe(tf.id as AdminTimeframe);
                        setHistoryCustomDate('');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        historyTimeframe === tf.id && !historyCustomDate
                          ? 'bg-black text-white shadow-subtle'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* Calendar Date Picker */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-neutral-300">
                  <Calendar className="w-4 h-4 text-black" />
                  <span className="text-xs font-bold text-neutral-600">Calendar:</span>
                  <input
                    type="date"
                    value={historyCustomDate}
                    onChange={(e) => {
                      setHistoryCustomDate(e.target.value);
                      setHistoryTimeframe('custom');
                    }}
                    className="text-xs font-mono font-bold text-black bg-transparent border-none focus:outline-none cursor-pointer"
                  />
                  {historyCustomDate && (
                    <button
                      onClick={() => {
                        setHistoryCustomDate('');
                        setHistoryTimeframe('all');
                      }}
                      className="text-neutral-400 hover:text-black text-xs"
                      title="Clear custom date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Action Type Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-200">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'All Actions' },
                    { id: 'out_of_stock', label: '🚨 Out of Stock' },
                    { id: 'in_stock', label: '✅ In Stock' },
                    { id: 'hidden', label: '🙈 Hidden' },
                    { id: 'visible', label: '👁️ Visible' },
                    { id: 'restock', label: '📦 Restock' },
                    { id: 'destock', label: '🔻 Destock' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setHistoryTypeFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                        historyTypeFilter === filter.id
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search product or reason note..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Full-Width Spacious Audit Log Table */}
            <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-subtle">
              {filteredHistoryLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-black uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4">Product Name</th>
                        <th className="py-3.5 px-4">Action Performed</th>
                        <th className="py-3.5 px-4">Stock Movement</th>
                        <th className="py-3.5 px-4">Reason / Description Note</th>
                        <th className="py-3.5 px-4">Admin Author</th>
                        <th className="py-3.5 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {filteredHistoryLogs.map((log) => {
                        const isOutOfStock = log.type === 'out_of_stock';
                        const isInStock = log.type === 'in_stock';
                        const isHidden = log.type === 'hidden';
                        const isVisible = log.type === 'visible';
                        const isRestock = log.type === 'restock';
                        const isDestock = log.type === 'destock';

                        const badgeClass = isOutOfStock
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : isInStock
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : isHidden
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isVisible
                          ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                          : isRestock
                          ? 'bg-teal-100 text-teal-900 border-teal-300'
                          : 'bg-purple-100 text-purple-900 border-purple-300';

                        const badgeText = isOutOfStock
                          ? '🚨 Out of Stock'
                          : isInStock
                          ? '✅ Back In Stock'
                          : isHidden
                          ? '🙈 Hidden in Store'
                          : isVisible
                          ? '👁️ Visible in Store'
                          : isRestock
                          ? `📦 +${log.quantity} Restock`
                          : `🔻 -${log.quantity} Destock`;

                        return (
                          <tr
                            key={log.id}
                            onClick={() => setSelectedLogDetail(log)}
                            className="hover:bg-neutral-50/90 transition-colors cursor-pointer"
                          >
                            {/* Date & Time */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="block font-mono font-extrabold text-black text-xs">
                                {formatDisplayDate(log.date)}
                              </span>
                              <span className="block font-mono text-[10px] text-neutral-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {log.time}
                              </span>
                            </td>

                            {/* Product Name */}
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-black text-xs">{log.productName}</span>
                            </td>

                            {/* Action Performed */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase font-mono border inline-flex items-center gap-1 shadow-sm ${badgeClass}`}>
                                {badgeText}
                              </span>
                            </td>

                            {/* Stock Movement */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              {log.quantity !== undefined ? (
                                <span className={`font-mono font-black text-xs ${isRestock ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isRestock ? `+${log.quantity}` : `-${log.quantity}`} units
                                </span>
                              ) : log.previousStock !== undefined ? (
                                <span className="font-mono text-xs font-bold text-neutral-700">
                                  {log.previousStock} &rarr; {log.newStock ?? 0}
                                </span>
                              ) : (
                                <span className="text-neutral-400 font-mono text-[11px]">—</span>
                              )}
                            </td>

                            {/* Reason / Description Note */}
                            <td className="py-3 px-4 max-w-xs sm:max-w-md">
                              {log.note ? (
                                <div className="p-2 bg-neutral-50 rounded-xl border border-neutral-200/80 text-neutral-800 font-medium text-[11px] leading-relaxed line-clamp-2">
                                  {log.note}
                                </div>
                              ) : (
                                <span className="text-neutral-400 italic text-[11px]">No note recorded</span>
                              )}
                            </td>

                            {/* Admin Author */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-lg">
                                {log.adminName || 'Store Admin'}
                              </span>
                            </td>

                            {/* View Action */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLogDetail(log);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-black hover:text-white text-neutral-700 text-[10px] font-bold transition-all border border-neutral-200"
                              >
                                View Details &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-16 text-center text-xs text-neutral-400 space-y-2">
                  <p className="font-bold text-neutral-600 text-sm">No stock history audit records found.</p>
                  <p>When you restock, destock, mark out-of-stock or hide products, logs with reasons will appear here.</p>
                </div>
              )}
            </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between shrink-0">
              <span className="text-xs text-neutral-600 font-medium">
                Showing <strong className="text-black font-bold font-mono">{filteredHistoryLogs.length}</strong> of <strong className="text-black font-bold font-mono">{stockHistoryLogs.length}</strong> total recorded audit events.
              </span>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-black text-white text-xs font-black rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle"
              >
                Close Stock History Log
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DETAILED AUDIT LOG ENTRY VIEW MODAL */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-modal text-left"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-black" />
                <h3 className="text-base font-extrabold text-black">Audit Log Details</h3>
              </div>
              <button onClick={() => setSelectedLogDetail(null)} className="text-neutral-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-bold">Product:</span>
                  <span className="font-extrabold text-black text-sm">{selectedLogDetail.productName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-bold">Action Performed:</span>
                  <span className="font-bold font-mono uppercase text-black">{selectedLogDetail.type.replace(/_/g, ' ')}</span>
                </div>
                {selectedLogDetail.quantity !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-bold">Quantity Changed:</span>
                    <span className="font-black font-mono text-black">{selectedLogDetail.quantity} units</span>
                  </div>
                )}
                {selectedLogDetail.previousStock !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-bold">Stock Movement:</span>
                    <span className="font-bold font-mono text-neutral-700">
                      {selectedLogDetail.previousStock} units &rarr; {selectedLogDetail.newStock ?? 0} units
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-neutral-200 pt-2">
                  <span className="text-neutral-500 font-bold">Date & Time:</span>
                  <span className="font-bold font-mono text-black">
                    {formatDisplayDate(selectedLogDetail.date)} at {selectedLogDetail.time}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-bold">Logged By:</span>
                  <span className="font-bold text-black">{selectedLogDetail.adminName || 'Store Admin'}</span>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 font-bold mb-1">Reason / Description Note:</label>
                <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-300 font-medium text-neutral-900 leading-relaxed">
                  {selectedLogDetail.note || 'No specific note provided.'}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLogDetail(null)}
                className="w-full py-3 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all cursor-pointer"
              >
                Done
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
              <button onClick={() => setShowAddModal(false)} className="cursor-pointer"><X className="w-5 h-5 text-neutral-400 hover:text-black" /></button>
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
                  <label className="block text-neutral-500 mb-1">Inventory Units</label>
                  <input
                    type="number"
                    min="0"
                    value={newInventoryCount}
                    onChange={(e) => setNewInventoryCount(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Status Controls: Out of Stock & Hide Product in Homepage */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Storefront Status & Visibility</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    newOutOfStock ? 'bg-rose-50 border-rose-300 text-rose-900 font-black' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newOutOfStock}
                      onChange={(e) => setNewOutOfStock(e.target.checked)}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <span>🚨 Mark as Out of Stock</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    newIsHidden ? 'bg-amber-50 border-amber-300 text-amber-900 font-black' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={newIsHidden}
                      onChange={(e) => setNewIsHidden(e.target.checked)}
                      className="accent-amber-600 w-4 h-4"
                    />
                    <span>🙈 Hide Product from Storefront</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 font-bold mb-1">
                    Optional Description / Status Reason Note:
                  </label>
                  <input
                    type="text"
                    value={newStatusReason}
                    onChange={(e) => setNewStatusReason(e.target.value)}
                    placeholder="e.g. Seasonal raw mango shortage, Batch preparation in progress..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Grandma Story & Cleanliness Text Section */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Grandma Recipe Story & Traditional Heritage</span>
                </span>
                
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold mb-1">Heritage Story</label>
                  <textarea
                    rows={2}
                    value={newGrandmaStory}
                    onChange={(e) => setNewGrandmaStory(e.target.value)}
                    placeholder="e.g. Crafted following our maternal grandmother 1954 secret Andhra recipe..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 font-sans text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">How We Prepare</label>
                    <input
                      type="text"
                      value={newHowWeDoText}
                      onChange={(e) => setNewHowWeDoText(e.target.value)}
                      placeholder="e.g. Sun-ripened & slow hand-stirred"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Sourcing Origin</label>
                    <input
                      type="text"
                      value={newSourcingText}
                      onChange={(e) => setNewSourcingText(e.target.value)}
                      placeholder="e.g. Vijayawada Orchards & Guntur Farms"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Quality Promise</label>
                    <input
                      type="text"
                      value={newQualityGuaranteeText}
                      onChange={(e) => setNewQualityGuaranteeText(e.target.value)}
                      placeholder="e.g. 100% Preservative Free"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
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
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-neutral-400 uppercase px-1">
                    <span className="col-span-3">Selling Weight</span>
                    <span className="col-span-3">Price (₹)</span>
                    <span className="col-span-3">Stock Units</span>
                    <span className="col-span-3">Courier Weight (g)</span>
                  </div>
                  {newWeightOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.weight}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'weight', e.target.value)}
                        placeholder="e.g. 500g"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        value={opt.price}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'price', Number(e.target.value))}
                        placeholder="Cost (₹)"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                      />
                      <input
                        type="number"
                        value={opt.stock ?? ''}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'stock', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="Stock (e.g. 50)"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold text-emerald-700"
                      />
                      <input
                        type="number"
                        value={opt.shippingWeightGrams ?? ''}
                        onChange={(e) => handleUpdateWeightRow(setNewWeightOptions, idx, 'shippingWeightGrams', e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="Packed (g) e.g. 680"
                        className="w-1/4 p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-mono font-bold text-purple-900"
                        title="Packed shipping gross weight including container & box (grams)"
                      />
                      {newWeightOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWeightRow(setNewWeightOptions, idx)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-neutral-400 italic">
                    💡 <strong>Courier Weight (g)</strong>: Actual gross weight of product + jar + packaging box used by logistics partners.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Brief product description..." className="w-full p-3 rounded-2xl border border-neutral-300" />
              </div>

              <button type="submit" className="w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer shadow-subtle hover:bg-neutral-800 transition-all">
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
              <button onClick={() => setEditingProduct(null)} className="cursor-pointer"><X className="w-5 h-5 text-neutral-400 hover:text-black" /></button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-500 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category Selection with inline New Category Trigger */}
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
                  <label className="block text-neutral-500 mb-1">Dietary Type</label>
                  <select
                    value={editingProduct.isVeg ? 'veg' : 'non-veg'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isVeg: e.target.value === 'veg' })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-bold"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              {/* Editable Ingredients Checklist Tag System */}
              <div className="space-y-2">
                <label className="block text-neutral-500">Ingredients & Recipe Checklist</label>
                
                {/* Tag Pills */}
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
                  <label className="block text-neutral-500 mb-1">Taste Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={editingProduct.rating}
                    onChange={(e) => setEditingProduct({ ...editingProduct, rating: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Reviews Count</label>
                  <input
                    type="number"
                    value={editingProduct.reviewsCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reviewsCount: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Inventory Units</label>
                  <input
                    type="number"
                    min="0"
                    value={editingProduct.inventoryCount ?? 100}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inventoryCount: Number(e.target.value) })}
                    className="w-full p-3 rounded-2xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Status Controls: Out of Stock & Hide Product in Homepage */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Storefront Status & Visibility</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingProduct.outOfStock ? 'bg-rose-50 border-rose-300 text-rose-900 font-black' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.outOfStock)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, outOfStock: e.target.checked })}
                      className="accent-rose-600 w-4 h-4"
                    />
                    <span>🚨 Mark as Out of Stock</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingProduct.isHidden ? 'bg-amber-50 border-amber-300 text-amber-900 font-black' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isHidden)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isHidden: e.target.checked })}
                      className="accent-amber-600 w-4 h-4"
                    />
                    <span>🙈 Hide Product from Storefront</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-500 font-bold mb-1">
                    Optional Description / Status Reason Note:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.statusReason || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, statusReason: e.target.value })}
                    placeholder="e.g. Seasonal raw mango shortage, Batch preparation in progress..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Grandma Story & Cleanliness Text Section */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <span className="text-xs font-extrabold text-black flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-black" />
                  <span>Grandma Recipe Story & Traditional Heritage</span>
                </span>
                
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold mb-1">Heritage Story</label>
                  <textarea
                    rows={2}
                    value={editingProduct.grandmaStory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, grandmaStory: e.target.value })}
                    placeholder="e.g. Crafted following our maternal grandmother 1954 secret Andhra recipe..."
                    className="w-full p-2.5 rounded-xl border border-neutral-300 font-sans text-xs bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">How We Prepare</label>
                    <input
                      type="text"
                      value={editingProduct.howWeDoText || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, howWeDoText: e.target.value })}
                      placeholder="e.g. Sun-ripened & slow hand-stirred"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Sourcing Origin</label>
                    <input
                      type="text"
                      value={editingProduct.sourcingText || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sourcingText: e.target.value })}
                      placeholder="e.g. Vijayawada Orchards & Guntur Farms"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold mb-0.5">Quality Promise</label>
                    <input
                      type="text"
                      value={editingProduct.qualityGuaranteeText || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, qualityGuaranteeText: e.target.value })}
                      placeholder="e.g. 100% Preservative Free"
                      className="w-full p-2 border border-neutral-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5-STEP TRADITIONAL CRAFTSMANSHIP PROCESS EDITING SECTION */}
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
                              const currentSteps = editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS;
                              setEditingProduct({
                                ...editingProduct,
                                customProcessSteps: currentSteps.map((s, i) => (i === idx ? { ...s, title: val } : s)),
                              });
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
                              const currentSteps = editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS;
                              setEditingProduct({
                                ...editingProduct,
                                customProcessSteps: currentSteps.map((s, i) => (i === idx ? { ...s, subtitle: val } : s)),
                              });
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
                            const currentSteps = editingProduct.customProcessSteps || DEFAULT_PROCESS_STEPS;
                            setEditingProduct({
                              ...editingProduct,
                              customProcessSteps: currentSteps.map((s, i) => (i === idx ? { ...s, description: val } : s)),
                            });
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
                      checked={editingProduct.isBestSeller}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                      className="accent-black w-4 h-4"
                    />
                    <span>⭐ Best Seller</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={editingProduct.isNewArrival}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                      className="accent-black w-4 h-4"
                    />
                    <span>✨ New Arrival</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 bg-white border border-neutral-200 rounded-xl cursor-pointer hover:border-black">
                    <input
                      type="checkbox"
                      checked={editingProduct.isFestival}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isFestival: e.target.checked })}
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

              {/* Multiple Gallery Photos Manager */}
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
                          const currentGallery = editingProduct.gallery || [editingProduct.image];
                          const newGal = currentGallery.filter((_, i) => i !== idx);
                          setEditingProduct({
                            ...editingProduct,
                            gallery: newGal,
                            image: newGal[0] || editingProduct.image,
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
                  label="Add / Replace Product Photos"
                  value=""
                  onChange={(url) => {
                    if (url) {
                      const currentGallery = editingProduct.gallery || [editingProduct.image];
                      setEditingProduct({
                        ...editingProduct,
                        gallery: [...currentGallery, url],
                        image: currentGallery.length === 0 ? url : editingProduct.image,
                      });
                    }
                  }}
                  multiple={true}
                  onMultipleChange={(urls) => {
                    if (urls.length > 0) {
                      const currentGallery = editingProduct.gallery || [editingProduct.image];
                      setEditingProduct({
                        ...editingProduct,
                        gallery: [...currentGallery, ...urls],
                      });
                    }
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
                    onClick={() => {
                      setEditingProduct({
                        ...editingProduct,
                        weightOptions: [...editingProduct.weightOptions, { weight: '300g', price: 199 }],
                      });
                    }}
                    className="px-2.5 py-1 bg-black text-white text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Gram Tier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-neutral-400 uppercase px-1">
                    <span className="col-span-3">Selling Weight</span>
                    <span className="col-span-3">Price (₹)</span>
                    <span className="col-span-3">Stock Units</span>
                    <span className="col-span-3">Courier Weight (g)</span>
                  </div>
                  {editingProduct.weightOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.weight}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) => (i === idx ? { ...o, weight: val } : o)),
                          });
                        }}
                        placeholder="e.g. 500g"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        value={opt.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) => (i === idx ? { ...o, price: val } : o)),
                          });
                        }}
                        placeholder="Cost (₹)"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold"
                      />
                      <input
                        type="number"
                        value={opt.stock ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) => (i === idx ? { ...o, stock: val } : o)),
                          });
                        }}
                        placeholder="Stock"
                        className="w-1/4 p-2.5 rounded-xl border border-neutral-300 bg-white text-xs font-mono font-bold text-emerald-700"
                      />
                      <input
                        type="number"
                        value={opt.shippingWeightGrams ?? ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          setEditingProduct({
                            ...editingProduct,
                            weightOptions: editingProduct.weightOptions.map((o, i) => (i === idx ? { ...o, shippingWeightGrams: val } : o)),
                          });
                        }}
                        placeholder="Packed (g)"
                        className="w-1/4 p-2.5 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-mono font-bold text-purple-900"
                        title="Packed shipping gross weight including container & box (grams)"
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
                          className="p-1.5 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <p className="text-[10px] text-neutral-400 italic">
                    💡 <strong>Courier Weight (g)</strong>: Explicit packed gross weight per variant used by logistics calculators.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-neutral-300"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3.5 border border-neutral-200 hover:bg-neutral-100 rounded-2xl text-xs font-bold text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl cursor-pointer shadow-subtle hover:bg-neutral-800 transition-all">
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
                <p className="text-xs text-neutral-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
              <img src={deleteCategoryConfirm.image} alt="" className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-black">{deleteCategoryConfirm.name}</p>
                <p className="text-[11px] text-neutral-500">{deleteCategoryConfirm.itemCount} items linked</p>
              </div>
            </div>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete the category <strong>"{deleteCategoryConfirm.name}"</strong>? Products in this category will not be deleted, but will become uncategorized.
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
                  if (categoryFilter === deleteCategoryConfirm.name) {
                    setCategoryFilter('All');
                  }
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

      {/* ADD NEW CATEGORY MODAL WITH LOGO ZOOM & PAN ADJUSTER */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-modal text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-black">Add New Food Category</h3>
                <p className="text-xs text-neutral-500">Create a category, upload logo photo & adjust zoom / pan.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-neutral-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Traditional Andhra Pickles, Pure Ghee Sweets..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-medium focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              {/* LOGO ZOOM & PAN ADJUSTER INTERACTIVE CANVAS */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-black">
                    <Sliders className="w-4 h-4 text-black" />
                    <span>Interactive Logo Alignment & Zoom Adjuster</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatScale(1);
                      setNewCatPanX(0);
                      setNewCatPanY(0);
                    }}
                    className="text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500">
                  Drag the circular canvas below to position the photo, and use the zoom slider to eliminate unwanted empty margins.
                </p>

                {/* Circular Viewport Interactive Box */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div
                    onMouseDown={(e) => {
                      if (!newCatImage) return;
                      setIsCatInteracting(true);
                      catDragStartRef.current = {
                        x: e.clientX,
                        y: e.clientY,
                        initialPanX: newCatPanX,
                        initialPanY: newCatPanY,
                      };
                    }}
                    onMouseMove={(e) => {
                      if (!isCatInteracting || !catDragStartRef.current) return;
                      const deltaX = e.clientX - catDragStartRef.current.x;
                      const deltaY = e.clientY - catDragStartRef.current.y;
                      setNewCatPanX(catDragStartRef.current.initialPanX + deltaX);
                      setNewCatPanY(catDragStartRef.current.initialPanY + deltaY);
                    }}
                    onMouseUp={() => {
                      setIsCatInteracting(false);
                      catDragStartRef.current = null;
                    }}
                    onMouseLeave={() => {
                      setIsCatInteracting(false);
                      catDragStartRef.current = null;
                    }}
                    className={`w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-neutral-400 relative select-none shadow-md ${
                      newCatImage ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    } bg-neutral-900 flex items-center justify-center`}
                  >
                    {newCatImage ? (
                      <img
                        src={newCatImage}
                        alt="Category Preview"
                        draggable={false}
                        style={{
                          transform: `translate(${newCatPanX}px, ${newCatPanY}px) scale(${newCatScale})`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full h-full object-cover pointer-events-none transition-transform duration-75 ease-out rounded-full"
                      />
                    ) : (
                      <div className="text-neutral-400 text-[10px] text-center p-2">
                        Upload or select photo below
                      </div>
                    )}
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                    <span className="flex items-center gap-1"><ZoomOut className="w-3.5 h-3.5" /> 50%</span>
                    <span className="text-black font-extrabold">Zoom: {Math.round(newCatScale * 100)}%</span>
                    <span className="flex items-center gap-1">300% <ZoomIn className="w-3.5 h-3.5" /></span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={newCatScale}
                    onChange={(e) => setNewCatScale(parseFloat(e.target.value))}
                    className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 mr-1">Quick Scale:</span>
                  {[
                    { label: '50%', scale: 0.5 },
                    { label: '75%', scale: 0.75 },
                    { label: '100% (Fit)', scale: 1.0 },
                    { label: '125%', scale: 1.25 },
                    { label: '150%', scale: 1.5 },
                    { label: '200%', scale: 2.0 },
                  ].map((preset) => (
                    <button
                      key={preset.scale}
                      type="button"
                      onClick={() => setNewCatScale(preset.scale)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        newCatScale === preset.scale
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="space-y-2">
                <DragDropImagePicker
                  label="Category Cover Photo / URL *"
                  value={newCatImage}
                  onChange={(url) => setNewCatImage(url)}
                  helperText="Upload category cover photo or paste an image link."
                />

                {/* Quick Preset Photos */}
                <div className="pt-1">
                  <span className="text-[11px] text-neutral-500 block mb-1">Quick Food Photo Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: '🌶️ Pickles', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop' },
                      { name: '🍯 Sweets', url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop' },
                      { name: '🫓 Snacks', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop' },
                      { name: '🌾 Podis', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop' },
                      { name: '🥐 Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop' },
                      { name: '🎁 Gift Boxes', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setNewCatImage(preset.url)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          newCatImage === preset.url
                            ? 'bg-black text-white border-black'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Brief description of this food category..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-medium focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
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
          </motion.div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-modal text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-extrabold text-black">Edit Category: {editingCategory.name}</h3>
                <p className="text-xs text-neutral-500">Update category title, image, and adjust logo zoom/alignment.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCategory(editingCategory.id, {
                  name: editingCategory.name,
                  image: editingCategory.image,
                  description: editingCategory.description,
                  imageScale: editingCategory.imageScale,
                  panOffsetX: editingCategory.panOffsetX,
                  panOffsetY: editingCategory.panOffsetY,
                });
                if (categoryFilter !== 'All' && categoryFilter !== editingCategory.name) {
                  setCategoryFilter(editingCategory.name);
                }
                setEditingCategory(null);
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-neutral-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-medium focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              {/* LOGO ZOOM & PAN ADJUSTER INTERACTIVE CANVAS */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-black">
                    <Sliders className="w-4 h-4 text-black" />
                    <span>Interactive Logo Alignment & Zoom Adjuster</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory({
                        ...editingCategory,
                        imageScale: 1,
                        panOffsetX: 0,
                        panOffsetY: 0,
                      });
                    }}
                    className="text-[10px] text-neutral-500 hover:text-black flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500">
                  Drag the circular viewport to position the logo, and adjust zoom to fit properly.
                </p>

                {/* Circular Viewport Interactive Box */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div
                    onMouseDown={(e) => {
                      if (!editingCategory.image) return;
                      setIsCatInteracting(true);
                      catDragStartRef.current = {
                        x: e.clientX,
                        y: e.clientY,
                        initialPanX: editingCategory.panOffsetX || 0,
                        initialPanY: editingCategory.panOffsetY || 0,
                      };
                    }}
                    onMouseMove={(e) => {
                      if (!isCatInteracting || !catDragStartRef.current) return;
                      const deltaX = e.clientX - catDragStartRef.current.x;
                      const deltaY = e.clientY - catDragStartRef.current.y;
                      setEditingCategory({
                        ...editingCategory,
                        panOffsetX: catDragStartRef.current.initialPanX + deltaX,
                        panOffsetY: catDragStartRef.current.initialPanY + deltaY,
                      });
                    }}
                    onMouseUp={() => {
                      setIsCatInteracting(false);
                      catDragStartRef.current = null;
                    }}
                    onMouseLeave={() => {
                      setIsCatInteracting(false);
                      catDragStartRef.current = null;
                    }}
                    className={`w-32 h-32 rounded-full overflow-hidden border-2 border-dashed border-neutral-400 relative select-none shadow-md ${
                      editingCategory.image ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    } bg-neutral-900 flex items-center justify-center`}
                  >
                    {editingCategory.image ? (
                      <img
                        src={editingCategory.image}
                        alt="Category Preview"
                        draggable={false}
                        style={{
                          transform: `translate(${editingCategory.panOffsetX || 0}px, ${editingCategory.panOffsetY || 0}px) scale(${editingCategory.imageScale || 1})`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full h-full object-cover pointer-events-none transition-transform duration-75 ease-out rounded-full"
                      />
                    ) : (
                      <div className="text-neutral-400 text-[10px] text-center p-2">
                        Upload or paste image below
                      </div>
                    )}
                  </div>
                </div>

                {/* Zoom Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600">
                    <span className="flex items-center gap-1"><ZoomOut className="w-3.5 h-3.5" /> 50%</span>
                    <span className="text-black font-extrabold">Zoom: {Math.round((editingCategory.imageScale || 1) * 100)}%</span>
                    <span className="flex items-center gap-1">300% <ZoomIn className="w-3.5 h-3.5" /></span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={editingCategory.imageScale || 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        imageScale: parseFloat(e.target.value),
                      })
                    }
                    className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 mr-1">Quick Scale:</span>
                  {[
                    { label: '50%', scale: 0.5 },
                    { label: '75%', scale: 0.75 },
                    { label: '100% (Fit)', scale: 1.0 },
                    { label: '125%', scale: 1.25 },
                    { label: '150%', scale: 1.5 },
                    { label: '200%', scale: 2.0 },
                  ].map((preset) => (
                    <button
                      key={preset.scale}
                      type="button"
                      onClick={() =>
                        setEditingCategory({
                          ...editingCategory,
                          imageScale: preset.scale,
                        })
                      }
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        (editingCategory.imageScale || 1) === preset.scale
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="space-y-2">
                <DragDropImagePicker
                  label="Category Photo Upload / URL *"
                  value={editingCategory.image || ''}
                  onChange={(url) => setEditingCategory({ ...editingCategory, image: url })}
                  helperText="Upload category cover photo or paste an image link."
                />

                {/* Preset Suggestions */}
                <div className="pt-1">
                  <span className="text-[11px] text-neutral-500 block mb-1">Quick Food Photo Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: '🌶️ Pickles', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop' },
                      { name: '🍯 Sweets', url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=800&auto=format&fit=crop' },
                      { name: '🫓 Snacks', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop' },
                      { name: '🌾 Podis', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=800&auto=format&fit=crop' },
                      { name: '🥐 Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop' },
                      { name: '🎁 Gift Boxes', url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=800&auto=format&fit=crop' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, image: preset.url })}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          editingCategory.image === preset.url
                            ? 'bg-black text-white border-black'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Brief description of this food category..."
                  className="w-full p-3 rounded-2xl border border-neutral-300 font-medium focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-neutral-100">
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
          </motion.div>
        </div>
      )}

    </div>
  );
};
