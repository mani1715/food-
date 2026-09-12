import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { HeroBannerSlide, HeaderAnnouncement, CustomHeaderMenuItem, HeaderSubMenuItem } from '../../types';
import {
  Image as ImageIcon,
  Volume2,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  Menu,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Search,
  Heart,
  User,
  Package,
  ShoppingBag,
  RotateCcw,
  Layers,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Link as LinkIcon,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Hand,
  Crosshair,
  RefreshCw,
} from 'lucide-react';
import { DragDropImagePicker } from './DragDropImagePicker';

export const BannersManagementTab: React.FC = () => {
  const {
    heroBanners,
    headerAnnouncements,
    headerSettings,
    categories,
    products,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    addHeaderAnnouncement,
    updateHeaderAnnouncement,
    deleteHeaderAnnouncement,
    updateHeaderSettings,
  } = useApp();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'banners' | 'top_rotating' | 'marquee' | 'categories' | 'icons'>(() => {
    const stored = localStorage.getItem('aura_admin_banner_subtab');
    if (stored && ['banners', 'top_rotating', 'marquee', 'categories', 'icons'].includes(stored)) {
      return stored as any;
    }
    return 'banners';
  });

  useEffect(() => {
    localStorage.setItem('aura_admin_banner_subtab', activeSubTab);
  }, [activeSubTab]);

  // Modal / Form state for Hero Banners
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerLinkMode, setBannerLinkMode] = useState<'category' | 'product' | 'custom'>('category');
  const [selectedBannerCategory, setSelectedBannerCategory] = useState<string>('');
  const [selectedBannerProductId, setSelectedBannerProductId] = useState<string>('');
  const [customBannerLink, setCustomBannerLink] = useState<string>('/products');
  const [bannerForm, setBannerForm] = useState<Omit<HeroBannerSlide, 'id'>>({
    title: '',
    subtitle: '',
    badge: 'FRESH HOMEMADE',
    image: '',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    enabled: true,
    objectPosition: 'center',
    objectFit: 'cover',
    overlayOpacity: 'dark',
    imageScale: 1,
    panOffsetX: 0,
    panOffsetY: 0,
  });

  // Hand Drag & Pinch Zoom Interaction State
  const [isInteracting, setIsInteracting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialPanX: number; initialPanY: number } | null>(null);
  const touchPinchRef = useRef<{ initialDistance: number; initialScale: number } | null>(null);

  // State for Top Rotating Announcements
  const [newTopAnnText, setNewTopAnnText] = useState('');
  const [editingTopAnnId, setEditingTopAnnId] = useState<string | null>(null);
  const [editingTopAnnText, setEditingTopAnnText] = useState('');

  // Form state for Marquee Announcements
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editingAnnText, setEditingAnnText] = useState('');

  // Modal / Form state for Header Categories Menu Manager
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<{
    label: string;
    path: string;
    isSpecial: boolean;
    subCategories: HeaderSubMenuItem[];
  }>({
    label: '',
    path: '/products',
    isSpecial: false,
    subCategories: [],
  });

  // Sub-category form picker
  const [subItemType, setSubItemType] = useState<'category' | 'product' | 'custom'>('category');
  const [selectedCatName, setSelectedCatName] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [customSubLabel, setCustomSubLabel] = useState('');
  const [customSubPath, setCustomSubPath] = useState('');

  // Open modal for new banner
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerLinkMode('category');
    const firstCat = categories[0]?.name || '';
    setSelectedBannerCategory(firstCat);
    setSelectedBannerProductId(products[0]?.id || '');
    setCustomBannerLink('/products');
    setBannerForm({
      title: '',
      subtitle: '',
      badge: 'LIMITED TIME OFFER',
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      ctaText: 'Shop Now',
      ctaLink: firstCat ? `/products?category=${encodeURIComponent(firstCat)}` : '/products',
      enabled: true,
      objectPosition: 'center',
      objectFit: 'cover',
      overlayOpacity: 'dark',
      imageScale: 1,
      panOffsetX: 0,
      panOffsetY: 0,
    });
    setShowBannerModal(true);
  };

  // Open modal for editing banner
  const handleOpenEditBanner = (banner: HeroBannerSlide) => {
    setEditingBannerId(banner.id);
    const link = banner.ctaLink || '/products';
    if (link.startsWith('/product/')) {
      setBannerLinkMode('product');
      const pId = link.replace('/product/', '').split('?')[0];
      setSelectedBannerProductId(pId);
      setSelectedBannerCategory(categories[0]?.name || '');
      setCustomBannerLink(link);
    } else if (link.includes('category=')) {
      setBannerLinkMode('category');
      try {
        const cat = decodeURIComponent(link.split('category=')[1].split('&')[0]);
        setSelectedBannerCategory(cat);
      } catch {
        setSelectedBannerCategory(categories[0]?.name || '');
      }
      setSelectedBannerProductId(products[0]?.id || '');
      setCustomBannerLink(link);
    } else {
      setBannerLinkMode('custom');
      setCustomBannerLink(link);
      setSelectedBannerCategory(categories[0]?.name || '');
      setSelectedBannerProductId(products[0]?.id || '');
    }

    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      badge: banner.badge,
      image: banner.image,
      ctaText: banner.ctaText || 'Shop Now',
      ctaLink: link,
      enabled: banner.enabled,
      objectPosition: banner.objectPosition || 'center',
      objectFit: banner.objectFit || 'cover',
      overlayOpacity: banner.overlayOpacity || 'dark',
      imageScale: banner.imageScale !== undefined ? banner.imageScale : 1,
      panOffsetX: banner.panOffsetX !== undefined ? banner.panOffsetX : 0,
      panOffsetY: banner.panOffsetY !== undefined ? banner.panOffsetY : 0,
    });
    setShowBannerModal(true);
  };

  // Link Mode Switcher Handlers
  const handleLinkModeChange = (mode: 'category' | 'product' | 'custom') => {
    setBannerLinkMode(mode);
    if (mode === 'category') {
      const cat = selectedBannerCategory || categories[0]?.name || '';
      setSelectedBannerCategory(cat);
      setBannerForm((prev) => ({
        ...prev,
        ctaLink: cat ? `/products?category=${encodeURIComponent(cat)}` : '/products',
      }));
    } else if (mode === 'product') {
      const prodId = selectedBannerProductId || products[0]?.id || '';
      setSelectedBannerProductId(prodId);
      setBannerForm((prev) => ({
        ...prev,
        ctaLink: prodId ? `/product/${prodId}` : '/products',
      }));
    } else {
      setBannerForm((prev) => ({
        ...prev,
        ctaLink: customBannerLink || '/products',
      }));
    }
  };

  const handleSelectBannerCategory = (catName: string) => {
    setSelectedBannerCategory(catName);
    setBannerForm((prev) => ({
      ...prev,
      ctaLink: catName ? `/products?category=${encodeURIComponent(catName)}` : '/products',
    }));
  };

  const handleSelectBannerProduct = (prodId: string) => {
    setSelectedBannerProductId(prodId);
    setBannerForm((prev) => ({
      ...prev,
      ctaLink: prodId ? `/product/${prodId}` : '/products',
    }));
  };

  const handleCustomLinkChange = (linkVal: string) => {
    setCustomBannerLink(linkVal);
    setBannerForm((prev) => ({
      ...prev,
      ctaLink: linkVal,
    }));
  };

  // Submit banner form
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title.trim() || !bannerForm.image.trim()) return;

    const formattedBanner: Omit<HeroBannerSlide, 'id'> = {
      ...bannerForm,
      imageScale: typeof bannerForm.imageScale === 'number' ? bannerForm.imageScale : (Number(bannerForm.imageScale) || 1),
      panOffsetX: typeof bannerForm.panOffsetX === 'number' ? bannerForm.panOffsetX : (Number(bannerForm.panOffsetX) || 0),
      panOffsetY: typeof bannerForm.panOffsetY === 'number' ? bannerForm.panOffsetY : (Number(bannerForm.panOffsetY) || 0),
    };

    if (editingBannerId) {
      updateHeroBanner(editingBannerId, formattedBanner);
    } else {
      addHeroBanner(formattedBanner);
    }

    setShowBannerModal(false);
    setEditingBannerId(null);
  };

  // -------------------------------------------------------------
  // DIRECT HAND DRAG & PINCH-ZOOM LOGIC ON IMAGE CANVAS
  // -------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsInteracting(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: bannerForm.panOffsetX || 0,
      initialPanY: bannerForm.panOffsetY || 0,
    };
  };

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setBannerForm((prev) => ({
      ...prev,
      panOffsetX: Math.round(dragStartRef.current!.initialPanX + deltaX),
      panOffsetY: Math.round(dragStartRef.current!.initialPanY + deltaY),
    }));
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    setIsInteracting(false);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleCanvasMouseMove);
    window.addEventListener('mouseup', handleCanvasMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleCanvasMouseMove);
      window.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  // Touch handlers for Mobile (1-finger pan, 2-finger pinch zoom)
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsInteracting(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        initialPanX: bannerForm.panOffsetX || 0,
        initialPanY: bannerForm.panOffsetY || 0,
      };
      touchPinchRef.current = null;
    } else if (e.touches.length === 2) {
      setIsInteracting(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchPinchRef.current = {
        initialDistance: dist,
        initialScale: bannerForm.imageScale || 1,
      };
      dragStartRef.current = null;
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragStartRef.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      setBannerForm((prev) => ({
        ...prev,
        panOffsetX: Math.round(dragStartRef.current!.initialPanX + deltaX),
        panOffsetY: Math.round(dragStartRef.current!.initialPanY + deltaY),
      }));
    } else if (e.touches.length === 2 && touchPinchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (touchPinchRef.current.initialDistance > 0) {
        const factor = currentDist / touchPinchRef.current.initialDistance;
        const newScale = Math.min(Math.max(touchPinchRef.current.initialScale * factor, 0.5), 3.0);
        setBannerForm((prev) => ({
          ...prev,
          imageScale: parseFloat(newScale.toFixed(2)),
        }));
      }
    }
  };

  const handleCanvasTouchEnd = () => {
    setIsInteracting(false);
    dragStartRef.current = null;
    touchPinchRef.current = null;
  };

  // Mouse wheel zoom on canvas
  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    setBannerForm((prev) => {
      const currentScale = prev.imageScale || 1;
      const nextScale = Math.min(Math.max(currentScale + zoomStep, 0.5), 3.0);
      return {
        ...prev,
        imageScale: parseFloat(nextScale.toFixed(2)),
      };
    });
  };

  const handleResetPositionAndZoom = () => {
    setBannerForm((prev) => ({
      ...prev,
      imageScale: 1,
      panOffsetX: 0,
      panOffsetY: 0,
    }));
  };

  const handleAdjustZoomStep = (delta: number) => {
    setBannerForm((prev) => {
      const currentScale = prev.imageScale || 1;
      const nextScale = Math.min(Math.max(currentScale + delta, 0.5), 3.0);
      return {
        ...prev,
        imageScale: parseFloat(nextScale.toFixed(2)),
      };
    });
  };

  // Top Rotating Announcements Handlers
  const currentTopAnnouncements = headerSettings?.topRotatingAnnouncements || [
    { id: 'top-1', text: '🌶️ Fresh Homemade Andhra Pickles Delivered Daily Nationwide', enabled: true },
    { id: 'top-2', text: '🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love', enabled: true },
    { id: 'top-3', text: '🎁 Festival Gift Boxes & Return Gift Hampers Special Discount', enabled: true },
    { id: 'top-4', text: '✨ Free Shipping On Orders Above ₹499 • Fresh Batch Guarantee', enabled: true },
  ];

  const handleAddTopAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopAnnText.trim()) return;
    const newItem: HeaderAnnouncement = {
      id: `top-${Date.now()}`,
      text: newTopAnnText.trim(),
      enabled: true,
    };
    const updated = [...currentTopAnnouncements, newItem];
    updateHeaderSettings({ topRotatingAnnouncements: updated });
    setNewTopAnnText('');
  };

  const handleToggleTopAnn = (id: string) => {
    const updated = currentTopAnnouncements.map((a) =>
      a.id === id ? { ...a, enabled: !a.enabled } : a
    );
    updateHeaderSettings({ topRotatingAnnouncements: updated });
  };

  const handleDeleteTopAnn = (id: string) => {
    const updated = currentTopAnnouncements.filter((a) => a.id !== id);
    updateHeaderSettings({ topRotatingAnnouncements: updated });
  };

  const handleSaveEditTopAnn = (id: string) => {
    if (!editingTopAnnText.trim()) return;
    const updated = currentTopAnnouncements.map((a) =>
      a.id === id ? { ...a, text: editingTopAnnText.trim() } : a
    );
    updateHeaderSettings({ topRotatingAnnouncements: updated });
    setEditingTopAnnId(null);
    setEditingTopAnnText('');
  };

  // Marquee Announcement Handlers
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    addHeaderAnnouncement(newAnnouncementText.trim());
    setNewAnnouncementText('');
  };

  const handleStartEditAnn = (ann: HeaderAnnouncement) => {
    setEditingAnnId(ann.id);
    setEditingAnnText(ann.text);
  };

  const handleSaveEditAnn = (id: string) => {
    if (!editingAnnText.trim()) return;
    updateHeaderAnnouncement(id, { text: editingAnnText.trim() });
    setEditingAnnId(null);
    setEditingAnnText('');
  };

  // -------------------------------------------------------------
  // HEADER CATEGORIES & MENU MANAGER
  // -------------------------------------------------------------
  const defaultMenuItems: CustomHeaderMenuItem[] = [
    ...(categories || []).map((cat, index) => ({
      id: `menu-cat-${cat.id || index}`,
      label: cat.name.toUpperCase(),
      path: `/products?category=${encodeURIComponent(cat.name)}`,
      enabled: !(headerSettings?.disabledCategoryNames || []).includes(cat.name),
      order: index,
      subCategories: [
        {
          id: `sub-all-${cat.id || index}`,
          label: `All ${cat.name} Collection`,
          path: `/products?category=${encodeURIComponent(cat.name)}`,
          type: 'category' as const,
        },
      ],
    })),
    {
      id: 'menu-bestsellers',
      label: 'BEST SELLERS',
      path: '/products',
      enabled: true,
      order: 100,
      subCategories: [
        { id: 'sub-top-rated', label: 'Top Rated Items ⭐', path: '/products', type: 'custom' },
        { id: 'sub-grandma-sp', label: 'Grandma Specials 📜', path: '/products', type: 'custom' },
      ],
    },
    {
      id: 'menu-offers',
      label: 'OFFERS & SPECIALS',
      path: '/products?filter=new-arrivals',
      isSpecial: true,
      enabled: true,
      order: 101,
      subCategories: [
        { id: 'sub-af05', label: 'Use Code AF05 (5% OFF) 🎉', path: '/products', type: 'custom' },
        { id: 'sub-new', label: 'New Arrivals ✨', path: '/products?filter=new-arrivals', type: 'custom' },
        { id: 'sub-gift', label: 'Festival Gift Hampers 🎁', path: '/products?category=Gift%20Boxes', type: 'custom' },
      ],
    },
  ];

  const currentMenuItems: CustomHeaderMenuItem[] =
    headerSettings?.customMenuItems && headerSettings.customMenuItems.length > 0
      ? headerSettings.customMenuItems
      : defaultMenuItems;

  const handleOpenAddMenu = () => {
    setEditingMenuId(null);
    setMenuForm({
      label: '',
      path: '/products',
      isSpecial: false,
      subCategories: [],
    });
    setSubItemType('category');
    setSelectedCatName(categories[0]?.name || '');
    setSelectedProdId(products[0]?.id || '');
    setCustomSubLabel('');
    setCustomSubPath('');
    setShowMenuModal(true);
  };

  const handleOpenEditMenu = (item: CustomHeaderMenuItem) => {
    setEditingMenuId(item.id);
    setMenuForm({
      label: item.label,
      path: item.path,
      isSpecial: !!item.isSpecial,
      subCategories: item.subCategories || [],
    });
    setSubItemType('category');
    setSelectedCatName(categories[0]?.name || '');
    setSelectedProdId(products[0]?.id || '');
    setCustomSubLabel('');
    setCustomSubPath('');
    setShowMenuModal(true);
  };

  const handleToggleMenu = (id: string) => {
    const updated = currentMenuItems.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    updateHeaderSettings({ customMenuItems: updated });
  };

  const handleDeleteMenu = (id: string) => {
    const updated = currentMenuItems.filter((item) => item.id !== id);
    updateHeaderSettings({ customMenuItems: updated });
  };

  const handleMoveMenu = (index: number, direction: 'up' | 'down') => {
    const newItems = [...currentMenuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    updateHeaderSettings({ customMenuItems: newItems });
  };

  const handleAddSubItem = () => {
    let newItem: HeaderSubMenuItem | null = null;
    if (subItemType === 'category') {
      if (!selectedCatName) return;
      newItem = {
        id: `sub-cat-${Date.now()}`,
        label: selectedCatName,
        path: `/products?category=${encodeURIComponent(selectedCatName)}`,
        type: 'category',
      };
    } else if (subItemType === 'product') {
      const prod = products.find((p) => p.id === selectedProdId);
      if (!prod) return;
      newItem = {
        id: `sub-prod-${Date.now()}`,
        label: prod.name,
        path: `/product/${prod.id}`,
        type: 'product',
        targetId: prod.id,
      };
    } else {
      if (!customSubLabel.trim() || !customSubPath.trim()) return;
      newItem = {
        id: `sub-custom-${Date.now()}`,
        label: customSubLabel.trim(),
        path: customSubPath.trim(),
        type: 'custom',
      };
    }

    if (newItem) {
      setMenuForm({
        ...menuForm,
        subCategories: [...menuForm.subCategories, newItem],
      });
      setCustomSubLabel('');
      setCustomSubPath('');
    }
  };

  const handleRemoveSubItem = (subId: string) => {
    setMenuForm({
      ...menuForm,
      subCategories: menuForm.subCategories.filter((s) => s.id !== subId),
    });
  };

  const handleSaveMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.label.trim()) return;

    if (editingMenuId) {
      const updated = currentMenuItems.map((item) =>
        item.id === editingMenuId
          ? {
              ...item,
              label: menuForm.label.trim(),
              path: menuForm.path.trim() || '/products',
              isSpecial: menuForm.isSpecial,
              subCategories: menuForm.subCategories,
            }
          : item
      );
      updateHeaderSettings({ customMenuItems: updated });
    } else {
      const newItem: CustomHeaderMenuItem = {
        id: `menu-${Date.now()}`,
        label: menuForm.label.trim(),
        path: menuForm.path.trim() || '/products',
        isSpecial: menuForm.isSpecial,
        enabled: true,
        order: currentMenuItems.length,
        subCategories: menuForm.subCategories,
      };
      updateHeaderSettings({ customMenuItems: [...currentMenuItems, newItem] });
    }

    setShowMenuModal(false);
    setEditingMenuId(null);
  };

  const handleResetToDefaultMenus = () => {
    if (window.confirm('Reset header category menu items back to default categories?')) {
      updateHeaderSettings({ customMenuItems: defaultMenuItems });
    }
  };

  const zoomPercent = Math.round((bannerForm.imageScale || 1) * 100);
  const panX = bannerForm.panOffsetX || 0;
  const panY = bannerForm.panOffsetY || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Header & Navigation Sub-Tabs */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-black" />
              Banners, Header & Announcement Center
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Customize homepage hero banners with hand zoom/drag adjustments, direct click redirects, rotating top bars, and header links.
            </p>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 no-scrollbar">
          <button
            onClick={() => setActiveSubTab('banners')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'banners'
                ? 'bg-black text-white shadow-subtle'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Hero Banner Slides ({heroBanners.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('top_rotating')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'top_rotating'
                ? 'bg-black text-white shadow-subtle'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Top Rotating Bar ({currentTopAnnouncements.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('marquee')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'marquee'
                ? 'bg-black text-white shadow-subtle'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>Marquee Ticker ({headerAnnouncements.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-black text-white shadow-subtle'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Menu className="w-4 h-4 text-blue-500" />
            <span>Header Categories & Menu ({currentMenuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('icons')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'icons'
                ? 'bg-black text-white shadow-subtle'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Search className="w-4 h-4 text-purple-500" />
            <span>Header Action Icons</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. HERO BANNER SLIDES SUB-TAB */}
      {/* ============================================================== */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-black tracking-tight">Homepage Hero Banners</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Add, edit, adjust with direct hand drag & zoom, and set click redirect destinations.
              </p>
            </div>
            <button
              onClick={handleOpenAddBanner}
              className="px-4 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-subtle"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Banner Slide</span>
            </button>
          </div>

          {/* Banner Slides List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroBanners.map((banner, index) => (
              <div
                key={banner.id}
                className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900 group">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    style={{
                      transform: `translate(${banner.panOffsetX || 0}px, ${banner.panOffsetY || 0}px) scale(${banner.imageScale || 1})`,
                      transformOrigin: 'center center',
                    }}
                    className={`w-full h-full object-cover transition-transform duration-500`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20 p-4 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between pointer-events-auto">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-black text-[10px] font-black uppercase tracking-wider rounded-full">
                        {banner.badge || `Slide #${index + 1}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {((banner.imageScale && banner.imageScale !== 1) || banner.panOffsetX || banner.panOffsetY) && (
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-bold rounded-lg border border-amber-300/30 flex items-center gap-1">
                            <Hand className="w-2.5 h-2.5" />
                            {Math.round((banner.imageScale || 1) * 100)}%
                          </span>
                        )}
                        <button
                          onClick={() => updateHeroBanner(banner.id, { enabled: !banner.enabled })}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full flex items-center gap-1 transition-all cursor-pointer ${
                            banner.enabled ? 'bg-black text-white border border-white/20' : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {banner.enabled ? (
                            <>
                              <Eye className="w-3 h-3 text-white" /> Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Hidden
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white text-base font-extrabold line-clamp-1">{banner.title}</h3>
                      <p className="text-neutral-300 text-xs line-clamp-1">{banner.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white flex flex-col gap-2 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-700 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-black shrink-0" />
                    <span className="font-bold text-black">Redirects To:</span>
                    <span className="text-neutral-600 truncate font-mono">{banner.ctaLink || '/products'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] text-neutral-500 truncate">
                      <span className="font-semibold text-black">CTA:</span> {banner.ctaText || 'Shop Now'}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenEditBanner(banner)}
                        className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Edit Banner & Hand Zoom"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteHeroBanner(banner.id)}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TOP ROTATING ANNOUNCEMENT BAR */}
      {/* ============================================================== */}
      {activeSubTab === 'top_rotating' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Top Rotating Announcement Bar</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Manage the text lines that rotate one by one at the very top of the website (above the header).
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
              <span className="text-xs font-extrabold text-neutral-800">Show Top Rotating Bar:</span>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showTopRotatingBar: headerSettings?.showTopRotatingBar === false ? true : false,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  headerSettings?.showTopRotatingBar !== false
                    ? 'bg-black text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showTopRotatingBar !== false ? 'Active (ON)' : 'Hidden (OFF)'}
              </button>
            </div>
          </div>

          {/* Add New Top Announcement Form */}
          <form onSubmit={handleAddTopAnn} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              placeholder="e.g. 🍯 Pure Ghee Sweets & Authentic Delicacies Crafted with Love"
              value={newTopAnnText}
              onChange={(e) => setNewTopAnnText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newTopAnnText.trim()}
              className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Top Text</span>
            </button>
          </form>

          {/* Top Announcements List */}
          <div className="space-y-3 max-w-3xl">
            {currentTopAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  ann.enabled !== false ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                {editingTopAnnId === ann.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTopAnnText}
                      onChange={(e) => setEditingTopAnnText(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={() => handleSaveEditTopAnn(ann.id)}
                      className="p-2 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingTopAnnId(null)}
                      className="p-2 bg-neutral-200 text-neutral-700 rounded-xl text-xs hover:bg-neutral-300 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 text-xs font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>{ann.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleTopAnn(ann.id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      ann.enabled !== false ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {ann.enabled !== false ? 'Enabled' : 'Disabled'}
                  </button>

                  {editingTopAnnId !== ann.id && (
                    <button
                      onClick={() => {
                        setEditingTopAnnId(ann.id);
                        setEditingTopAnnText(ann.text);
                      }}
                      className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Text"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTopAnn(ann.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MARQUEE SCROLLING TICKER */}
      {/* ============================================================== */}
      {activeSubTab === 'marquee' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Marquee Scrolling Ticker</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Manage the animated scrolling marquee ticker above the navigation header.
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-200">
              <span className="text-xs font-extrabold text-neutral-800">Show Marquee Ticker:</span>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showMarqueeTicker: headerSettings?.showMarqueeTicker === false ? true : false,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  headerSettings?.showMarqueeTicker !== false
                    ? 'bg-black text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showMarqueeTicker !== false ? 'Active (ON)' : 'Hidden (OFF)'}
              </button>
            </div>
          </div>

          {/* Add Announcement Input Form */}
          <form onSubmit={handleAddAnnouncement} className="flex gap-2 max-w-2xl">
            <input
              type="text"
              placeholder="e.g. ⚡ Use Code AF05 & get 5% additional discount on your First Purchase!"
              value={newAnnouncementText}
              onChange={(e) => setNewAnnouncementText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-2xl text-xs focus:ring-2 focus:ring-black focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newAnnouncementText.trim()}
              className="px-5 py-2.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Marquee Text</span>
            </button>
          </form>

          {/* Announcement List */}
          <div className="space-y-3 max-w-3xl">
            {headerAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  ann.enabled !== false ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                {editingAnnId === ann.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingAnnText}
                      onChange={(e) => setEditingAnnText(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      onClick={() => handleSaveEditAnn(ann.id)}
                      className="p-2 bg-black text-white rounded-xl text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingAnnId(null)}
                      className="p-2 bg-neutral-200 text-neutral-700 rounded-xl text-xs hover:bg-neutral-300 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 text-xs font-semibold text-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>{ann.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateHeaderAnnouncement(ann.id, { enabled: !ann.enabled })}
                    className={`px-3 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      ann.enabled ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {ann.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  {editingAnnId !== ann.id && (
                    <button
                      onClick={() => handleStartEditAnn(ann)}
                      className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                      title="Edit Text"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteHeaderAnnouncement(ann.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HEADER CATEGORIES & MENU MANAGER */}
      {/* ============================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5 text-black" />
                <h2 className="text-xl font-extrabold text-black tracking-tight">Header Categories & Dropdown Navigation</h2>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Rearrange, rename, toggle on/off, add special promotional buttons, and configure sub-category dropdown menus.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToDefaultMenus}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Reset to Store Categories"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <button
                onClick={handleOpenAddMenu}
                className="px-4 py-2 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
              >
                <Plus className="w-4 h-4" />
                <span>Add Header Category</span>
              </button>
            </div>
          </div>

          {/* Menu Items Table / Cards */}
          <div className="space-y-3">
            {currentMenuItems.map((item, index) => (
              <div
                key={item.id || index}
                className={`p-4 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.enabled ? 'bg-white border-neutral-200 shadow-sm' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveMenu(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-600 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveMenu(index, 'down')}
                      disabled={index === currentMenuItems.length - 1}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-600 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="w-7 h-7 rounded-xl bg-neutral-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-black tracking-wider uppercase truncate">{item.label}</span>
                      {item.isSpecial && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase">
                          Special Offer Tag
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 font-mono">({item.path})</span>
                    </div>

                    {item.subCategories && item.subCategories.length > 0 ? (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-neutral-500">Dropdown Items ({item.subCategories.length}):</span>
                        {item.subCategories.map((sub, sIdx) => (
                          <span
                            key={sub.id || sIdx}
                            className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[11px] font-semibold rounded-md border border-neutral-200 truncate max-w-[150px]"
                          >
                            {sub.label}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-400 mt-1">Direct link (No dropdown items)</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => handleToggleMenu(item.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                      item.enabled ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {item.enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hidden
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenEditMenu(item)}
                    className="p-2 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Edit Menu & Sub-items"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteMenu(item.id)}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Delete Menu Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. HEADER ACTION ICONS */}
      {/* ============================================================== */}
      {activeSubTab === 'icons' && (
        <div className="space-y-6">
          <div className="border-b border-neutral-200 pb-4">
            <h2 className="text-xl font-extrabold text-black tracking-tight">Header Action Icons & Buttons</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Toggle which right-side quick access icons (Search, Wishlist, Account, Track Order, Cart) appear in the top header.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Icon */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Search Modal</h3>
                  <p className="text-[11px] text-neutral-500">Quick product search button</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showSearch: headerSettings?.showSearch === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showSearch !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showSearch !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Wishlist */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Wishlist Heart</h3>
                  <p className="text-[11px] text-neutral-500">Customer saved items</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showWishlist: headerSettings?.showWishlist === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showWishlist !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showWishlist !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Account */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">User Account</h3>
                  <p className="text-[11px] text-neutral-500">Login / Profile icon</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showAccount: headerSettings?.showAccount === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showAccount !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showAccount !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Track Order */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Track Order</h3>
                  <p className="text-[11px] text-neutral-500">Order tracking page</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showTrackOrder: headerSettings?.showTrackOrder === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showTrackOrder !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showTrackOrder !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>

            {/* Cart */}
            <div className="p-4 bg-white border border-neutral-200 rounded-3xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-neutral-100 rounded-2xl text-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black">Shopping Bag / Cart</h3>
                  <p className="text-[11px] text-neutral-500">Cart drawer & counter</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateHeaderSettings({
                    showCart: headerSettings?.showCart === false ? true : false,
                  })
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  headerSettings?.showCart !== false ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                {headerSettings?.showCart !== false ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT HERO BANNER WITH DIRECT HAND ZOOM & PAN */}
      {/* ============================================================== */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8 text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black flex items-center gap-2">
                  <Hand className="w-5 h-5 text-black" />
                  {editingBannerId ? 'Edit Hero Banner (Hand Zoom & Align)' : 'Add New Hero Banner (Hand Zoom & Align)'}
                </h3>
                <p className="text-xs text-neutral-500">Touch/drag image directly with hand to reposition, scroll/pinch to zoom.</p>
              </div>
              <button
                onClick={() => setShowBannerModal(false)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              
              {/* INTERACTIVE HAND DRAG & ZOOM CANVAS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-black flex items-center gap-1.5 uppercase tracking-wider">
                    <Hand className="w-4 h-4 text-amber-500" />
                    <span>Direct Hand Gesture Canvas (Drag to Move • Scroll/Pinch to Zoom)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-black text-white text-[11px] font-mono font-black rounded-lg">
                      {zoomPercent}%
                    </span>
                    {(panX !== 0 || panY !== 0 || zoomPercent !== 100) && (
                      <button
                        type="button"
                        onClick={handleResetPositionAndZoom}
                        className="px-2 py-0.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Reset to center & 100% zoom"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>

                <div
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                  onWheel={handleCanvasWheel}
                  className={`relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-neutral-950 border-2 transition-all select-none ${
                    isInteracting ? 'border-amber-400 cursor-grabbing shadow-lg' : 'border-neutral-700 cursor-grab shadow-md hover:border-neutral-500'
                  }`}
                >
                  {bannerForm.image ? (
                    <img
                      src={bannerForm.image}
                      alt="Banner Canvas"
                      draggable={false}
                      style={{
                        transform: `translate(${panX}px, ${panY}px) scale(${bannerForm.imageScale || 1})`,
                        transformOrigin: 'center center',
                      }}
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-75 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 text-xs gap-1">
                      <ImageIcon className="w-6 h-6 text-neutral-600" />
                      <span>Upload or paste image below to adjust</span>
                    </div>
                  )}

                  {/* Visual Cropper Grid lines during interaction */}
                  <div className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${isInteracting ? 'opacity-40' : 'opacity-15'}`}>
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 border border-white/40">
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-r border-b border-white/30" />
                      <div className="border-b border-white/30" />
                      <div className="border-r border-white/30" />
                      <div className="border-r border-white/30" />
                      <div />
                    </div>
                  </div>

                  {/* Gradient Overlay for live typography preview */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 p-3.5 flex flex-col justify-between pointer-events-none">
                    <div className="flex items-center justify-between">
                      {bannerForm.badge ? (
                        <span className="px-2 py-0.5 bg-black/60 text-amber-400 border border-white/20 text-[9px] font-black uppercase tracking-wider rounded-full backdrop-blur-sm">
                          {bannerForm.badge}
                        </span>
                      ) : <div />}
                      <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-white text-[9px] font-bold rounded-lg border border-white/20">
                        ✋ Touch / Drag with Hand
                      </span>
                    </div>

                    <div>
                      <h4 className="text-white text-sm sm:text-base font-extrabold line-clamp-1">{bannerForm.title || 'Headline Title'}</h4>
                      <p className="text-neutral-300 text-[10px] sm:text-xs line-clamp-1">{bannerForm.subtitle || 'Subtitle / Description text'}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-white text-black text-[9px] font-bold rounded-full">
                          {bannerForm.ctaText || 'Shop Now'}
                        </span>
                        <span className="text-[9px] text-emerald-300 font-mono bg-black/70 px-2 py-0.5 rounded-full border border-emerald-400/30 truncate max-w-[200px]">
                          👉 Direct Link: {bannerForm.ctaLink || '/products'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Quick Hand Zoom Buttons on the Canvas */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustZoomStep(-0.15);
                      }}
                      className="p-1.5 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                      title="Zoom Out with Hand"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdjustZoomStep(0.15);
                      }}
                      className="p-1.5 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                      title="Zoom In with Hand"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetPositionAndZoom();
                      }}
                      className="p-1.5 bg-black/80 hover:bg-black text-white rounded-lg backdrop-blur-md border border-white/20 cursor-pointer shadow-md active:scale-95"
                      title="Center & Reset"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Hand Zoom Slider Fine-Tuner */}
                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-neutral-700">
                    <span className="flex items-center gap-1 text-neutral-500">
                      <ZoomOut className="w-3.5 h-3.5" /> 50%
                    </span>
                    <span className="text-black font-extrabold flex items-center gap-1">
                      <Hand className="w-3.5 h-3.5 text-black" /> Zoom Scale: {zoomPercent}% (X: {panX}px, Y: {panY}px)
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500">
                      300% <ZoomIn className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={bannerForm.imageScale || 1}
                    onChange={(e) => setBannerForm({ ...bannerForm, imageScale: parseFloat(e.target.value) })}
                    className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg appearance-none"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-neutral-500 mr-1">Quick Presets:</span>
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
                        onClick={() => setBannerForm({ ...bannerForm, imageScale: preset.scale })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          bannerForm.imageScale === preset.scale
                            ? 'bg-black text-white shadow-sm'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* IMAGE UPLOAD / URL */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Banner Image URL / Upload *</label>
                <DragDropImagePicker
                  label="Hero Banner Photo Upload"
                  value={bannerForm.image}
                  onChange={(url) => setBannerForm({ ...bannerForm, image: url })}
                  helperText="Upload banner image or paste an image URL."
                />
              </div>

              {/* DIRECT CLICK REDIRECTION CARD */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-black" />
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                    Banner Click Redirect Destination *
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-500">
                  When customers click anywhere on this banner, choose what category or product opens:
                </p>

                {/* Redirect Mode Segmented Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLinkModeChange('category')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      bannerLinkMode === 'category'
                        ? 'bg-black text-white shadow-subtle'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Store Category</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkModeChange('product')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      bannerLinkMode === 'product'
                        ? 'bg-black text-white shadow-subtle'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Specific Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkModeChange('custom')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      bannerLinkMode === 'custom'
                        ? 'bg-black text-white shadow-subtle'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Custom Link</span>
                  </button>
                </div>

                {/* Sub-selector based on mode */}
                {bannerLinkMode === 'category' && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">Select Category:</label>
                    <select
                      value={selectedBannerCategory}
                      onChange={(e) => handleSelectBannerCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          📁 {c.name} ({c.itemCount || 0} items)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                      Destination: /products?category={encodeURIComponent(selectedBannerCategory || '')}
                    </p>
                  </div>
                )}

                {bannerLinkMode === 'product' && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">Select Specific Product:</label>
                    <select
                      value={selectedBannerProductId}
                      onChange={(e) => handleSelectBannerProduct(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold focus:ring-1 focus:ring-black"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          📦 {p.name} — ₹{p.price} ({p.category})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                      Destination: /product/{selectedBannerProductId}
                    </p>
                  </div>
                )}

                {bannerLinkMode === 'custom' && (
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">Custom Link / Path:</label>
                    <input
                      type="text"
                      placeholder="e.g. /products?filter=bestsellers or /products"
                      value={customBannerLink}
                      onChange={(e) => handleCustomLinkChange(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-mono font-medium focus:ring-1 focus:ring-black"
                    />
                  </div>
                )}
              </div>

              {/* BANNER TEXT & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Badge / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g. Grandma's Special Recipe"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Button Text (CTA)</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Now"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Headline Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Andhra Avakaya & Pickles"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prepared at home with 100% pure cold-pressed oils..."
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Banner Slide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT HEADER CATEGORY / MENU */}
      {/* ============================================================== */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl my-8 text-left max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black">
                  {editingMenuId ? 'Edit Header Category / Menu' : 'Add New Header Category / Menu'}
                </h3>
                <p className="text-xs text-neutral-500">Configure title, link, and dropdown items.</p>
              </div>
              <button
                onClick={() => setShowMenuModal(false)}
                className="p-1 text-neutral-400 hover:text-black rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Menu Title / Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPECIAL OFFERS or PICKLES"
                    value={menuForm.label}
                    onChange={(e) => setMenuForm({ ...menuForm, label: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Main Destination Link *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /products?filter=offers or /products"
                    value={menuForm.path}
                    onChange={(e) => setMenuForm({ ...menuForm, path: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl focus:ring-1 focus:ring-black focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSpecialCheck"
                  checked={menuForm.isSpecial}
                  onChange={(e) => setMenuForm({ ...menuForm, isSpecial: e.target.checked })}
                  className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
                />
                <label htmlFor="isSpecialCheck" className="text-xs font-bold text-neutral-800 cursor-pointer">
                  Highlight as Special Offer / Featured Link (accent tag)
                </label>
              </div>

              {/* DROPDOWN SUB-ITEMS BUILDER */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-black" />
                    <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                      Dropdown Sub-Menu Items ({menuForm.subCategories.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-neutral-500">Opens when user hovers on this menu</span>
                </div>

                {/* Sub-item creator form */}
                <div className="p-3 bg-white border border-neutral-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span>Add Item From:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'category'}
                        onChange={() => setSubItemType('category')}
                      />
                      <span>Store Category</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'product'}
                        onChange={() => setSubItemType('product')}
                      />
                      <span>Specific Product</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="subType"
                        checked={subItemType === 'custom'}
                        onChange={() => setSubItemType('custom')}
                      />
                      <span>Custom Promo Link</span>
                    </label>
                  </div>

                  {/* If Category */}
                  {subItemType === 'category' && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedCatName}
                        onChange={(e) => setSelectedCatName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubItem}
                        disabled={!selectedCatName}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        + Add Category
                      </button>
                    </div>
                  )}

                  {/* If Product */}
                  {subItemType === 'product' && (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedProdId}
                        onChange={(e) => setSelectedProdId(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.category}) - ₹{p.price}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubItem}
                        disabled={!selectedProdId}
                        className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        + Add Product
                      </button>
                    </div>
                  )}

                  {/* If Custom */}
                  {subItemType === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Label (e.g. 5% OFF Coupon Code)"
                        value={customSubLabel}
                        onChange={(e) => setCustomSubLabel(e.target.value)}
                        className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Path (e.g. /products?category=Gift%20Boxes)"
                          value={customSubPath}
                          onChange={(e) => setCustomSubPath(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium"
                        />
                        <button
                          type="button"
                          onClick={handleAddSubItem}
                          disabled={!customSubLabel.trim() || !customSubPath.trim()}
                          className="px-3 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub-items List */}
                <div className="space-y-2">
                  {menuForm.subCategories.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2 text-center">
                      No sub-items added. This menu item will act as a direct single link without a dropdown.
                    </p>
                  ) : (
                    menuForm.subCategories.map((sub, sIdx) => (
                      <div
                        key={sub.id || sIdx}
                        className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                          <span className="font-bold text-neutral-900 truncate">{sub.label}</span>
                          <span className="text-[11px] text-neutral-400 truncate">({sub.path})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubItem(sub.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-neutral-800 transition-all cursor-pointer shadow-subtle"
                >
                  Save Header Category Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
